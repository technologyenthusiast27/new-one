import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import { listTicketsForEvent, getEventStats } from "@/lib/tickets";
import { listOrdersForEvent } from "@/lib/orders";
import { listAttendeesForEvent, getEventCheckinCounts } from "@/lib/attendees";
import { isUuid } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const supabase = await createClient();
  const [tickets, stats, orders, attendees, checkins] = await Promise.all([
    listTicketsForEvent(supabase, params.id),
    getEventStats(supabase, params.id),
    listOrdersForEvent(supabase, params.id),
    listAttendeesForEvent(supabase, params.id),
    getEventCheckinCounts(supabase, params.id),
  ]);

  // Guest-level check-in totals override the booking-level "checkedIn" stat.
  const mergedStats = {
    ...stats,
    checkedIn: checkins.checkedIn,
    totalAttendees: checkins.total,
  };

  return NextResponse.json({ tickets, stats: mergedStats, orders, attendees });
}
