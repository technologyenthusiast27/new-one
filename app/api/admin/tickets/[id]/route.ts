import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import { updateTicketStatus } from "@/lib/tickets";
import type { TicketStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: TicketStatus[] = ["confirmed", "checked_in", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const status = body.status as TicketStatus;
  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const supabase = createClient();
    // checked_in_by is the acting admin's profile id (audit trail).
    const ticket = await updateTicketStatus(supabase, params.id, status, admin.id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[admin/tickets PATCH] failed:", err);
    return NextResponse.json({ error: "Could not update the ticket." }, { status: 500 });
  }
}
