import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicket } from "@/lib/tickets";
import { renameAttendees, getAttendeesForBooking } from "@/lib/attendees";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { renameAttendeesSchema } from "@/lib/schemas";
import { isBookingId, rateLimit, clientIp, cleanName } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Purchaser self-service: rename the guests on a booking before the event.
 * Authority is possession of the booking link (same trust model as viewing the
 * ticket page or its QR codes). Only names change here — never check-in status
 * or codes — and every update is scoped to this booking id.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  if (!isBookingId(params.id)) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  const rl = rateLimit(`guests:${clientIp(req)}:${params.id}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many updates. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const parsed = await readJson(req, renameAttendeesSchema);
  if (!parsed.ok) return parsed.response;

  const supabase = createAdminClient();

  // The booking must exist. Cancelled bookings are locked.
  const ticket = await getTicket(supabase, params.id);
  if (!ticket) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (ticket.status === "cancelled") {
    return NextResponse.json({ error: "This booking is cancelled." }, { status: 409 });
  }

  // Sanitize each name; blank clears back to a placeholder (null).
  const updates = parsed.data.names.map((n) => ({
    seatIndex: n.seatIndex,
    name: cleanName(n.name),
  }));

  try {
    const attendees = await renameAttendees(supabase, params.id, updates);
    return NextResponse.json({ attendees });
  } catch (err) {
    console.error("[booking/attendees PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update guest names." }, { status: 500 });
  }
}
