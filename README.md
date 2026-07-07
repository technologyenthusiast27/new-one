# 🎈 HOUSE OF BALLOONS

A premium event-booking experience — **presented by Wolves Production**.

A cinematic, dark-themed ticketing website built with **Next.js (App Router)**,
**Tailwind CSS** and **Framer Motion**. Charcoal surfaces, glassmorphism cards,
soft purple ambient glows and buttery animations — designed to feel like an
Apple launch page crossed with a high-end music-festival site.

---

## ✨ Features

- **Cinematic hero** with live countdown, ambient glows and staggered reveals
- **Three ticket passes** — Normal (₹999), VIP (₹1,499) and Group (₹4,999 / 5 people)
- **Razorpay checkout** with a graceful, self-contained **demo mode** when no keys are set
- **QR-based digital tickets** generated server-side, with a shareable ticket page
- **Email confirmation** (SMTP via nodemailer) carrying the QR ticket
- **Admin dashboard** at `/admin` — revenue & guest stats, search, filter, check-in / cancel
- Fully **responsive**, accessible (reduced-motion aware, keyboard-friendly, semantic labels)

## 🧱 Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 14 (App Router, TypeScript) |
| Styling    | Tailwind CSS + custom glass/glow design tokens |
| Motion     | Framer Motion |
| Database   | Postgres via Prisma (JSON-file fallback for demo) |
| Payments   | Razorpay (with demo fallback) |
| Tickets    | `qrcode` (server-side data-URL QR) |
| Email      | `nodemailer` (SMTP) |
| Icons      | `lucide-react` |
| Fonts      | Bodoni Moda (display) + Jost (sans) via `next/font` |

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # optional — the site runs without any keys
npm run dev                  # http://localhost:3000
```

Then open:

- `/` — the landing page & booking flow
- `/admin` — the ticket dashboard (demo passcode: `wolves`)
- `/ticket/<id>` — a digital ticket (generated after booking)

> **Demo mode:** with no Razorpay keys configured, checkout simulates a
> successful payment so you can walk the entire flow — booking → QR ticket →
> admin check-in — end to end, out of the box.

## 🔐 Configuration

All integrations are **optional**. Copy `.env.example` → `.env.local` and fill
in what you have:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (Vercel Postgres, Neon, Supabase…) — enables persistent ticket storage |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Enable real Razorpay orders & signature verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public key id for the browser checkout widget |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Send confirmation emails |
| `ADMIN_PASSCODE` | Passphrase for `/admin` (defaults to `wolves`) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL used in QR links & emails |

## 🗂 Project structure

```
app/
  page.tsx              # Landing page (hero, passes, lineup, faq…)
  ticket/[id]/page.tsx  # Digital QR ticket (server-rendered)
  admin/page.tsx        # Ticket management dashboard
  api/
    razorpay/order      # Create a Razorpay (or demo) order
    razorpay/verify     # Verify payment → issue ticket → email
    admin/tickets       # List tickets + stats (passcode-gated)
    admin/tickets/[id]  # Check-in / cancel / restore
components/             # Navbar, Hero, Passes, BookingModal, Footer…
lib/
  passes.ts             # Event details + pass definitions
  store.ts              # Ticket store (Postgres via Prisma, JSON-file fallback)
  prisma.ts             # Prisma client singleton
  razorpay.ts           # Order creation + signature verification
  qr.ts / email.ts      # QR generation + confirmation email
prisma/
  schema.prisma         # Ticket table schema
```

## 💾 Data persistence

With `DATABASE_URL` set, tickets persist to **Postgres via Prisma** — the right
choice for production and multi-instance deployments. Without it, tickets fall
back to `data/tickets.json` (with an in-memory fallback on read-only/serverless
filesystems), so the demo still runs with zero configuration.

To use Postgres:

```bash
# 1. Set DATABASE_URL in .env.local (Vercel Postgres, Neon, Supabase…)
# 2. Push the schema to your database
npm run db:push
```

## 📦 Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint
```

---

Presented by **Wolves Production** · 18+ · Drink responsibly.
