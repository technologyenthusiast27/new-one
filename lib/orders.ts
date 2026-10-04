import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderCompliance, OrderStatus } from "./types";

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
  compliance: OrderCompliance | null;
  guest_names: (string | null)[] | null;
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
    compliance: row.compliance ?? {},
    guestNames: Array.isArray(row.guest_names) ? row.guest_names : [],
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

// Select all columns so reads tolerate additive migrations (e.g. 0003's
// compliance column) that may not be applied yet.
const COLS = "*";

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
  compliance?: OrderCompliance;
  guestNames?: (string | null)[];
}

// Postgres "undefined column" error code — used to gracefully degrade when an
// additive migration (0003 compliance / 0006 guest_names) hasn't been applied.
const UNDEFINED_COLUMN = "42703";

/** Insert a fresh order in the 'created' state. Service-role client. */
export async function createOrderRecord(
  supabase: SupabaseClient,
  input: CreateOrderInput,
): Promise<Order> {
  const base = {
    event_id: input.eventId,
    ticket_type_id: input.ticketTypeId,
    razorpay_order_id: input.razorpayOrderId,
    quantity: input.quantity,
    amount_inr: input.amountInr,
    currency: input.currency,
    buyer_name: input.buyerName,
    buyer_email: input.buyerEmail,
    buyer_phone: input.buyerPhone,
    status: "created" as const,
    is_demo: input.isDemo,
  };

  const withExtras = {
    ...base,
    compliance: input.compliance ?? {},
    guest_names: input.guestNames ?? [],
  };

  let { data, error } = await supabase
    .from("orders")
    .insert(withExtras)
    .select(COLS)
    .single();

  // If an additive column doesn't exist yet, fall back to the base insert so
  // the booking flow still succeeds.
  if (
    error &&
    (error.code === UNDEFINED_COLUMN ||
      /compliance|guest_names/i.test(error.message))
  ) {
    ({ data, error } = await supabase
      .from("orders")
      .insert(base)
      .select(COLS)
      .single());
  }

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
