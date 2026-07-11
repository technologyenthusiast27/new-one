import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  type EventInput,
} from "@/lib/events";
import { missingComplianceForPublish } from "@/lib/compliance";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { isUuid, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const supabase = createClient();
  const event = await getEventById(supabase, params.id);
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

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

    await logAdminAction({
      actorId: admin.id,
      action: "event.update",
      eventId: event.id,
      targetType: "event",
      targetId: event.id,
      metadata: { status: event.status },
      ip: clientIp(req),
    });

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[admin/events PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the event." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Only a super admin can delete events." }, { status: 403 });

  try {
    const supabase = createClient();
    await deleteEvent(supabase, params.id);
    await logAdminAction({
      actorId: admin.id,
      action: "event.delete",
      eventId: null,
      targetType: "event",
      targetId: params.id,
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/events DELETE] failed:", err);
    return NextResponse.json({ error: "Could not delete the event." }, { status: 500 });
  }
}
