import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import { getAttendeeByCode, setAttendeeStatus } from "@/lib/attendees";
import { readJson, rejectCrossOrigin, denied } from "@/lib/apiGuards";
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
export async function PATCH(req: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  const limited = await enforceRateLimit(req, { name: "checkin", limit: 240, windowSec: 60, key: admin.id });
  if (limited) return limited;


  if (!isAttendeeCode(params.code)) {
    return NextResponse.json({ error: "Invalid ticket code." }, { status: 400 });
  }

  const parsed = await readJson(req, attendeeStatusSchema);
  if (!parsed.ok) return parsed.response;
  const { status } = parsed.data;

  const supabase = await createClient();

  // RLS returns the attendee only if the caller can access its event.
  const existing = await getAttendeeByCode(supabase, params.code);
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found or not permitted." }, { status: 404 });
  }
  // Explicit ownership check on top of RLS (defence in depth).
  if (!canAccessEvent(admin, existing.eventId)) {
    return denied(req, 403, { actorId: admin.id });
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
