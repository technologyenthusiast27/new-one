import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus } from "./types";

interface OrderRow {
  id: string;
  event_id: string;
  ticket_type_id: string;
  razorpay_order_id: string;
  quantity: number;
  amount_inr: number;
  currency: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  status: OrderStatus;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  failure_reason: string | null;
  is_demo: boolean;
  created_at: string;
  paid_at: string | null;
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    eventId: row.event_id,
    ticketTypeId: row.ticket_type_id,
    razorpayOrderId: row.razorpay_order_id,
    quantity: row.quantity,
    amountInr: row.amount_inr,
    currency: row.currency,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    status: row.status,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpaySignature: row.razorpay_signature,
    failureReason: row.failure_reason,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

const COLS =
  "id, event_id, ticket_type_id, razorpay_order_id, quantity, amount_inr, currency, buyer_name, buyer_email, buyer_phone, status, razorpay_payment_id, razorpay_signature, failure_reason, is_demo, created_at, paid_at";

export interface CreateOrderInput {
  eventId: string;
  ticketTypeId: string;
  razorpayOrderId: string;
  quantity: number;
  amountInr: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  isDemo: boolean;
}

/** Insert a fresh order in the 'created' state. Service-role client. */
export async function createOrderRecord(
  supabase: SupabaseClient,
  input: CreateOrderInput,
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      razorpay_order_id: input.razorpayOrderId,
      quantity: input.quantity,
      amount_inr: input.amountInr,
      currency: input.currency,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone,
      status: "created",
      is_demo: input.isDemo,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapOrder(data as OrderRow);
}

export async function getOrderByRazorpayId(
  supabase: SupabaseClient,
  razorpayOrderId: string,
): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(COLS)
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

/**
 * Atomically transition an order created → paid. The `.eq("status","created")`
 * filter makes this a conditional update: only the FIRST verify wins. Returns
 * the updated order, or null if the row was already paid/failed (replay) or
 * not found — the caller then treats it as an idempotent replay.
 */
export async function markOrderPaid(
  supabase: SupabaseClient,
  razorpayOrderId: string,
  paymentId: string,
  signature: string,
): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      paid_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("status", "created")
    .select(COLS)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

export async function markOrderFailed(
  supabase: SupabaseClient,
  razorpayOrderId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "failed", failure_reason: reason })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("status", "created");
  if (error) throw error;
}

/** All orders for an event (admin analytics — payments/failures history). */
export async function listOrdersForEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(mapOrder);
}
