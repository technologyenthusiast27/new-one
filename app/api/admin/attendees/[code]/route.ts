import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import { getAttendeeByCode, setAttendeeStatus } from "@/lib/attendees";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { attendeeStatusSchema } from "@/lib/schemas";
import { isAttendeeCode, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Check in (or undo) a SINGLE attendee by ticket code. Scanning one guest's QR
 * updates only that guest — never the rest of the booking. Access is enforced
 * three ways: database RLS (`can_access_event`), an explicit ownership check,
 * and the attendee code format check below.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { code: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!isAttendeeCode(params.code)) {
    return NextResponse.json({ error: "Invalid ticket code." }, { status: 400 });
  }

  const parsed = await readJson(req, attendeeStatusSchema);
  if (!parsed.ok) return parsed.response;
  const { status } = parsed.data;

  const supabase = createClient();

  // RLS returns the attendee only if the caller can access its event.
  const existing = await getAttendeeByCode(supabase, params.code);
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found or not permitted." }, { status: 404 });
  }
  // Explicit ownership check on top of RLS (defence in depth).
  if (!canAccessEvent(admin, existing.eventId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const alreadyCheckedIn =
    status === "checked_in" && existing.status === "checked_in";

  try {
    const attendee = alreadyCheckedIn
      ? existing
      : await setAttendeeStatus(supabase, params.code, status, admin.id);
    if (!attendee) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (!alreadyCheckedIn) {
      await logAdminAction({
        actorId: admin.id,
        action: status === "checked_in" ? "attendee.check_in" : "attendee.undo_check_in",
        eventId: existing.eventId,
        targetType: "attendee",
        targetId: existing.ticketCode,
        metadata: { bookingId: existing.bookingId, seatIndex: existing.seatIndex },
        ip: clientIp(req),
      });
    }

    return NextResponse.json({ attendee, alreadyCheckedIn });
  } catch (err) {
    console.error("[admin/attendees PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the attendee." }, { status: 500 });
  }
}
