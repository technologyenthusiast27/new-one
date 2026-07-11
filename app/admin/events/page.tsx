import { redirect } from "next/navigation";
import { createClient, getAdminContext } from "@/lib/supabase/server";
import { listEventsForAdmin } from "@/lib/events";
import { EventsManager } from "@/components/admin/EventsManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  const supabase = createClient();
  const events = await listEventsForAdmin(supabase, admin);
  return <EventsManager initialEvents={events} canCreate={admin.role === "super_admin"} />;
}
