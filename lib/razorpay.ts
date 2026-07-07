import crypto from "crypto";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

/** True when real Razorpay credentials are configured. */
export const razorpayConfigured = Boolean(keyId && keySecret);

let client: Razorpay | null = null;
if (razorpayConfigured) {
  client = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
}

export interface OrderResult {
  orderId: string;
  amount: number; // in paise
  currency: string;
  demo: boolean;
}

/**
 * Create a Razorpay order. Falls back to a demo order id when no
 * credentials are set, so the whole booking flow works out of the box.
 */
export async function createOrder(amountInInr: number): Promise<OrderResult> {
  const amount = Math.round(amountInInr * 100); // paise
  if (!razorpayConfigured || !client) {
    return {
      orderId: `demo_order_${crypto.randomBytes(8).toString("hex")}`,
      amount,
      currency: "INR",
      demo: true,
    };
  }

  const order = await client.orders.create({
    amount,
    currency: "INR",
    receipt: `hob_${crypto.randomBytes(4).toString("hex")}`,
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    demo: false,
  };
}

/**
 * Verify the Razorpay payment signature. In demo mode (order id prefixed
 * with `demo_`) verification always succeeds.
 */
export function verifySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (params.orderId.startsWith("demo_")) return true;
  if (!keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  // timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
