import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventById } from "@/lib/events";
import {
  getOrderByRazorpayId,
  markOrderPaid,
  markOrderFailed,
} from "@/lib/orders";
import {
  issueTicket,
  getTicketByOrderId,
  makeTicketId,
} from "@/lib/tickets";
import { generateQrDataUrl } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { createAttendeesForBooking } from "@/lib/attendees";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { verifySchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const limited = await enforceRateLimit(req, { name: "verify", limit: 20, windowSec: 60 });
  if (limited) return limited;

  const parsed = await readJson(req, verifySchema);
  if (!parsed.ok) return parsed.response;
  const { orderId, paymentId } = parsed.data;
  const signature = parsed.data.signature ?? "";

  const supabase = createAdminClient();

  // Everything about this purchase is read from the server-side order row —
  // the client cannot influence ticket type, quantity, amount, or buyer here.
  const order = await getOrderByRazorpayId(supabase, orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Idempotency + race guard: only the first verify flips created → paid.
  const claimed = await markOrderPaid(supabase, orderId, paymentId, signature);

  if (!claimed) {
    // Already processed (replay/double-click) or previously failed.
    if (order.status === "paid") {
      const existing = await getTicketByOrderId(supabase, order.id);
      if (existing) {
        return NextResponse.json({
          ticketId: existing.id,
          emailSent: false,
          demo: existing.isDemo,
          replay: true,
        });
      }
    }
    return NextResponse.json(
      { error: "This order can no longer be completed." },
      { status: 409 },
    );
  }

  // First successful claim: verify the signature. Demo orders always pass.
  const ok = verifySignature({ orderId, paymentId, signature });
  if (!ok) {
    await markOrderFailed(supabase, orderId, "signature-mismatch");
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const event = await getEventById(supabase, order.eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  // Read the ticket type once for its snapshot fields (name/code/seats).
  const { data: tt } = await supabase
    .from("ticket_types")
    .select("code, name, seats_per_ticket")
    .eq("id", order.ticketTypeId)
    .single();
  const ttCode = (tt?.code as string) ?? "GEN";
  const ttName = (tt?.name as string) ?? "General";
  const seats = ((tt?.seats_per_ticket as number) ?? 1) * order.quantity;

  const id = makeTicketId(event.code, ttCode);

  try {
    const ticket = await issueTicket(supabase, {
      id,
      orderId: order.id,
      eventId: order.eventId,
      ticketTypeId: order.ticketTypeId,
      ticketTypeName: ttName,
      ticketTypeCode: ttCode,
      quantity: order.quantity,
      seats,
      amountInr: order.amountInr,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      isDemo: order.isDemo,
    });

    // Generate one attendee per seat — each gets its own code + QR. Names come
    // from the guest names captured at checkout (stored on the order).
    const attendees = await createAttendeesForBooking(supabase, {
      bookingId: ticket.id,
      eventId: order.eventId,
      seats,
      buyerName: order.buyerName,
      names: order.guestNames,
    });

    // Fire-and-forget email carrying a QR per attendee; never blocks issuance.
    let emailSent = false;
    try {
      const withQr = await Promise.all(
        attendees.map(async (a) => ({
          attendee: a,
          qrDataUrl: await generateQrDataUrl(`${siteUrl()}/ticket/a/${a.ticketCode}`),
        })),
      );
      const res = await sendTicketEmail(event, ticket, withQr);
      emailSent = res.sent;
    } catch (err) {
      console.error("[verify] email failed:", err);
    }

    return NextResponse.json({ ticketId: ticket.id, emailSent, demo: ticket.isDemo });
  } catch (err) {
    console.error("[verify] ticket issuance failed:", err);
    return NextResponse.json(
      { error: "Payment succeeded but the ticket could not be issued. Contact support." },
      { status: 500 },
    );
  }
}
