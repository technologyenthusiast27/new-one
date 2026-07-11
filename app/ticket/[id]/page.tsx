import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicket } from "@/lib/tickets";
import { getEventById } from "@/lib/events";
import { getAttendeesForBooking } from "@/lib/attendees";
import { generateQrDataUrl } from "@/lib/qr";
import { inr, formatEventDate, formatTime } from "@/lib/format";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { TicketReveal } from "@/components/TicketReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your digital tickets",
  robots: { index: false, follow: false },
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default async function BookingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const ticket = await getTicket(supabase, params.id);
  if (!ticket) notFound();

  const [event, attendees] = await Promise.all([
    getEventById(supabase, ticket.eventId),
    getAttendeesForBooking(supabase, ticket.id),
  ]);

  // One QR per attendee (fallback to a single booking QR for legacy data).
  const cards = attendees.length
    ? await Promise.all(
        attendees.map(async (a) => ({
          name: a.name ?? "Guest",
          code: a.ticketCode,
          checkedIn: a.status === "checked_in",
          qr: await generateQrDataUrl(`${siteUrl()}/ticket/a/${a.ticketCode}`),
        })),
      )
    : [
        {
          name: ticket.buyerName,
          code: ticket.id,
          checkedIn: ticket.status === "checked_in",
          qr: await generateQrDataUrl(`${siteUrl()}/ticket/${ticket.id}`),
        },
      ];

  const checkedIn = cards.filter((c) => c.checkedIn).length;
  const venue = event
    ? [event.venueName, event.venueCity].filter(Boolean).join(", ")
    : "";

  return (
    <main id="main-content" className="relative min-h-dvh px-5 py-16 sm:px-8">
      <AmbientGlow />

      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <TicketReveal>
          {ticket.status === "confirmed" && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm text-emerald-200">
                You&apos;re confirmed! We&apos;ve emailed your {cards.length}{" "}
                ticket{cards.length > 1 ? "s" : ""} to {ticket.buyerEmail}.
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-[1.75rem] glass-strong">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-violet-deep/40 via-charcoal-800 to-charcoal-900 px-7 pt-8 pb-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-soft">
                {event ? `${event.presenter} presents` : "NovaLabs"}
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-white">
                {event?.name ?? "Your tickets"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {ticket.ticketTypeName} × {ticket.quantity}
                </span>
                <span className="inline-flex items-center rounded-full bg-violet-glow/15 px-3 py-1 text-xs font-semibold text-violet-soft ring-1 ring-inset ring-violet-glow/30">
                  {checkedIn}/{cards.length} checked in
                </span>
                {ticket.isDemo && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-300">
                    Demo booking
                  </span>
                )}
              </div>
            </div>

            {/* Perforation */}
            <div className="relative">
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-charcoal-950" />
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-charcoal-950" />
              <div className="mx-7 border-t border-dashed border-white/15" />
            </div>

            {/* Attendee QR cards */}
            <div className="space-y-4 px-7 py-7">
              {cards.length > 1 && (
                <p className="text-center text-xs text-neutral-400">
                  One QR per guest — each admits one person.
                </p>
              )}
              {cards.map((c) => (
                <div
                  key={c.code}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.checkedIn ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-glow/15 px-2 py-0.5 text-[10px] font-medium text-violet-soft">
                        <CheckCircle2 className="h-3 w-3" /> Checked in
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        Not checked in
                      </span>
                    )}
                  </div>
                  <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.qr}
                      alt={`Entry QR code for ${c.name}`}
                      width={168}
                      height={168}
                      className="h-40 w-40"
                    />
                  </div>
                  <p className="mt-2 font-mono text-xs tracking-[0.12em] text-neutral-300">
                    {c.code}
                  </p>
                </div>
              ))}
            </div>

            {/* Event details */}
            {event && (
              <div className="border-t border-white/[0.06] px-7 py-6">
                <div className="grid grid-cols-2 gap-y-4">
                  <Detail label="Booking" value={ticket.id} mono />
                  <Detail label="Paid" value={inr(ticket.amountInr)} highlight />
                </div>
                <div className="my-5 divider-glow" />
                <div className="space-y-2.5 text-sm text-neutral-300">
                  <p className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 text-violet-soft" />
                    {formatEventDate(event.eventDate)}
                  </p>
                  {event.doorsOpenAt && (
                    <p className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-violet-soft" />
                      Doors open {formatTime(event.doorsOpenAt)}
                    </p>
                  )}
                  {venue && (
                    <p className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-violet-soft" />
                      {venue}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </TicketReveal>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Keep these safe. Each QR admits one guest and can only be used once.
        </p>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-sm font-medium ${highlight ? "text-violet-soft" : "text-white"} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
