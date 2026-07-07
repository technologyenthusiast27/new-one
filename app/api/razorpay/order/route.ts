import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { PASS_MAP } from "@/lib/passes";
import type { CreateOrderPayload, PassType } from "@/lib/types";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let body: CreateOrderPayload;
  try {
    body = (await req.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { passType, quantity, name, email, phone } = body;

  const pass = PASS_MAP[passType as PassType];
  if (!pass) {
    return NextResponse.json({ error: "Unknown pass type." }, { status: 400 });
  }
  const qty = Math.max(1, Math.min(20, Math.floor(Number(quantity) || 1)));

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const amount = pass.price * qty;

  try {
    const order = await createOrder(amount);
    return NextResponse.json({
      ...order,
      passType: pass.id,
      passName: pass.name,
      quantity: qty,
      amountInInr: amount,
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
