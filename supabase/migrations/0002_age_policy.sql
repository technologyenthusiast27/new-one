-- ============================================================================
-- FizTickets.club — Migration 0002: per-event age & entry policy
-- ============================================================================
-- Additive only. Existing rows get safe defaults (18+, ID required, no minors),
-- so the booking flow and existing tickets are unaffected. Organizers configure
-- these per event from the admin dashboard; the public site renders accordingly.
-- ============================================================================

alter table public.events
  add column if not exists age_category text not null default '18_plus'
    check (age_category in ('all_ages','13_plus','16_plus','18_plus')),
  add column if not exists minors_allowed boolean not null default false,
  add column if not exists guardian_consent_required boolean not null default false,
  add column if not exists id_required boolean not null default true;

comment on column public.events.age_category is 'Minimum age band: all_ages | 13_plus | 16_plus | 18_plus';
comment on column public.events.minors_allowed is 'Whether attendees under 18 may attend (drives guardian-consent checkout step)';
comment on column public.events.guardian_consent_required is 'Whether a parent/guardian permission is required for minors';
comment on column public.events.id_required is 'Whether government-issued ID may be checked at entry';
