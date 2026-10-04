import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  type EventInput,
} from "@/lib/events";
import { missingComplianceForPublish } from "@/lib/compliance";
import { rejectCrossOrigin, denied } from "@/lib/apiGuards";
import { isUuid, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return denied(req, 403, { actorId: admin.id });

  const supabase = await createClient();
  const event = await getEventById(supabase, params.id);
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return denied(req, 403, { actorId: admin.id });

  let body: Partial<EventInput>;
  try {
    body = (await req.json()) as Partial<EventInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = await createClient();

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

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (admin.role !== "super_admin")
    return denied(req, 403, { actorId: admin.id, message: "Only a super admin can delete events." });

  const limited = await enforceRateLimit(req, { name: "event-delete", limit: 20, windowSec: 3600, key: admin.id });
  if (limited) return limited;

  try {
    const supabase = await createClient();
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
