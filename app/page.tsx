import Link from "next/link";
import { Sparkles, Ticket, ArrowRight, ScanLine, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getVisibleEvents } from "@/lib/events";
import type { Event } from "@/lib/types";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { Marquee } from "@/components/Marquee";
import { EventGrid } from "@/components/EventGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

async function loadEvents(): Promise<Event[]> {
  try {
    const supabase = await createClient();
    return await getVisibleEvents(supabase);
  } catch (err) {
    console.error("[home] could not load events:", err);
    return [];
  }
}

export default async function HomePage() {
  const events = await loadEvents();

  return (
    <>
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto my-4 flex max-w-7xl items-center justify-between rounded-full glass px-5 py-2.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep shadow-glow">
              <Sparkles className="h-4 w-4 text-charcoal-950" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold tracking-wide text-white">
                NovaLabs
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-violet-soft/80">
                Events & Ticketing
              </span>
            </span>
          </Link>
          <a href="#events" className="btn-primary hidden sm:inline-flex">
            <Ticket className="h-4 w-4" />
            Browse events
          </a>
        </div>
      </header>

      <main id="main-content" className="relative">
        {/* Hero */}
        <section className="relative flex min-h-[88dvh] flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-16 text-center sm:px-8">
          <AmbientGlow />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-7 flex justify-center">
              <span className="section-eyebrow rounded-full glass px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Curated live experiences
              </span>
            </div>
            <h1 className="font-display text-[15vw] font-semibold leading-[0.92] tracking-tight sm:text-7xl md:text-8xl">
              <span className="block text-gradient">WHERE NIGHTS</span>
              <span className="block text-gradient-violet italic">BECOME LEGEND</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-balance text-base text-neutral-300 sm:text-lg">
              NovaLabs produces cinematic events worth remembering. Discover the
              lineup, pick your pass, and get an instant QR ticket to the door.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#events" className="btn-primary w-full sm:w-auto">
                Explore events
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <Marquee />

        {/* Events grid */}
        <section id="events" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow">The lineup</span>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
              Upcoming <span className="text-gradient-violet italic">events</span>
            </h2>
            <p className="mt-5 text-neutral-400">
              One unforgettable night at a time. Tap a live event to book your pass.
            </p>
          </Reveal>
          <div className="mt-16">
            <EventGrid events={events} />
          </div>
        </section>

        {/* For organizers (placeholder / future) */}
        <section className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] glass-strong px-6 py-16 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-glow/25 blur-[100px]"
              />
              <span className="section-eyebrow">For organizers</span>
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
                Run your event on <span className="text-gradient-violet italic">NovaLabs</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-neutral-400">
                Ticket types, secure Razorpay payments, digital QR tickets and live
                door check-ins — all in one dashboard. More events joining soon.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Ticket, label: "Flexible ticket tiers" },
                  { icon: ShieldCheck, label: "Secure payments" },
                  { icon: ScanLine, label: "QR check-in at the door" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl glass px-5 py-6">
                    <Icon className="mx-auto h-6 w-6 text-violet-soft" />
                    <p className="mt-3 text-sm text-neutral-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
