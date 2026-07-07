import { NextResponse } from "next/server";
import { updateTicketStatus } from "@/lib/store";
import { isAuthorized } from "@/lib/auth";
import type { TicketStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: TicketStatus[] = ["confirmed", "checked-in", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let status: TicketStatus;
  try {
    ({ status } = (await req.json()) as { status: TicketStatus });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await updateTicketStatus(params.id, status);
  if (!updated) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json({ ticket: updated });
}
