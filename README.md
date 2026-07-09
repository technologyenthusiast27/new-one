# ✨ NovaLabs.club

A production-ready, **multi-event ticketing platform** — built with **Next.js
(App Router)**, **Tailwind CSS**, **Supabase**, **Razorpay** and **Vercel**.

NovaLabs is architected for many events from day one. **Version 1** ships one
fully functional event — **House of Balloons** (presented by Wolves Production) —
plus a DB-driven homepage grid where additional events appear simply by adding
rows, with no code changes.

The design keeps the cinematic dark aesthetic: charcoal surfaces, glassmorphism
cards, soft violet ambient glows, premium Bodoni Moda / Jost typography and
smooth Framer Motion animations.

---

## ✨ What's included

**Homepage** (`/`)
- Glowing event grid sourced from the database — `published` events are clickable,
  `coming_soon` events render as "coming soon" cards.

**Event booking** (`/events/[slug]`)
- Full cinematic experience: hero + live countdown, experience grid, lineup, FAQ,
  and ticket selection — all driven by the event's own data.
- **Razorpay checkout** with a self-contained **demo mode** when no keys are set.
- Server-computed pricing and an idempotent order → verify flow (see Security).

**Digital tickets** (`/ticket/[id]`)
- Server-generated **QR code**, shareable ticket page, confirmation email (SMTP).

**Admin** (`/admin`, Supabase Auth)
- Secure email/password login; all `/admin/**` gated by middleware + role check.
- Dashboard, events CRUD, per-event ticket types, bookings table, per-event
  analytics, payment history, and **camera-based QR check-in**.

## 🧱 Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 14 (App Router, TypeScript) |
| Styling    | Tailwind CSS + custom glass/glow design tokens |
| Motion     | Framer Motion |
| Database   | Supabase (Postgres + Row Level Security) |
| Auth       | Supabase Auth (email/password) for admins |
| Payments   | Razorpay (with demo fallback) |
| Tickets    | `qrcode` (QR) + `html5-qrcode` (check-in scanner) |
| Email      | `nodemailer` (SMTP) |

## 🗂 Architecture

```
app/
  page.tsx                    # Homepage event grid
  events/[slug]/page.tsx      # Per-event booking experience (generateMetadata)
  ticket/[id]/page.tsx        # Digital QR ticket
  admin/                      # Login, dashboard, events, per-event tabs
  api/
    events/[slug]/order       # Create order (server-priced) + persist
    events/[slug]/verify      # Verify payment → issue ticket (idempotent)
    admin/events*             # Events + ticket-types CRUD (session-gated)
    admin/tickets/[id]        # Status / check-in (session-gated)
lib/
  supabase/{client,server,admin}.ts   # anon browser, cookie SSR, service role
  events.ts ticketTypes.ts orders.ts tickets.ts   # data-access modules
  razorpay.ts qr.ts email.ts format.ts
components/            # Prop-driven event sections + admin/* + EventCard/Grid
middleware.ts         # Gates /admin/**
supabase/
  migrations/0001_init.sql    # Schema + trigger + RLS (source of truth)
  seed.sql                    # House of Balloons event + ticket types
```

Data model: `events` → `ticket_types` (per event), `orders` (Razorpay lifecycle)
→ `tickets` (1:1 with a paid order), and `profiles` (admin identity linked to
`auth.users`). Ticket IDs are `NL-<EVENTCODE>-<TYPE>-<HEX>` (e.g. `NL-HOB-VIP-3F7A2C`).

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase (+ optionally Razorpay / SMTP)
npm run dev                  # http://localhost:3000
```

### 1. Supabase

Create (or reuse) a Supabase project, then apply the schema and seed:

- Open the Supabase **SQL Editor** and run `supabase/migrations/0001_init.sql`,
  then `supabase/seed.sql`. (Or apply via the Supabase CLI / MCP.)
- In **Settings → API**, copy the values into `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` — **server-only, keep secret** (never `NEXT_PUBLIC_*`).

### 2. First admin user (manual, one-time)

Supabase Dashboard → **Authentication → Users → Add user** → enter the admin's
email + password. A `profiles` row (role `admin`) is created automatically by a
database trigger. Sign in at `/admin/login` with those credentials.

### 3. Payments & email (optional)

| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Real Razorpay orders + signature verification. Omit for demo checkout. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Confirmation emails. Omit to log instead of send. |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL used in QR links & emails. |

> **Demo mode:** with no Razorpay keys, checkout simulates a successful payment so
> the whole flow — booking → QR ticket → admin check-in — works end to end.

## 🔐 Security highlights

- **RLS everywhere.** Anon can only read published events + active ticket types.
  `orders`/`tickets` have no anon read (PII + guessable IDs); public ticket lookup
  runs server-side with the service-role key. Admin reads/writes are role-gated.
- **Payment integrity.** `/verify` reads ticket type, quantity, amount and buyer
  from the stored `orders` row — never from the request body — so a client cannot
  tamper with what they paid for. Amounts are computed server-side from the DB.
- **Idempotent verification.** A conditional `UPDATE … WHERE status='created'`
  claims the order atomically; replays return the existing ticket instead of
  issuing a duplicate or re-sending email. `tickets.order_id` is unique.

## ☁️ Deploy (Vercel)

1. Import the repo into Vercel.
2. Add all env vars from `.env.example` in **Project → Settings → Environment
   Variables** (mark `SUPABASE_SERVICE_ROLE_KEY` and the Razorpay/SMTP secrets as
   sensitive). Set `NEXT_PUBLIC_SITE_URL` to the deployment URL.
3. Deploy. (Custom domain `novalabs.club` can be attached later.)

## 📦 Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint
```

---

Version 1 · House of Balloons live · built to scale into a full event platform.
