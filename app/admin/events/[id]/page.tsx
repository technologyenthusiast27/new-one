import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/events";
import { listTicketTypes } from "@/lib/ticketTypes";
import { listTicketsForEvent, getEventStats } from "@/lib/tickets";
import { listOrdersForEvent } from "@/lib/orders";
import { EventDetail } from "@/components/admin/EventDetail";

export const dynamic = "force-dynamic";

export default async function AdminEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const event = await getEventById(supabase, params.id);
  if (!event) notFound();

  const [ticketTypes, tickets, stats, orders] = await Promise.all([
    listTicketTypes(supabase, event.id),
    listTicketsForEvent(supabase, event.id),
    getEventStats(supabase, event.id),
    listOrdersForEvent(supabase, event.id),
  ]);

  return (
    <EventDetail
      event={event}
      initialTicketTypes={ticketTypes}
      initialTickets={tickets}
      initialStats={stats}
      initialOrders={orders}
    />
  );
}
