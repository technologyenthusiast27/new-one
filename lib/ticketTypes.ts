import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketType, TicketTypeStatus } from "./types";

interface TicketTypeRow {
  id: string;
  event_id: string;
  code: string;
  name: string;
  price_inr: number;
  seats_per_ticket: number;
  tagline: string | null;
  perks: string[] | null;
  is_featured: boolean;
  sort_order: number;
  status: TicketTypeStatus;
  max_qty_per_order: number;
}

export function mapTicketType(row: TicketTypeRow): TicketType {
  return {
    id: row.id,
    eventId: row.event_id,
    code: row.code,
    name: row.name,
    priceInr: row.price_inr,
    seatsPerTicket: row.seats_per_ticket,
    tagline: row.tagline,
    perks: row.perks ?? [],
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    status: row.status,
    maxQtyPerOrder: row.max_qty_per_order,
  };
}

const COLS =
  "id, event_id, code, name, price_inr, seats_per_ticket, tagline, perks, is_featured, sort_order, status, max_qty_per_order";

/** Active ticket types for an event, ordered for display. */
export async function getActiveTicketTypes(
  supabase: SupabaseClient,
  eventId: string,
): Promise<TicketType[]> {
  const { data, error } = await supabase
    .from("ticket_types")
    .select(COLS)
    .eq("event_id", eventId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as TicketTypeRow[]).map(mapTicketType);
}

/** All ticket types for an event (admin scope). */
export async function listTicketTypes(
  supabase: SupabaseClient,
  eventId: string,
): Promise<TicketType[]> {
  const { data, error } = await supabase
    .from("ticket_types")
    .select(COLS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as TicketTypeRow[]).map(mapTicketType);
}

/** Look up one ticket type by its event-scoped code. */
export async function getTicketTypeByCode(
  supabase: SupabaseClient,
  eventId: string,
  code: string,
): Promise<TicketType | null> {
  const { data, error } = await supabase
    .from("ticket_types")
    .select(COLS)
    .eq("event_id", eventId)
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTicketType(data as TicketTypeRow) : null;
}

export interface TicketTypeInput {
  code: string;
  name: string;
  priceInr: number;
  seatsPerTicket?: number;
  tagline?: string | null;
  perks?: string[];
  isFeatured?: boolean;
  sortOrder?: number;
  status?: TicketTypeStatus;
  maxQtyPerOrder?: number;
}

function toRow(input: Partial<TicketTypeInput>) {
  const row: Record<string, unknown> = {};
  if (input.code !== undefined) row.code = input.code;
  if (input.name !== undefined) row.name = input.name;
  if (input.priceInr !== undefined) row.price_inr = input.priceInr;
  if (input.seatsPerTicket !== undefined) row.seats_per_ticket = input.seatsPerTicket;
  if (input.tagline !== undefined) row.tagline = input.tagline;
  if (input.perks !== undefined) row.perks = input.perks;
  if (input.isFeatured !== undefined) row.is_featured = input.isFeatured;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  if (input.maxQtyPerOrder !== undefined) row.max_qty_per_order = input.maxQtyPerOrder;
  return row;
}

export async function createTicketType(
  supabase: SupabaseClient,
  eventId: string,
  input: TicketTypeInput,
): Promise<TicketType> {
  const { data, error } = await supabase
    .from("ticket_types")
    .insert({ ...toRow(input), event_id: eventId })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapTicketType(data as TicketTypeRow);
}

export async function updateTicketType(
  supabase: SupabaseClient,
  id: string,
  input: Partial<TicketTypeInput>,
): Promise<TicketType | null> {
  const { data, error } = await supabase
    .from("ticket_types")
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTicketType(data as TicketTypeRow) : null;
}

export async function deleteTicketType(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("ticket_types").delete().eq("id", id);
  if (error) throw error;
}
