import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import { getAttendeeByCode, setAttendeeStatus } from "@/lib/attendees";
import type { AttendeeStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: AttendeeStatus[] = ["checked_in", "not_checked_in"];

/**
 * Check in (or undo) a single attendee by ticket code. RLS scopes this to
 * events the caller can access, so an event admin can never check in an
 * attendee for an event they are not assigned to.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { code: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const status = body.status as AttendeeStatus;
  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createClient();

  // RLS returns the attendee only if the caller can access its event.
  const existing = await getAttendeeByCode(supabase, params.code);
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found or not permitted." }, { status: 404 });
  }

  const alreadyCheckedIn =
    status === "checked_in" && existing.status === "checked_in";

  try {
    const attendee = alreadyCheckedIn
      ? existing
      : await setAttendeeStatus(supabase, params.code, status, admin.id);
    if (!attendee) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ attendee, alreadyCheckedIn });
  } catch (err) {
    console.error("[admin/attendees PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the attendee." }, { status: 500 });
  }
}
