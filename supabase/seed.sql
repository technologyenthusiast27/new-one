-- ============================================================================
-- NovaLabs.club — seed data
-- Version 1: House of Balloons (the one fully-functional event).
-- Safe to re-run: upserts by unique slug / (event_id, code).
-- ============================================================================

-- ── Event: House of Balloons ────────────────────────────────────────────────
insert into public.events (
  slug, code, name, presenter, tagline, status,
  event_date, doors_open_at, venue_name, venue_city, currency, content
) values (
  'house-of-balloons',
  'HOB',
  'HOUSE OF BALLOONS',
  'Wolves Production',
  'A cinematic night of sound, light & indulgence.',
  'published',
  '2026-07-26T12:00:00+05:30',
  '2026-07-26T12:00:00+05:30',
  'The Grand Pavilion',
  'Hyderabad, Telangana, India',
  'INR',
  jsonb_build_object(
    'experience', jsonb_build_array(
      jsonb_build_object('title','Immersive Sound','body','A tuned line-array system engineered for depth, clarity and body-moving low end.'),
      jsonb_build_object('title','Cinematic Visuals','body','Reactive lighting, lasers and projection choreographed to every beat.'),
      jsonb_build_object('title','Indulgence','body','Craft cocktails, premium pours and curated bites through the night.'),
      jsonb_build_object('title','Photography','body','Roaming photographers capturing the night — relive it the morning after.')
    ),
    'lineup', jsonb_build_array(
      jsonb_build_object('time','12:00 PM','title','Doors Open','subtitle','Welcome drinks & warm-up sets'),
      jsonb_build_object('time','8:30 PM','title','Opening Set','subtitle','Deep house & mellow grooves'),
      jsonb_build_object('time','10:00 PM','title','Prime Time','subtitle','Headline energy peak'),
      jsonb_build_object('time','12:00 AM','title','Afterglow','subtitle','Melodic techno till late'),
      jsonb_build_object('time','2:00 AM','title','Last Call','subtitle','The final ascent')
    ),
    'faq', jsonb_build_array(
      jsonb_build_object('q','Is this an 18+ event?','a','Yes. Valid government ID is required at entry. Please drink responsibly.'),
      jsonb_build_object('q','What does the Group pass include?','a','The Group pass admits 5 guests for ₹4,999 — the best value at ₹1,000 per head — with skip-the-line entry.'),
      jsonb_build_object('q','How do I receive my ticket?','a','Instantly. After payment you get a digital QR ticket on screen and by email — just show the QR at the door.'),
      jsonb_build_object('q','Which payment methods are accepted?','a','All major cards, UPI, netbanking and wallets via Razorpay — India''s trusted payment gateway.'),
      jsonb_build_object('q','Can I get a refund?','a','Tickets are non-refundable, but they are transferable — anyone presenting a valid QR may enter.'),
      jsonb_build_object('q','What time should I arrive?','a','Doors open at 12:00 PM. Arrive early for the smoothest entry and to catch the opening sets.')
    )
  )
)
on conflict (slug) do update set
  code          = excluded.code,
  name          = excluded.name,
  presenter     = excluded.presenter,
  tagline       = excluded.tagline,
  status        = excluded.status,
  event_date    = excluded.event_date,
  doors_open_at = excluded.doors_open_at,
  venue_name    = excluded.venue_name,
  venue_city    = excluded.venue_city,
  currency      = excluded.currency,
  content       = excluded.content,
  updated_at    = now();

-- ── Ticket types ────────────────────────────────────────────────────────────
insert into public.ticket_types (
  event_id, code, name, price_inr, seats_per_ticket, tagline, perks, is_featured, sort_order
)
select e.id, v.code, v.name, v.price_inr, v.seats, v.tagline, v.perks, v.is_featured, v.sort_order
from public.events e
cross join (values
  (
    'normal', 'Normal', 999, 1,
    'Your entry to the night.',
    jsonb_build_array(
      'General admission entry',
      'Access to main arena & bars',
      'Digital QR ticket',
      'Complimentary welcome drink'
    ),
    false, 0
  ),
  (
    'vip', 'VIP', 1499, 1,
    'Elevated, up close, unforgettable.',
    jsonb_build_array(
      'Priority fast-track entry',
      'Exclusive VIP lounge & viewing deck',
      'Dedicated premium bar',
      'Two complimentary drinks',
      'Event keepsake & merch drop'
    ),
    true, 1
  ),
  (
    'group', 'Group', 4999, 5,
    'Bring the crew. Save together.',
    jsonb_build_array(
      'Admission for 5 guests',
      'Reserved group table (subject to availability)',
      'Skip-the-line group entry',
      '5 complimentary welcome drinks',
      'Best value — ₹1,000/head'
    ),
    false, 2
  )
) as v(code, name, price_inr, seats, tagline, perks, is_featured, sort_order)
where e.slug = 'house-of-balloons'
on conflict (event_id, code) do update set
  name             = excluded.name,
  price_inr        = excluded.price_inr,
  seats_per_ticket = excluded.seats_per_ticket,
  tagline          = excluded.tagline,
  perks            = excluded.perks,
  is_featured      = excluded.is_featured,
  sort_order       = excluded.sort_order,
  updated_at       = now();
