import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventBySlug } from "@/lib/events";
import { getTicketTypeByCode } from "@/lib/ticketTypes";
import { createOrderRecord } from "@/lib/orders";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { createOrderSchema } from "@/lib/schemas";
import { rateLimit, clientIp, cleanName } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  // CSRF: this endpoint is only ever called from our own checkout UI.
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  // Rate limit order creation per IP to blunt abuse / card-testing loops.
  const rl = rateLimit(`order:${clientIp(req)}`, 12, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const parsed = await readJson(req, createOrderSchema);
  if (!parsed.ok) return parsed.response;
  const { ticketTypeCode, quantity, name, email, phone, guestNames } = parsed.data;

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

  const qty = Math.max(1, Math.min(ticketType.maxQtyPerOrder, Math.floor(quantity)));
  const seats = ticketType.seatsPerTicket * qty;

  // Clean and clamp guest names to the actual seat count (defence against
  // over-long arrays / control characters / oversized strings).
  const cleanedGuestNames = (guestNames ?? [])
    .slice(0, seats)
    .map((n) => cleanName(n));

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
      guestNames: cleanedGuestNames,
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
