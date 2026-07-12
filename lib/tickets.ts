import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ticket, TicketStatus } from "./types";

interface TicketRow {
  id: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  ticket_type_code: string;
  quantity: number;
  seats: number;
  amount_inr: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  status: TicketStatus;
  created_at: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  is_demo: boolean;
}

export function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    orderId: row.order_id,
    eventId: row.event_id,
    ticketTypeId: row.ticket_type_id,
    ticketTypeName: row.ticket_type_name,
    ticketTypeCode: row.ticket_type_code,
    quantity: row.quantity,
    seats: row.seats,
    amountInr: row.amount_inr,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    status: row.status,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at,
    checkedInBy: row.checked_in_by,
    isDemo: row.is_demo,
  };
}

const COLS =
  "id, order_id, event_id, ticket_type_id, ticket_type_name, ticket_type_code, quantity, seats, amount_inr, buyer_name, buyer_email, buyer_phone, status, created_at, checked_in_at, checked_in_by, is_demo";

function shortId(): string {
  // 64 bits. The booking id is a bearer credential (ticket page shows buyer
  // PII; attendee QR codes derive from it), so it must be unguessable — 24
  // bits was enumerable. Old shorter ids remain valid.
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

/** Globally-unique, unguessable ticket id, e.g. NL-HOB-VIP-3F7A2C90D14B82E6. */
export function makeTicketId(eventCode: string, ticketTypeCode: string): string {
  return `NL-${eventCode.toUpperCase()}-${ticketTypeCode.toUpperCase()}-${shortId()}`;
}

export interface IssueTicketInput {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  ticketTypeCode: string;
  quantity: number;
  seats: number;
  amountInr: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  isDemo: boolean;
}

/** Insert an issued ticket. Service-role client (RLS has no anon insert). */
export async function issueTicket(
  supabase: SupabaseClient,
  input: IssueTicketInput,
): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      id: input.id,
      order_id: input.orderId,
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      ticket_type_name: input.ticketTypeName,
      ticket_type_code: input.ticketTypeCode,
      quantity: input.quantity,
      seats: input.seats,
      amount_inr: input.amountInr,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone,
      status: "confirmed",
      is_demo: input.isDemo,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapTicket(data as TicketRow);
}

export async function getTicket(
  supabase: SupabaseClient,
  id: string,
): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTicket(data as TicketRow) : null;
}

export async function getTicketByOrderId(
  supabase: SupabaseClient,
  orderId: string,
): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from("tickets")
    .select(COLS)
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTicket(data as TicketRow) : null;
}

export async function listTicketsForEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select(COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TicketRow[]).map(mapTicket);
}

export async function updateTicketStatus(
  supabase: SupabaseClient,
  id: string,
  status: TicketStatus,
  checkedInBy?: string | null,
): Promise<Ticket | null> {
  const patch: Record<string, unknown> = { status };
  if (status === "checked_in") {
    patch.checked_in_at = new Date().toISOString();
    patch.checked_in_by = checkedInBy ?? null;
  } else {
    // clearing check-in when moving back to confirmed/cancelled
    patch.checked_in_at = null;
    patch.checked_in_by = null;
  }
  const { data, error } = await supabase
    .from("tickets")
    .update(patch)
    .eq("id", id)
    .select(COLS)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTicket(data as TicketRow) : null;
}

export interface EventStats {
  totalTickets: number;
  totalRevenue: number;
  totalGuests: number;
  checkedIn: number;
  totalAttendees?: number;
  byTicketType: Record<string, { name: string; count: number; revenue: number }>;
}

/** Aggregate stats for one event — dynamic over its actual ticket types. */
export async function getEventStats(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventStats> {
  const tickets = await listTicketsForEvent(supabase, eventId);
  const byTicketType: EventStats["byTicketType"] = {};
  let totalRevenue = 0;
  let totalGuests = 0;
  let checkedIn = 0;

  for (const t of tickets) {
    if (t.status === "cancelled") continue;
    totalRevenue += t.amountInr;
    totalGuests += t.seats;
    if (t.status === "checked_in") checkedIn += 1;
    const key = t.ticketTypeCode;
    if (!byTicketType[key]) {
      byTicketType[key] = { name: t.ticketTypeName, count: 0, revenue: 0 };
    }
    byTicketType[key].count += t.quantity;
    byTicketType[key].revenue += t.amountInr;
  }

  return {
    totalTickets: tickets.filter((t) => t.status !== "cancelled").length,
    totalRevenue,
    totalGuests,
    checkedIn,
    byTicketType,
  };
}
