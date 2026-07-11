-- ============================================================================
-- NovaLabs.club — Migration 0004: role-based multi-event admin
-- ============================================================================
-- Adds super_admin / event_admin roles and per-event assignment via
-- event_admins. Rewrites RLS so event admins only see/manage assigned events.
-- Backward compatible: any existing 'admin' profile becomes 'super_admin', and
-- all existing events/bookings continue to work.
-- ============================================================================

-- ── profiles.role: widen to the two-role model ─────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'super_admin' where role = 'admin';
alter table public.profiles
  add constraint profiles_role_check check (role in ('super_admin','event_admin'));
alter table public.profiles alter column role set default 'event_admin';

-- New auth users default to the least-privileged role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'event_admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── event_admins: which event_admin can manage which event ─────────────────
create table if not exists public.event_admins (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index if not exists event_admins_event_idx on public.event_admins(event_id);

alter table public.event_admins enable row level security;

-- ── Authorization helpers ──────────────────────────────────────────────────
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Any admin (super or event) — used where the distinction doesn't matter.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin','event_admin')
  );
$$;

-- Can the current user manage this specific event?
create or replace function public.can_access_event(target_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or exists (
        select 1 from public.event_admins
        where user_id = auth.uid() and event_id = target_event
      );
$$;

-- ── RLS: events ─────────────────────────────────────────────────────────────
-- Public read policy (published/coming_soon) from 0001 stays. Replace the
-- broad admin policies with role-aware ones.
drop policy if exists "events_admin_read"   on public.events;
drop policy if exists "events_admin_insert" on public.events;
drop policy if exists "events_admin_update" on public.events;
drop policy if exists "events_admin_delete" on public.events;

create policy "events_admin_read" on public.events
  for select using (public.can_access_event(id));
create policy "events_super_insert" on public.events
  for insert with check (public.is_super_admin());
create policy "events_manage_update" on public.events
  for update using (public.can_access_event(id)) with check (public.can_access_event(id));
create policy "events_super_delete" on public.events
  for delete using (public.is_super_admin());

-- ── RLS: ticket_types ───────────────────────────────────────────────────────
drop policy if exists "ticket_types_admin_read"   on public.ticket_types;
drop policy if exists "ticket_types_admin_insert" on public.ticket_types;
drop policy if exists "ticket_types_admin_update" on public.ticket_types;
drop policy if exists "ticket_types_admin_delete" on public.ticket_types;

create policy "ticket_types_admin_read" on public.ticket_types
  for select using (public.can_access_event(event_id));
create policy "ticket_types_admin_insert" on public.ticket_types
  for insert with check (public.can_access_event(event_id));
create policy "ticket_types_admin_update" on public.ticket_types
  for update using (public.can_access_event(event_id)) with check (public.can_access_event(event_id));
create policy "ticket_types_admin_delete" on public.ticket_types
  for delete using (public.can_access_event(event_id));

-- ── RLS: orders ─────────────────────────────────────────────────────────────
drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read" on public.orders
  for select using (public.can_access_event(event_id));

-- ── RLS: tickets ────────────────────────────────────────────────────────────
drop policy if exists "tickets_admin_read"   on public.tickets;
drop policy if exists "tickets_admin_update" on public.tickets;
create policy "tickets_admin_read" on public.tickets
  for select using (public.can_access_event(event_id));
create policy "tickets_admin_update" on public.tickets
  for update using (public.can_access_event(event_id)) with check (public.can_access_event(event_id));

-- ── RLS: event_admins ───────────────────────────────────────────────────────
create policy "event_admins_super_all" on public.event_admins
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "event_admins_self_read" on public.event_admins
  for select using (user_id = auth.uid());

-- ── RLS: profiles ───────────────────────────────────────────────────────────
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_super_read" on public.profiles
  for select using (public.is_super_admin());
