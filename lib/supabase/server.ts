import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-bound server Supabase client (anon key + the caller's auth cookie).
 * Used by Server Components, middleware, and admin API routes to read the
 * caller's session so RLS scopes what they can see. RLS applies.
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
              cookieStore.set(name, value, options),
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

import type { AdminContext } from "@/lib/types";

/**
 * Returns the current authenticated admin's context (identity, role and the
 * events they may manage), or null if the caller is not signed in or not an
 * admin. This is the single server-side authorization source for /admin.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "event_admin")) {
    return null;
  }

  let eventIds: string[] = [];
  if (profile.role === "event_admin") {
    const { data: rows } = await supabase
      .from("event_admins")
      .select("event_id")
      .eq("user_id", user.id);
    eventIds = (rows ?? []).map((r) => r.event_id as string);
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    eventIds,
  };
}

/** Whether this admin may manage the given event id. */
export function canAccessEvent(admin: AdminContext, eventId: string): boolean {
  return admin.role === "super_admin" || admin.eventIds.includes(eventId);
}

/** Back-compat alias — existing routes call getAdminProfile(). */
export const getAdminProfile = getAdminContext;
