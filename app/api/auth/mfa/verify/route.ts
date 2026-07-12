import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { mfaVerifySchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { consumeRecoveryCode, deleteAllTotpFactors } from "@/lib/mfa";
import { logAdminAction, requestContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Second login step. Two paths:
 *  - { code }: verify a 6-digit TOTP code → session upgraded to aal2.
 *  - { recoveryCode }: single-use recovery code (password already proven —
 *    caller is signed in at aal1). Consumes the code, removes the account's
 *    TOTP factors and tells the client to re-enroll. Heavily rate limited and
 *    audit logged.
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const parsed = await readJson(req, mfaVerifySchema);
  if (!parsed.ok) return parsed.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const ctx = requestContext(req);

  // ── Recovery-code path ──
  if (parsed.data.recoveryCode) {
    // Keyed by ACCOUNT, not IP: guesses can't be spread across source IPs.
    const limited = await enforceRateLimit(req, { name: "mfa-recover", limit: 3, windowSec: 3600, key: user.id });
    if (limited) return limited;

    const ok = await consumeRecoveryCode(user.id, parsed.data.recoveryCode);
    if (!ok) {
      void logAdminAction({ actorId: user.id, action: "auth.recovery_code_failed", ...ctx });
      return NextResponse.json({ error: "Invalid recovery code." }, { status: 400 });
    }

    try {
      await deleteAllTotpFactors(user.id);
    } catch (err) {
      console.error("[mfa/verify] factor removal failed:", err);
      return NextResponse.json(
        { error: "Recovery accepted but resetting MFA failed. Contact the super admin." },
        { status: 500 },
      );
    }

    void logAdminAction({ actorId: user.id, action: "auth.recovery_code_used", ...ctx });
    // Client should now route the user to /admin/security to enroll a new
    // authenticator (enforcement will require it for enforced accounts).
    return NextResponse.json({ ok: true, mfaCleared: true });
  }

  // ── TOTP path ──
  // Keyed by ACCOUNT, not IP: guesses can't be spread across source IPs.
  const limited = await enforceRateLimit(req, { name: "mfa-verify", limit: 8, windowSec: 60, key: user.id });
  if (limited) return limited;

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.find((f) => f.status === "verified") ?? factors?.totp?.[0];
  if (!totp) {
    return NextResponse.json({ error: "No authenticator is set up for this account." }, { status: 400 });
  }

  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
  if (challengeErr || !challenge) {
    return NextResponse.json({ error: "Could not start verification." }, { status: 400 });
  }

  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code: parsed.data.code!,
  });
  if (verifyErr) {
    void logAdminAction({ actorId: user.id, action: "auth.mfa_verify_failed", metadata: { phase: "login" }, ...ctx });
    return NextResponse.json({ error: "That code didn't match. Try again." }, { status: 400 });
  }

  void logAdminAction({ actorId: user.id, action: "auth.mfa_verify_success", ...ctx });
  return NextResponse.json({ ok: true });
}
