import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attendee, AttendeeStatus } from "./types";

interface AttendeeRow {
  id: string;
  booking_id: string;
  event_id: string;
  seat_index: number;
  name: string | null;
  email: string | null;
  status: AttendeeStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  ticket_code: string;
  qr_code: string | null;
}

export function mapAttendee(row: AttendeeRow): Attendee {
  return {
    id: row.id,
    bookingId: row.booking_id,
    eventId: row.event_id,
    seatIndex: row.seat_index,
    name: row.name,
    email: row.email,
    status: row.status,
    checkedInAt: row.checked_in_at,
    checkedInBy: row.checked_in_by,
    ticketCode: row.ticket_code,
    qrCode: row.qr_code,
  };
}

const COLS = "*";

/** Per-seat unique code, e.g. NL-HOB-VIP-3F7A2C-01. */
export function attendeeCode(bookingId: string, seatIndex: number): string {
  return `${bookingId}-${String(seatIndex).padStart(2, "0")}`;
}

export interface NewAttendee {
  seatIndex: number;
  name: string | null;
}

/**
 * Create one attendee per seat for a booking. Seat names come from the names
 * captured at checkout (aligned to seat order). When a name is blank we store
 * null so the UI can render a "Guest #N" placeholder — except seat 1, which
 * falls back to the buyer's name so the purchaser is always identifiable.
 */
export async function createAttendeesForBooking(
  supabase: SupabaseClient,
  params: {
    bookingId: string;
    eventId: string;
    seats: number;
    buyerName: string;
    names?: (string | null)[];
  },
): Promise<Attendee[]> {
  const names = params.names ?? [];
  const rows = Array.from({ length: Math.max(1, params.seats) }, (_, i) => {
    const seatIndex = i + 1;
    const code = attendeeCode(params.bookingId, seatIndex);
    const provided = names[i];
    const name =
      provided && provided.trim().length > 0
        ? provided.trim()
        : seatIndex === 1
          ? params.buyerName
          : null;
    return {
      booking_id: params.bookingId,
      event_id: params.eventId,
      seat_index: seatIndex,
      name,
      ticket_code: code,
      qr_code: `/ticket/a/${code}`,
    };
  });

  const { data, error } = await supabase
    .from("attendees")
    .upsert(rows, { onConflict: "booking_id,seat_index", ignoreDuplicates: true })
    .select(COLS);
  if (error) throw error;
  return (data as AttendeeRow[] | null)?.map(mapAttendee) ?? [];
}

/**
 * Rename attendees within a booking (purchaser self-service before the event).
 * Only names are mutable here — never status or codes. Each update is scoped to
 * the given booking id so one booking's link can't touch another's guests.
 */
export async function renameAttendees(
  supabase: SupabaseClient,
  bookingId: string,
  updates: { seatIndex: number; name: string | null }[],
): Promise<Attendee[]> {
  for (const u of updates) {
    const { error } = await supabase
      .from("attendees")
      .update({ name: u.name })
      .eq("booking_id", bookingId)
      .eq("seat_index", u.seatIndex);
    if (error) throw error;
  }
  return getAttendeesForBooking(supabase, bookingId);
}

export async function getAttendeesForBooking(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<Attendee[]> {
  const { data, error } = await supabase
    .from("attendees")
    .select(COLS)
    .eq("booking_id", bookingId)
    .order("seat_index", { ascending: true });
  if (error) throw error;
  return (data as AttendeeRow[]).map(mapAttendee);
}

export async function getAttendeeByCode(
  supabase: SupabaseClient,
  ticketCode: string,
): Promise<Attendee | null> {
  const { data, error } = await supabase
    .from("attendees")
    .select(COLS)
    .eq("ticket_code", ticketCode)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAttendee(data as AttendeeRow) : null;
}

/** All attendees for an event (admin). */
export async function listAttendeesForEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Attendee[]> {
  const { data, error } = await supabase
    .from("attendees")
    .select(COLS)
    .eq("event_id", eventId)
    .order("booking_id", { ascending: true })
    .order("seat_index", { ascending: true });
  if (error) throw error;
  return (data as AttendeeRow[]).map(mapAttendee);
}

/** Check in / undo a single attendee by its ticket code. */
export async function setAttendeeStatus(
  supabase: SupabaseClient,
  ticketCode: string,
  status: AttendeeStatus,
  checkedInBy?: string | null,
): Promise<Attendee | null> {
  const patch: Record<string, unknown> = { status };
  if (status === "checked_in") {
    patch.checked_in_at = new Date().toISOString();
    patch.checked_in_by = checkedInBy ?? null;
  } else {
    patch.checked_in_at = null;
    patch.checked_in_by = null;
  }
  const { data, error } = await supabase
    .from("attendees")
    .update(patch)
    .eq("ticket_code", ticketCode)
    .select(COLS)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAttendee(data as AttendeeRow) : null;
}

/** Attendee check-in totals for an event (guest-level, not booking-level). */
export async function getEventCheckinCounts(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ total: number; checkedIn: number }> {
  const { count: total } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  const { count: checkedIn } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "checked_in");
  return { total: total ?? 0, checkedIn: checkedIn ?? 0 };
}
