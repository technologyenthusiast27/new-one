import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import { listEventsForAdmin, createEvent, type EventInput } from "@/lib/events";
import { missingComplianceForPublish } from "@/lib/compliance";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { logAdminAction } from "@/lib/audit";
import { clientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = await createClient();
  // Scope the list to the caller: event admins never receive events they are
  // not assigned to (defence in depth beyond RLS, which allows reading any
  // published event).
  const events = await listEventsForAdmin(supabase, admin);
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Only a super admin can create events." }, { status: 403 });

  let body: EventInput;
  try {
    body = (await req.json()) as EventInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.slug || !body.code || !body.name || !body.presenter || !body.eventDate) {
    return NextResponse.json(
      { error: "slug, code, name, presenter and eventDate are required." },
      { status: 400 },
    );
  }

  // Block publishing until mandatory compliance info is complete.
  if (body.status === "published") {
    const missing = missingComplianceForPublish(body.compliance);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Complete these before publishing: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }
  }

  try {
    const supabase = await createClient();
    const event = await createEvent(supabase, body);
    await logAdminAction({
      actorId: admin.id,
      action: "event.create",
      eventId: event.id,
      targetType: "event",
      targetId: event.id,
      metadata: { slug: event.slug, status: event.status },
      ip: clientIp(req),
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[admin/events POST] failed:", err);
    return NextResponse.json({ error: "Could not create the event." }, { status: 500 });
  }
}
