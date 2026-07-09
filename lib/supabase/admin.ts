import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 *
 * SERVER-ONLY. The `server-only` import above makes the build fail if this
 * module is ever imported into a client component. The service-role key must
 * never be exposed to the browser (it is NOT a NEXT_PUBLIC_* var).
 *
 * Used for privileged, trusted-server paths:
 *   - creating Razorpay orders + verifying payments + issuing tickets
 *   - the public /ticket/[id] exact-id lookup (tickets have no anon RLS read)
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
