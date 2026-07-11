import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAttendeeByCode } from "@/lib/attendees";
import { getEventById } from "@/lib/events";
import { generateQrDataUrl } from "@/lib/qr";
import { formatEventDate, formatTime } from "@/lib/format";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { TicketReveal } from "@/components/TicketReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your digital ticket",
  robots: { index: false, follow: false },
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default async function AttendeeTicketPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createAdminClient();
  const attendee = await getAttendeeByCode(supabase, params.code);
  if (!attendee) notFound();

  const event = await getEventById(supabase, attendee.eventId);
  const qr = await generateQrDataUrl(`${siteUrl()}/ticket/a/${attendee.ticketCode}`);
  const checkedIn = attendee.status === "checked_in";
  const venue = event
    ? [event.venueName, event.venueCity].filter(Boolean).join(", ")
    : "";

  return (
    <main id="main-content" className="relative min-h-dvh px-5 py-16 sm:px-8">
      <AmbientGlow />
      <div className="mx-auto max-w-sm">
        <Link
          href={`/ticket/${attendee.bookingId}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All tickets in this booking
        </Link>

        <TicketReveal>
          <div className="overflow-hidden rounded-[1.75rem] glass-strong">
            <div className="relative bg-gradient-to-br from-violet-deep/40 via-charcoal-800 to-charcoal-900 px-7 pt-8 pb-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-soft">
                {event ? `${event.presenter} presents` : "NovaLabs"}
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-white">
                {event?.name ?? "Your ticket"}
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {attendee.name ?? "Guest"}
                </span>
                {checkedIn ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-glow/15 px-3 py-1 text-xs font-semibold text-violet-soft ring-1 ring-inset ring-violet-glow/30">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                    Not checked in
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-charcoal-950" />
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-charcoal-950" />
              <div className="mx-7 border-t border-dashed border-white/15" />
            </div>

            <div className="px-7 py-8 text-center">
              <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-glass">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`Entry QR code for ${attendee.name ?? "guest"}`}
                  width={208}
                  height={208}
                  className="h-52 w-52"
                />
              </div>
              <p className="mt-4 font-mono text-sm tracking-[0.15em] text-white">
                {attendee.ticketCode}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Show this QR code at the entrance
              </p>
            </div>

            {event && (
              <div className="border-t border-white/[0.06] px-7 py-6">
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
          This ticket admits one guest and can only be used once.
        </p>
      </div>
    </main>
  );
}
