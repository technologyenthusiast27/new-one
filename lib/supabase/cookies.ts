/**
 * Hardened attributes for Supabase auth cookies.
 *
 * httpOnly is safe because ALL auth flows (login, MFA, logout) run through
 * server route handlers — no browser JavaScript ever needs to read the session
 * cookie, so XSS cannot exfiltrate tokens. Edge-safe (no Node APIs).
 */
export interface CookieAttrs {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
}

export function hardenAuthCookie(options: CookieAttrs | undefined): CookieAttrs {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (options?.sameSite as CookieAttrs["sameSite"]) ?? "lax",
    path: options?.path ?? "/",
  };
}
