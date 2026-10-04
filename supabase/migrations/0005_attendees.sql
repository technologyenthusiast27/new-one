-- ============================================================================
-- NovaLabs.club — Migration 0005: attendee-based ticketing
-- ============================================================================
-- A booking (tickets row) that admits N seats now has N attendees, each with a
-- unique code + QR and its own check-in state. Backfills attendees for every
-- existing booking so current data keeps working.
-- ============================================================================

create table if not exists public.attendees (
  id            uuid primary key default gen_random_uuid(),
  booking_id    text not null references public.tickets(id) on delete cascade,
  event_id      uuid not null references public.events(id),   -- denormalized for RLS
  seat_index    integer not null,                              -- 1..seats
  name          text,
  email         text,
  status        text not null default 'not_checked_in'
                  check (status in ('not_checked_in','checked_in')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  ticket_code   text unique not null,                          -- e.g. NL-HOB-VIP-3F7A2C-01
  qr_code       text,                                          -- encoded QR payload (attendee URL)
  created_at    timestamptz not null default now(),
  unique (booking_id, seat_index)
);
create index if not exists attendees_booking_idx on public.attendees(booking_id);
create index if not exists attendees_event_idx on public.attendees(event_id);
create index if not exists attendees_status_idx on public.attendees(status);

alter table public.attendees enable row level security;

-- Admins may read/update attendees for events they can access. No anon access
-- (PII + guessable codes); the public attendee page reads via the service role.
create policy "attendees_admin_read" on public.attendees
  for select using (public.can_access_event(event_id));
create policy "attendees_admin_update" on public.attendees
  for update using (public.can_access_event(event_id)) with check (public.can_access_event(event_id));

-- ── Backfill: one attendee per seat for every existing booking ──────────────
insert into public.attendees (booking_id, event_id, seat_index, name, ticket_code, qr_code)
select
  t.id,
  t.event_id,
  s.seat_index,
  case when s.seat_index = 1 then t.buyer_name else 'Guest ' || s.seat_index end,
  t.id || '-' || lpad(s.seat_index::text, 2, '0'),
  '/ticket/a/' || t.id || '-' || lpad(s.seat_index::text, 2, '0')
from public.tickets t
cross join lateral generate_series(1, greatest(t.seats, 1)) as s(seat_index)
on conflict (booking_id, seat_index) do nothing;
