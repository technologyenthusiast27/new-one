import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import { getTicket, updateTicketStatus } from "@/lib/tickets";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { ticketStatusSchema } from "@/lib/schemas";
import { isBookingId, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Booking-lifecycle transitions (confirm ↔ cancel) for a whole booking. Guest
 * check-in is NOT done here — that is per-attendee via
 * /api/admin/attendees/[code]. Access is verified against the ticket's event so
 * an admin can never mutate a booking for an event they are not assigned to.
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!isBookingId(params.id)) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  const parsed = await readJson(req, ticketStatusSchema);
  if (!parsed.ok) return parsed.response;
  const { status } = parsed.data;

  try {
    const supabase = await createClient();

    // RLS already scopes reads, but we also check ownership explicitly.
    const ticket = await getTicket(supabase, params.id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    if (!canAccessEvent(admin, ticket.eventId)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const updated = await updateTicketStatus(supabase, params.id, status, admin.id);
    if (!updated) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    await logAdminAction({
      actorId: admin.id,
      action: status === "cancelled" ? "booking.cancel" : "booking.restore",
      eventId: ticket.eventId,
      targetType: "booking",
      targetId: ticket.id,
      ip: clientIp(req),
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    console.error("[admin/tickets PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the ticket." }, { status: 500 });
  }
}
