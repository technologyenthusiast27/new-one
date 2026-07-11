import { NextResponse } from "next/server";
import type { z } from "zod";
import { isSameOrigin } from "./security";

/**
 * Parse and validate a JSON request body against a Zod schema. Returns either
 * the typed data or a ready-to-return 400 response — callers do:
 *   const parsed = await readJson(req, schema);
 *   if (!parsed.ok) return parsed.response;
 *   const { ... } = parsed.data;
 */
export async function readJson<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, response: NextResponse.json({ error: msg }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}

/**
 * CSRF guard for state-changing routes. Returns a 403 response when the request
 * is cross-origin, or null when it may proceed.
 */
export function rejectCrossOrigin(req: Request): NextResponse | null {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  return null;
}
