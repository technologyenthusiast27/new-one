import { createClient } from "@/lib/supabase/server";
import { listAllEvents } from "@/lib/events";
import { EventsManager } from "@/components/admin/EventsManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = createClient();
  const events = await listAllEvents(supabase);
  return <EventsManager initialEvents={events} />;
}
