import { NextResponse } from "next/server";
import { getStats, listTickets } from "@/lib/store";
import { isAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [tickets, stats] = await Promise.all([listTickets(), getStats()]);
  return NextResponse.json({ tickets, stats });
}
