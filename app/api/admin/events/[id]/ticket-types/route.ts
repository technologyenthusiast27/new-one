import { NextResponse } from "next/server";
import { createClient, getAdminProfile, canAccessEvent } from "@/lib/supabase/server";
import {
  listTicketTypes,
  createTicketType,
  type TicketTypeInput,
} from "@/lib/ticketTypes";
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
  const ticketTypes = await listTicketTypes(supabase, params.id);
  return NextResponse.json({ ticketTypes });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (!isUuid(params.id))
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  if (!canAccessEvent(admin, params.id))
    return denied(req, 403, { actorId: admin.id });

  let body: TicketTypeInput;
  try {
    body = (await req.json()) as TicketTypeInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.code || !body.name || body.priceInr == null) {
    return NextResponse.json(
      { error: "code, name and priceInr are required." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const ticketType = await createTicketType(supabase, params.id, body);
    await logAdminAction({
      actorId: admin.id,
      action: "ticket_type.create",
      eventId: params.id,
      targetType: "ticket_type",
      targetId: ticketType.id,
      ip: clientIp(req),
    });
    return NextResponse.json({ ticketType }, { status: 201 });
  } catch (err) {
    console.error("[admin/ticket-types POST] failed:", err);
    return NextResponse.json({ error: "Could not create the ticket type." }, { status: 500 });
  }
}
