import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { mfaUnenrollSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requestContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Disable MFA for the signed-in admin. Requires a CURRENT aal2 session —
 * a stolen aal1 session can never remove the second factor. Recovery codes
 * are wiped alongside the factor.
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const limited = await enforceRateLimit(req, { name: "mfa-unenroll", limit: 5, windowSec: 300 });
  if (limited) return limited;

  const parsed = await readJson(req, mfaUnenrollSchema);
  if (!parsed.ok) return parsed.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // aal2 required to remove a factor.
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.json(
        { error: "Verify your authenticator code before disabling MFA." },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not verify session level." }, { status: 500 });
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: parsed.data.factorId });
  if (error) {
    return NextResponse.json({ error: error.message || "Could not disable MFA." }, { status: 400 });
  }

  // Wipe recovery codes too (best-effort — table may not exist yet).
  try {
    await createAdminClient().from("mfa_recovery_codes").delete().eq("user_id", user.id);
  } catch {
    /* non-fatal */
  }

  void logAdminAction({ actorId: user.id, action: "auth.mfa_unenrolled", ...requestContext(req) });
  return NextResponse.json({ ok: true });
}
