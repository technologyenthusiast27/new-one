import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminContext } from "./types";

/**
 * Where an event_admin should land / be redirected to: their (first) assigned
 * event page, addressed by slug. Falls back to the login page when they have no
 * assigned event (nothing to show). Super admins never use this — they land on
 * the cross-event dashboard at /admin.
 */
export async function eventAdminLandingPath(
  supabase: SupabaseClient,
  admin: AdminContext,
): Promise<string> {
  if (admin.eventIds.length === 0) return "/admin/login";
  const { data } = await supabase
    .from("events")
    .select("slug")
    .eq("id", admin.eventIds[0])
    .maybeSingle();
  return data?.slug
    ? `/admin/events/${data.slug}`
    : `/admin/events/${admin.eventIds[0]}`;
}
