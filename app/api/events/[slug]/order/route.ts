import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventBySlug } from "@/lib/events";
import { getTicketTypeByCode } from "@/lib/ticketTypes";
import { createOrderRecord } from "@/lib/orders";
import type { CreateOrderPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  let body: CreateOrderPayload;
  try {
    body = (await req.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { ticketTypeCode, quantity, name, email, phone } = body;
  const supabase = createAdminClient();

  // Resolve the event by slug — must be published to sell.
  const event = await getEventBySlug(supabase, params.slug);
  if (!event || event.status !== "published") {
    return NextResponse.json({ error: "Event not available." }, { status: 404 });
  }

  // Resolve the ticket type from the DB — never trust a client-sent price.
  const ticketType = await getTicketTypeByCode(supabase, event.id, ticketTypeCode);
  if (!ticketType || ticketType.status !== "active") {
    return NextResponse.json({ error: "Unknown ticket type." }, { status: 400 });
  }

  const qty = Math.max(
    1,
    Math.min(ticketType.maxQtyPerOrder, Math.floor(Number(quantity) || 1)),
  );

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Amount is computed server-side from the DB row only.
  const amount = ticketType.priceInr * qty;

  try {
    const order = await createOrder(amount, event.code.toLowerCase());

    // Persist the order in 'created' state — the single source of truth that
    // /verify reads back from (buyer, qty, amount are never re-trusted later).
    await createOrderRecord(supabase, {
      eventId: event.id,
      ticketTypeId: ticketType.id,
      razorpayOrderId: order.orderId,
      quantity: qty,
      amountInr: amount,
      currency: order.currency,
      buyerName: name.trim(),
      buyerEmail: email.trim().toLowerCase(),
      buyerPhone: phone.trim(),
      isDemo: order.demo,
    });

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      demo: order.demo,
      ticketTypeCode: ticketType.code,
      ticketTypeName: ticketType.name,
      quantity: qty,
      amountInInr: amount,
      eventName: event.name,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    });
  } catch (err) {
    console.error("[order] failed:", err);
    return NextResponse.json(
      { error: "Could not create the order. Please try again." },
      { status: 500 },
    );
  }
}
