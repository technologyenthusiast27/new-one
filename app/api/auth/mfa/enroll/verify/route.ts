import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { mfaEnrollVerifySchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { issueRecoveryCodes } from "@/lib/mfa";
import { logAdminAction, requestContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Complete TOTP enrollment: verify the first code from the authenticator app.
 * On success the session is upgraded to aal2 and a fresh set of single-use
 * recovery codes is issued (returned exactly once).
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const parsed = await readJson(req, mfaEnrollVerifySchema);
  if (!parsed.ok) return parsed.response;
  const { factorId, code } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Keyed by ACCOUNT, not IP: guesses can't be spread across source IPs.
  const limited = await enforceRateLimit(req, { name: "mfa-enroll-verify", limit: 10, windowSec: 300, key: user.id });
  if (limited) return limited;

  const ctx = requestContext(req);

  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeErr || !challenge) {
    return NextResponse.json({ error: "Could not start verification." }, { status: 400 });
  }

  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyErr) {
    void logAdminAction({ actorId: user.id, action: "auth.mfa_verify_failed", metadata: { phase: "enroll" }, ...ctx });
    return NextResponse.json({ error: "That code didn't match. Try again." }, { status: 400 });
  }

  void logAdminAction({ actorId: user.id, action: "auth.mfa_enrolled", ...ctx });

  // Issue recovery codes (null when migration 0007 isn't applied yet — the
  // authenticator still works; codes can be generated later).
  let recoveryCodes: string[] | null = null;
  try {
    recoveryCodes = await issueRecoveryCodes(user.id);
    if (recoveryCodes) {
      void logAdminAction({ actorId: user.id, action: "auth.recovery_codes_generated", ...ctx });
    }
  } catch (err) {
    console.error("[mfa/enroll/verify] recovery codes failed:", err);
  }

  return NextResponse.json({
    ok: true,
    recoveryCodes: recoveryCodes ?? [],
    recoveryUnavailable: recoveryCodes === null,
  });
}
