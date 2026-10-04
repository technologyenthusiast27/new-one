-- ============================================================================
-- NovaLabs.club — Migration 0003: event compliance + purchaser compliance capture
-- ============================================================================
-- Additive only. Two jsonb columns keep the compliance model extensible for
-- future international requirements without further schema churn:
--   events.compliance  — organizer-configured event compliance info
--   orders.compliance  — purchaser-provided guardian/ID capture (audit trail)
-- Existing rows/booking flow are unaffected (default '{}').
-- ============================================================================

alter table public.events
  add column if not exists compliance jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists compliance jsonb not null default '{}'::jsonb;

comment on column public.events.compliance is
  'Organizer compliance config: entry_instructions, venue_rules, safety_guidelines, items_allowed[], items_prohibited[], accessibility_info, emergency_contact_name, emergency_contact_phone';
comment on column public.orders.compliance is
  'Purchaser compliance capture at checkout: guardian_name, guardian_relationship, guardian_contact, id_acknowledged, id_type';
