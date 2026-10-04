-- ============================================================================
-- 0006_guest_names_audit.sql
--   1. orders.guest_names — optional per-seat names captured at checkout.
--   2. admin_audit_log — append-only record of privileged admin actions.
-- Additive and safe on existing data.
-- ============================================================================

-- 1. Guest names captured during checkout (array aligned to seat_index order).
alter table public.orders
  add column if not exists guest_names jsonb not null default '[]'::jsonb;

-- 2. Audit log for admin actions (check-ins, cancellations, event/admin CRUD).
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  event_id    uuid references public.events(id) on delete set null,
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_event_idx
  on public.admin_audit_log (event_id, created_at desc);
create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Reads: super admins see the whole trail; event admins see entries scoped to
-- events they can access. Writes happen only via the service role (which
-- bypasses RLS), so there are deliberately no insert/update/delete policies —
-- the log is append-only and tamper-resistant from any client session.
drop policy if exists admin_audit_log_read on public.admin_audit_log;
create policy admin_audit_log_read on public.admin_audit_log
  for select using (
    public.is_super_admin()
    or (event_id is not null and public.can_access_event(event_id))
  );
