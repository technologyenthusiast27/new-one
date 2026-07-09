import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-bound server Supabase client (anon key + the caller's auth cookie).
 * Used by Server Components, middleware, and admin API routes to read the
 * caller's session so RLS scopes what they can see. RLS applies.
 */
export function createClient() {
  const cookieStore = cookies();
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

/**
 * Returns the current authenticated admin's profile, or null if the caller is
 * not signed in or not an admin. Use this to gate admin API routes.
 */
export async function getAdminProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return profile as {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
  };
}
