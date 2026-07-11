import { redirect } from "next/navigation";
import { createClient, getAdminContext } from "@/lib/supabase/server";
import { listEventsForAdmin } from "@/lib/events";
import { eventAdminLandingPath } from "@/lib/adminRoutes";
import { EventsManager } from "@/components/admin/EventsManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  const supabase = createClient();

  // The events list (and event creation) is super-admin only. Event admins are
  // locked to their own event page.
  if (admin.role !== "super_admin") {
    redirect(await eventAdminLandingPath(supabase, admin));
  }

  const events = await listEventsForAdmin(supabase, admin);
  return <EventsManager initialEvents={events} canCreate />;
}
