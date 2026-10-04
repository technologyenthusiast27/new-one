import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { loginSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { logAdminAction, requestContext, recentLoginFailures } from "@/lib/audit";

export const dynamic = "force-dynamic";

const MAX_FAILURES = 5; // per email or IP in a 15-minute window

/**
 * Server-side admin login. Routing sign-in through the server (instead of the
 * browser calling Supabase directly) gives us:
 *  - httpOnly session cookies (browser JS can never read tokens),
 *  - distributed rate limiting + brute-force lockout,
 *  - Turnstile bot verification,
 *  - auth event logging (success/failure/blocked) with IP + user agent,
 *  - session rotation on login (Supabase issues a brand-new session).
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const limited = await enforceRateLimit(req, { name: "login", limit: 10, windowSec: 60 });
  if (limited) return limited;

  const parsed = await readJson(req, loginSchema);
  if (!parsed.ok) return parsed.response;
  const email = parsed.data.email.toLowerCase();
  const { password, turnstileToken } = parsed.data;
  const ctx = requestContext(req);

  // Bot protection (no-op when Turnstile isn't configured).
  const turnstile = await verifyTurnstile(turnstileToken, ctx.ip);
  if (!turnstile.ok) {
    void logAdminAction({ actorId: null, action: "security.turnstile_failed", metadata: { email }, ...ctx });
    return NextResponse.json(
      { error: "Verification failed. Please refresh and try again." },
      { status: 403 },
    );
  }

  // Brute-force lockout: too many recent failures for this email or IP.
  const [byEmail, byIp] = await Promise.all([
    recentLoginFailures("email", email),
    recentLoginFailures("ip", ctx.ip),
  ]);
  if (byEmail >= MAX_FAILURES || byIp >= MAX_FAILURES * 3) {
    void logAdminAction({
      actorId: null,
      action: "auth.brute_force_detected",
      metadata: { email, failuresByEmail: byEmail, failuresByIp: byIp },
      ...ctx,
    });
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    void logAdminAction({
      actorId: null,
      action: "auth.login_failed",
      metadata: { email, reason: error?.code ?? error?.message ?? "unknown" },
      ...ctx,
    });
    // Deliberately generic — no account enumeration.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  void logAdminAction({ actorId: data.user.id, action: "auth.login_success", metadata: { email }, ...ctx });

  // Does this session still need a TOTP code to reach aal2?
  let mfaRequired = false;
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    mfaRequired = aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";
  } catch {
    /* fail-open: enforcement re-checks server-side everywhere */
  }

  const res = NextResponse.json({ ok: true, mfaRequired });
  // Session-lifetime markers for idle/absolute timeouts (middleware enforces).
  const now = String(Date.now());
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookies.set("nl-session-start", now, cookieOpts);
  res.cookies.set("nl-last-seen", now, cookieOpts);
  return res;
}
