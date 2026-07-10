import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  type EventInput,
} from "@/lib/events";
import { missingComplianceForPublish } from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createClient();
  const event = await getEventById(supabase, params.id);
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Partial<EventInput>;
  try {
    body = (await req.json()) as Partial<EventInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = createClient();

    // If this update results in a published event, enforce that mandatory
    // compliance info is complete — using the merged (existing + patch) state.
    const effectiveStatus = body.status;
    const existing = await getEventById(supabase, params.id);
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const willBePublished =
      (effectiveStatus ?? existing.status) === "published";
    if (willBePublished) {
      const effectiveCompliance = body.compliance ?? existing.compliance;
      const missing = missingComplianceForPublish(effectiveCompliance);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Complete these before publishing: ${missing.join(", ")}.` },
          { status: 400 },
        );
      }
    }

    const event = await updateEvent(supabase, params.id, body);
    if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ event });
  } catch (err) {
    console.error("[admin/events PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the event." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createClient();
    await deleteEvent(supabase, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/events DELETE] failed:", err);
    return NextResponse.json({ error: "Could not delete the event." }, { status: 500 });
  }
}
