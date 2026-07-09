import { NextResponse } from "next/server";
import { createClient, getAdminProfile } from "@/lib/supabase/server";
import { listTicketsForEvent, getEventStats } from "@/lib/tickets";
import { listOrdersForEvent } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createClient();
  const [tickets, stats, orders] = await Promise.all([
    listTicketsForEvent(supabase, params.id),
    getEventStats(supabase, params.id),
    listOrdersForEvent(supabase, params.id),
  ]);

  return NextResponse.json({ tickets, stats, orders });
}
