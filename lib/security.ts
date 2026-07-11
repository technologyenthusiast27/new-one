// ============================================================================
// Shared server-side security helpers.
//
// These are used by API routes and middleware to enforce authorization and
// input hygiene consistently. None of them trust client-supplied role values —
// roles and event ownership are always resolved from the database.
// ============================================================================

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `value` is a canonical UUID (used to validate [id] route params). */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

// A public ticket / booking id looks like NL-HOB-VIP-3F7A2C.
const BOOKING_ID_RE = /^NL-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]{4,}$/i;
// A per-attendee code is the booking id plus a 2+ digit seat suffix (…-01).
const ATTENDEE_CODE_RE = /^NL-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]{4,}-\d{2,}$/i;

export function isBookingId(value: unknown): value is string {
  return typeof value === "string" && BOOKING_ID_RE.test(value);
}

export function isAttendeeCode(value: unknown): value is string {
  return typeof value === "string" && ATTENDEE_CODE_RE.test(value);
}

/**
 * CSRF defence for state-changing requests. Browsers attach cookies to
 * cross-site POST/PATCH, so we require the request's Origin (or Referer) host to
 * match the host the request was actually sent to. This is deployment-agnostic
 * — it works on production, Vercel preview aliases, and custom domains without
 * any env configuration — because it compares the request against itself.
 *
 * Returns true when the request may proceed.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Some browsers omit Origin on same-origin requests — fall back to Referer.
  const referer = req.headers.get("referer");
  if (referer && host) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // Neither Origin nor Referer present: this is not a credentialed cross-site
  // browser request, so allow it (covers server-to-server callers).
  return true;
}

// ── In-memory rate limiter ────────────────────────────────────────────────
// Best-effort throttle keyed by IP+route. Note: serverless instances don't
// share memory, so this is a per-instance guard, not a global quota. It still
// meaningfully slows brute-force/abuse from a single hot instance. A shared
// store (e.g. Upstash) would be the production upgrade — see the report.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Opportunistically evict expired buckets so the map can't grow unbounded on
  // a long-lived instance (each distinct IP+route would otherwise leak a key).
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Escape a string for safe interpolation into HTML (email templates). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Normalise a free-text person name: strip control characters, collapse
 * whitespace and cap the length. Returns null for empty input so callers can
 * fall back to a placeholder.
 */
export function cleanName(value: unknown, maxLen = 80): string | null {
  if (typeof value !== "string") return null;
  // Strip ASCII control chars (0x00-0x1F, 0x7F), then collapse whitespace.
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return null;
  return stripped.slice(0, maxLen);
}
