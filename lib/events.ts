import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgeCategory, Event, EventContent, EventStatus } from "./types";

// Row shape as stored in Postgres (snake_case).
interface EventRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  presenter: string;
  tagline: string | null;
  status: EventStatus;
  event_date: string;
  doors_open_at: string | null;
  venue_name: string | null;
  venue_city: string | null;
  currency: string;
  cover_image_url: string | null;
  content: EventContent | null;
  age_category: AgeCategory | null;
  minors_allowed: boolean | null;
  guardian_consent_required: boolean | null;
  id_required: boolean | null;
  created_at: string;
  updated_at: string;
}

export function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    presenter: row.presenter,
    tagline: row.tagline,
    status: row.status,
    eventDate: row.event_date,
    doorsOpenAt: row.doors_open_at,
    venueName: row.venue_name,
    venueCity: row.venue_city,
    currency: row.currency,
    coverImageUrl: row.cover_image_url,
    content: row.content ?? {},
    ageCategory: row.age_category ?? "18_plus",
    minorsAllowed: row.minors_allowed ?? false,
    guardianConsentRequired: row.guardian_consent_required ?? false,
    idRequired: row.id_required ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS =
  "id, slug, code, name, presenter, tagline, status, event_date, doors_open_at, venue_name, venue_city, currency, cover_image_url, content, age_category, minors_allowed, guardian_consent_required, id_required, created_at, updated_at";

/** Public homepage grid: published + coming_soon events, soonest first. */
export async function getVisibleEvents(supabase: SupabaseClient): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(COLS)
    .in("status", ["published", "coming_soon"])
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

/** All events (admin scope; relies on admin RLS or service role). */
export async function listAllEvents(supabase: SupabaseClient): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(COLS)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export async function getEventBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as EventRow) : null;
}

export async function getEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as EventRow) : null;
}

export interface EventInput {
  slug: string;
  code: string;
  name: string;
  presenter: string;
  tagline?: string | null;
  status?: EventStatus;
  eventDate: string;
  doorsOpenAt?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  currency?: string;
  coverImageUrl?: string | null;
  content?: EventContent;
  ageCategory?: AgeCategory;
  minorsAllowed?: boolean;
  guardianConsentRequired?: boolean;
  idRequired?: boolean;
}

function toRow(input: Partial<EventInput>) {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.code !== undefined) row.code = input.code.toUpperCase();
  if (input.name !== undefined) row.name = input.name;
  if (input.presenter !== undefined) row.presenter = input.presenter;
  if (input.tagline !== undefined) row.tagline = input.tagline;
  if (input.status !== undefined) row.status = input.status;
  if (input.eventDate !== undefined) row.event_date = input.eventDate;
  if (input.doorsOpenAt !== undefined) row.doors_open_at = input.doorsOpenAt;
  if (input.venueName !== undefined) row.venue_name = input.venueName;
  if (input.venueCity !== undefined) row.venue_city = input.venueCity;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.coverImageUrl !== undefined) row.cover_image_url = input.coverImageUrl;
  if (input.content !== undefined) row.content = input.content;
  if (input.ageCategory !== undefined) row.age_category = input.ageCategory;
  if (input.minorsAllowed !== undefined) row.minors_allowed = input.minorsAllowed;
  if (input.guardianConsentRequired !== undefined)
    row.guardian_consent_required = input.guardianConsentRequired;
  if (input.idRequired !== undefined) row.id_required = input.idRequired;
  return row;
}

export async function createEvent(
  supabase: SupabaseClient,
  input: EventInput,
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert(toRow(input))
    .select(COLS)
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  input: Partial<EventInput>,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as EventRow) : null;
}

export async function deleteEvent(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
