/**
 * Cloudflare Turnstile server-side verification.
 *
 * Behaviour:
 *  - Not configured (no keys)      → verification is a no-op (feature off).
 *  - Configured, token invalid     → reject (fail-closed on bad/absent tokens).
 *  - Configured, Cloudflare down   → allow with `degraded: true` (fail-open on
 *    infrastructure outage so ticket sales never hard-depend on a third party).
 */
export const turnstileConfigured = Boolean(
  process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

export interface TurnstileResult {
  ok: boolean;
  degraded?: boolean;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  if (!turnstileConfigured) return { ok: true, degraded: true };
  if (!token) return { ok: false };

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: token,
          ...(remoteIp && remoteIp !== "unknown" ? { remoteip: remoteIp } : {}),
        }),
        // Never let a slow verifier stall checkout for long.
        signal: AbortSignal.timeout(5000),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return { ok: Boolean(data.success) };
  } catch (err) {
    console.error("[turnstile] siteverify unreachable — degrading open:", err);
    return { ok: true, degraded: true };
  }
}
