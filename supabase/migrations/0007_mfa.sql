-- ============================================================================
-- 0007_mfa.sql
--   1. profiles.mfa_enforced — per-account MFA policy for event admins
--      (super_admin is always enforced by role in application logic).
--   2. mfa_recovery_codes — hashed single-use recovery codes.
-- Additive and safe on existing data.
-- ============================================================================

alter table public.profiles
  add column if not exists mfa_enforced boolean not null default false;

create table if not exists public.mfa_recovery_codes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  code_hash  text not null,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

create index if not exists mfa_recovery_codes_user_idx
  on public.mfa_recovery_codes (user_id);

alter table public.mfa_recovery_codes enable row level security;

-- Deliberately NO policies: codes are written/verified exclusively through the
-- service role (which bypasses RLS). No client session can read or alter them.
