import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import {
  updateTicketType,
  deleteTicketType,
  type TicketTypeInput,
} from "@/lib/ticketTypes";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { isUuid, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; typeId: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id) || !isUuid(params.typeId))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: Partial<TicketTypeInput>;
  try {
    body = (await req.json()) as Partial<TicketTypeInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = createClient();
    // Scoped to the event id → cannot touch another event's type.
    const ticketType = await updateTicketType(supabase, params.id, params.typeId, body);
    if (!ticketType) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await logAdminAction({
      actorId: admin.id,
      action: "ticket_type.update",
      eventId: params.id,
      targetType: "ticket_type",
      targetId: params.typeId,
      ip: clientIp(req),
    });
    return NextResponse.json({ ticketType });
  } catch (err) {
    console.error("[admin/ticket-types PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the ticket type." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; typeId: string } },
) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isUuid(params.id) || !isUuid(params.typeId))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const supabase = createClient();
    await deleteTicketType(supabase, params.id, params.typeId);
    await logAdminAction({
      actorId: admin.id,
      action: "ticket_type.delete",
      eventId: params.id,
      targetType: "ticket_type",
      targetId: params.typeId,
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ticket-types DELETE] failed:", err);
    return NextResponse.json({ error: "Could not delete the ticket type." }, { status: 500 });
  }
}
