import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { enforceRateLimit } from "@/lib/rateLimit";
import { issueRecoveryCodes } from "@/lib/mfa";
import { logAdminAction, requestContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Regenerate recovery codes. Requires a CURRENT aal2 session (an attacker with
 * only a password/aal1 session cannot mint themselves recovery codes). The old
 * set is invalidated; the new set is returned exactly once.
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const limited = await enforceRateLimit(req, { name: "recovery-regen", limit: 5, windowSec: 3600 });
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.json(
        { error: "Verify your authenticator code first." },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not verify session level." }, { status: 500 });
  }

  try {
    const codes = await issueRecoveryCodes(user.id);
    if (codes === null) {
      return NextResponse.json(
        { error: "Recovery codes are not available yet (migration 0007 pending)." },
        { status: 503 },
      );
    }
    void logAdminAction({
      actorId: user.id,
      action: "auth.recovery_codes_generated",
      ...requestContext(req),
    });
    return NextResponse.json({ recoveryCodes: codes });
  } catch (err) {
    console.error("[recovery-codes] failed:", err);
    return NextResponse.json({ error: "Could not generate recovery codes." }, { status: 500 });
  }
}
