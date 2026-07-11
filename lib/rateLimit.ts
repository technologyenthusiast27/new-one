import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rateLimit as memoryRateLimit, clientIp } from "./security";

/**
 * Distributed rate limiting (Upstash Redis, sliding window) with an automatic
 * in-memory fallback:
 *  - UPSTASH_REDIS_REST_URL/TOKEN set  → limits are enforced globally across
 *    every serverless instance.
 *  - not set, or Redis unreachable     → falls back to the per-instance
 *    in-memory limiter (best-effort), so protection degrades gracefully
 *    instead of failing open entirely or blocking traffic.
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const distributedRateLimitConfigured = Boolean(url && token);

const redis = distributedRateLimitConfigured
  ? new Redis({ url: url!, token: token! })
  : null;

// One Ratelimit instance per (limit, window) shape, reused across requests.
const limiters = new Map<string, Ratelimit>();

function upstashLimiter(limit: number, windowSec: number): Ratelimit {
  const shape = `${limit}:${windowSec}`;
  let limiter = limiters.get(shape);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "nl-rl",
    });
    limiters.set(shape, limiter);
  }
  return limiter;
}

export interface LimitResult {
  ok: boolean;
  retryAfterSec: number;
}

/** Check (and consume) one hit against `key`. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<LimitResult> {
  if (redis) {
    try {
      const r = await upstashLimiter(limit, windowSec).limit(key);
      return {
        ok: r.success,
        retryAfterSec: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      // Redis unreachable — degrade to the local limiter rather than failing.
      console.error("[rateLimit] Upstash unavailable, using memory fallback:", err);
    }
  }
  const r = memoryRateLimit(key, limit, windowSec * 1000);
  return { ok: r.ok, retryAfterSec: r.retryAfterSec };
}

export interface EnforceOptions {
  /** Route-scoped bucket name, e.g. "order" or "checkin". */
  name: string;
  limit: number;
  windowSec: number;
  /** Extra key component; defaults to the client IP. */
  key?: string;
}

/**
 * Route guard: returns a ready-to-return 429 response when over the limit,
 * or null when the request may proceed.
 */
export async function enforceRateLimit(
  req: Request,
  opts: EnforceOptions,
): Promise<NextResponse | null> {
  const key = `${opts.name}:${opts.key ?? clientIp(req)}`;
  const r = await checkRateLimit(key, opts.limit, opts.windowSec);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}
