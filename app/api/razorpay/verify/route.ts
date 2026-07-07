import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/razorpay";
import { createTicket } from "@/lib/store";
import { generateQrDataUrl } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { PASS_MAP } from "@/lib/passes";
import type { PassType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface VerifyPayload {
  orderId: string;
  paymentId: string;
  signature: string;
  passType: PassType;
  quantity: number;
  name: string;
  email: string;
  phone: string;
}

export async function POST(req: Request) {
  let body: VerifyPayload;
  try {
    body = (await req.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, paymentId, signature, passType, quantity, name, email, phone } = body;

  if (!PASS_MAP[passType]) {
    return NextResponse.json({ error: "Unknown pass type." }, { status: 400 });
  }

  const ok = verifySignature({ orderId, paymentId, signature });
  if (!ok) {
    return NextResponse.json(
      { error: "Payment verification failed. You have not been charged." },
      { status: 400 },
    );
  }

  const demo = orderId.startsWith("demo_");

  try {
    const ticket = await createTicket({
      passType,
      quantity,
      name,
      email,
      phone,
      paymentId,
      orderId,
      demo,
    });

    const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/ticket/${ticket.id}`;
    const qr = await generateQrDataUrl(ticketUrl);

    // Fire the email but don't block the response on it.
    const emailResult = await sendTicketEmail(ticket, qr).catch(() => ({
      sent: false,
      reason: "error",
    }));

    return NextResponse.json({
      ticketId: ticket.id,
      emailSent: emailResult.sent,
      demo,
    });
  } catch (err) {
    console.error("[verify] failed:", err);
    return NextResponse.json(
      { error: "Payment succeeded but we couldn't issue your ticket. Contact support." },
      { status: 500 },
    );
  }
}
