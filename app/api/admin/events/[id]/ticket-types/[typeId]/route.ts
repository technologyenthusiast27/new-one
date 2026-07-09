import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import {
  updateTicketType,
  deleteTicketType,
  type TicketTypeInput,
} from "@/lib/ticketTypes";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; typeId: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Partial<TicketTypeInput>;
  try {
    body = (await req.json()) as Partial<TicketTypeInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const ticketType = await updateTicketType(supabase, params.typeId, body);
    if (!ticketType) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ticketType });
  } catch (err) {
    console.error("[admin/ticket-types PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the ticket type." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; typeId: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createClient();
    await deleteTicketType(supabase, params.typeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ticket-types DELETE] failed:", err);
    return NextResponse.json({ error: "Could not delete the ticket type." }, { status: 500 });
  }
}
