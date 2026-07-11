import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hardenAuthCookie } from "./cookies";
import type { AdminContext } from "@/lib/types";

/**
 * Cookie-bound server Supabase client (anon key + the caller's auth cookie).
 * Used by Server Components, route handlers and middleware so RLS scopes what
 * the caller can see. Auth cookies are written httpOnly + Secure + SameSite —
 * no browser JS ever reads the session (all auth flows are server routes).
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, hardenAuthCookie(options)),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by middleware, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * Returns the current authenticated admin's context (identity, role and the
 * events they may manage), or null if the caller is not signed in, not an
 * admin, or has an MFA factor enrolled but has not completed MFA for this
 * session (aal1 with aal2 available). This is the single server-side
 * authorization source for /admin pages AND /api/admin routes.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // MFA gate: a session that has an enrolled+verified TOTP factor but has not
  // presented a code this session is NOT trusted for admin actions. Fail-open
  // only on API errors (never on an explicit aal mismatch).
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return null;
    }
  } catch {
    /* infrastructure error — fall through */
  }

  // Select * so the read tolerates additive migrations (0007 mfa_enforced)
  // that may not be applied yet.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (!profile || (role !== "super_admin" && role !== "event_admin")) {
    return null;
  }

  let eventIds: string[] = [];
  if (role === "event_admin") {
    const { data: rows } = await supabase
      .from("event_admins")
      .select("event_id")
      .eq("user_id", user.id);
    eventIds = (rows ?? []).map((r) => r.event_id as string);
  }

  return {
    id: profile.id as string,
    email: (profile.email as string | null) ?? user.email ?? null,
    fullName: (profile.full_name as string | null) ?? null,
    role,
    eventIds,
    mfaEnforced: role === "super_admin" || profile.mfa_enforced === true,
  };
}

/** Whether this admin may manage the given event id. */
export function canAccessEvent(admin: AdminContext, eventId: string): boolean {
  return admin.role === "super_admin" || admin.eventIds.includes(eventId);
}

/** Back-compat alias — existing routes call getAdminProfile(). */
export const getAdminProfile = getAdminContext;
