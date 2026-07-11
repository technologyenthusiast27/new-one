import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import { listAllEvents, createEvent, type EventInput } from "@/lib/events";
import { missingComplianceForPublish } from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createClient();
  const events = await listAllEvents(supabase);
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
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
    const supabase = createClient();
    const event = await createEvent(supabase, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[admin/events POST] failed:", err);
    return NextResponse.json({ error: "Could not create the event." }, { status: 500 });
  }
}
