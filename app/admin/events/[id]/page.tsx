import { notFound, redirect } from "next/navigation";
import { createClient, getAdminContext, canAccessEvent } from "@/lib/supabase/server";
import { getEventByIdOrSlug } from "@/lib/events";
import { listTicketTypes } from "@/lib/ticketTypes";
import { listTicketsForEvent, getEventStats } from "@/lib/tickets";
import { listOrdersForEvent } from "@/lib/orders";
import { listAttendeesForEvent, getEventCheckinCounts } from "@/lib/attendees";
import { EventDetail } from "@/components/admin/EventDetail";

export const dynamic = "force-dynamic";

export default async function AdminEventPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const event = await getEventByIdOrSlug(supabase, params.id);
  if (!event) notFound();

  // Authoritative server-side per-event authorization (never trust the UI).
  if (!canAccessEvent(admin, event.id)) notFound();

  const [ticketTypes, tickets, stats, orders, attendees, checkins] =
    await Promise.all([
      listTicketTypes(supabase, event.id),
      listTicketsForEvent(supabase, event.id),
      getEventStats(supabase, event.id),
      listOrdersForEvent(supabase, event.id),
      listAttendeesForEvent(supabase, event.id),
      getEventCheckinCounts(supabase, event.id),
    ]);

  return (
    <EventDetail
      event={event}
      role={admin.role}
      initialTicketTypes={ticketTypes}
      initialTickets={tickets}
      initialStats={{ ...stats, checkedIn: checkins.checkedIn, totalAttendees: checkins.total }}
      initialOrders={orders}
      initialAttendees={attendees}
    />
  );
}
