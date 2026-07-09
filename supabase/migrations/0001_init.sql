-- ============================================================================
-- NovaLabs.club — multi-event ticketing platform
-- Migration 0001: initial schema, trigger, and RLS policies
-- ============================================================================
-- This file is the source of truth for the database schema. Apply it to the
-- Supabase project (SQL editor or `apply_migration`) before running the app.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Tables ──────────────────────────────────────────────────────────────────

-- events: one row per event; drives the homepage grid + booking page.
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  code            text unique not null,          -- ticket-id prefix, e.g. "HOB"
  name            text not null,
  presenter       text not null,
  tagline         text,
  status          text not null default 'draft'
                    check (status in ('draft','coming_soon','published','archived')),
  event_date      timestamptz not null,
  doors_open_at   timestamptz,
  venue_name      text,
  venue_city      text,
  currency        text not null default 'INR',
  cover_image_url text,
  content         jsonb not null default '{}'::jsonb, -- {experience, lineup, faq, ...}
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists events_status_idx on public.events(status);

-- ticket_types: per-event ticket tiers; replaces the old closed PassType enum.
create table if not exists public.ticket_types (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  code              text not null,               -- event-scoped: "normal" | "vip" | "group"
  name              text not null,
  price_inr         integer not null check (price_inr >= 0),
  seats_per_ticket  integer not null default 1 check (seats_per_ticket >= 1),
  tagline           text,
  perks             jsonb not null default '[]'::jsonb,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  status            text not null default 'active' check (status in ('active','hidden')),
  max_qty_per_order integer not null default 20 check (max_qty_per_order >= 1),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (event_id, code)
);
create index if not exists ticket_types_event_idx on public.ticket_types(event_id);

-- profiles: admin identity, since auth.users can't hold custom columns.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- orders: Razorpay order lifecycle, separate from issued tickets.
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events(id),
  ticket_type_id      uuid not null references public.ticket_types(id),
  razorpay_order_id   text unique not null,
  quantity            integer not null check (quantity >= 1),
  amount_inr          integer not null check (amount_inr >= 0), -- server-computed snapshot
  currency            text not null default 'INR',
  buyer_name          text not null,
  buyer_email         text not null,
  buyer_phone         text not null,
  status              text not null default 'created'
                        check (status in ('created','paid','failed','expired')),
  razorpay_payment_id text,
  razorpay_signature  text,
  failure_reason      text,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_event_idx on public.orders(event_id);

-- tickets: issued tickets, 1:1 with a paid order. Text PK = user-facing id.
create table if not exists public.tickets (
  id               text primary key,             -- "NL-HOB-VIP-3F7A2C"
  order_id         uuid not null unique references public.orders(id),
  event_id         uuid not null references public.events(id),
  ticket_type_id   uuid not null references public.ticket_types(id),
  ticket_type_name text not null,                -- snapshot at purchase time
  ticket_type_code text not null,                -- snapshot
  quantity         integer not null,
  seats            integer not null,
  amount_inr       integer not null,             -- snapshot
  buyer_name       text not null,
  buyer_email      text not null,
  buyer_phone      text not null,
  status           text not null default 'confirmed'
                     check (status in ('confirmed','checked_in','cancelled')),
  created_at       timestamptz not null default now(),
  checked_in_at    timestamptz,
  checked_in_by    uuid references public.profiles(id),
  is_demo          boolean not null default false
);
create index if not exists tickets_event_idx on public.tickets(event_id);
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_email_idx on public.tickets(buyer_email);

-- ── New-user trigger: auto-provision a profile for every auth user ──────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.events       enable row level security;
alter table public.ticket_types enable row level security;
alter table public.orders       enable row level security;
alter table public.tickets      enable row level security;
alter table public.profiles     enable row level security;

-- Helper: is the current auth user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- events: public can read published / coming_soon; admins do everything.
create policy "events_public_read" on public.events
  for select using (status in ('published','coming_soon'));
create policy "events_admin_read" on public.events
  for select using (public.is_admin());
create policy "events_admin_insert" on public.events
  for insert with check (public.is_admin());
create policy "events_admin_update" on public.events
  for update using (public.is_admin()) with check (public.is_admin());
create policy "events_admin_delete" on public.events
  for delete using (public.is_admin());

-- ticket_types: public can read active types of visible events; admins do all.
create policy "ticket_types_public_read" on public.ticket_types
  for select using (
    status = 'active'
    and exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and e.status in ('published','coming_soon')
    )
  );
create policy "ticket_types_admin_read" on public.ticket_types
  for select using (public.is_admin());
create policy "ticket_types_admin_insert" on public.ticket_types
  for insert with check (public.is_admin());
create policy "ticket_types_admin_update" on public.ticket_types
  for update using (public.is_admin()) with check (public.is_admin());
create policy "ticket_types_admin_delete" on public.ticket_types
  for delete using (public.is_admin());

-- orders: no anon access. Admins may read; writes happen via service role only.
create policy "orders_admin_read" on public.orders
  for select using (public.is_admin());

-- tickets: no anon access. Admins read + update (check-in/cancel/restore).
-- Public ticket page reads via the server-only service-role client.
create policy "tickets_admin_read" on public.tickets
  for select using (public.is_admin());
create policy "tickets_admin_update" on public.tickets
  for update using (public.is_admin()) with check (public.is_admin());

-- profiles: users read their own row; admins read all. No client role updates.
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());
