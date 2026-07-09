import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Clock, Users, CheckCircle2, ShieldAlert } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicket } from "@/lib/tickets";
import { getEventById } from "@/lib/events";
import { generateQrDataUrl } from "@/lib/qr";
import { inr, formatEventDate, formatTime } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { TicketReveal } from "@/components/TicketReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your digital ticket",
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  checked_in: "bg-violet-glow/15 text-violet-soft ring-violet-glow/30",
  cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export default async function TicketPage({
  params,
}: {
  params: { id: string };
}) {
  // Tickets have no anon RLS read — this exact-id lookup runs server-side
  // with the service-role client only.
  const supabase = createAdminClient();
  const ticket = await getTicket(supabase, params.id);
  if (!ticket) notFound();

  const event = await getEventById(supabase, ticket.eventId);

  const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/ticket/${ticket.id}`;
  const qr = await generateQrDataUrl(ticketUrl);
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
                You&apos;re confirmed! We&apos;ve emailed a copy to {ticket.buyerEmail}.
              </p>
            </div>
          )}

          {/* Ticket card */}
          <div className="overflow-hidden rounded-[1.75rem] glass-strong">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-violet-deep/40 via-charcoal-800 to-charcoal-900 px-7 pt-8 pb-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-soft">
                {event ? `${event.presenter} presents` : "NovaLabs"}
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-white">
                {event?.name ?? "Your ticket"}
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${
                    STATUS_STYLES[ticket.status] ?? STATUS_STYLES.confirmed
                  }`}
                >
                  {ticket.status.replace("_", " ")}
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

            {/* QR */}
            <div className="px-7 py-8 text-center">
              <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-glass">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`Entry QR code for ticket ${ticket.id}`}
                  width={208}
                  height={208}
                  className="h-52 w-52"
                />
              </div>
              <p className="mt-4 font-mono text-sm tracking-[0.15em] text-white">
                {ticket.id}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Show this QR code at the entrance
              </p>
            </div>

            {/* Details */}
            <div className="border-t border-white/[0.06] px-7 py-6">
              <div className="grid grid-cols-2 gap-y-5">
                <Detail label="Guest" value={ticket.buyerName} />
                <Detail
                  label="Pass"
                  value={`${ticket.ticketTypeName} × ${ticket.quantity}`}
                />
                <Detail
                  label="Admits"
                  value={`${ticket.seats} guest${ticket.seats > 1 ? "s" : ""}`}
                  icon={<Users className="h-3.5 w-3.5" />}
                />
                <Detail label="Paid" value={inr(ticket.amountInr)} highlight />
              </div>

              {event && (
                <>
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
                    <p className="flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-violet-soft" />
                      Age requirement: {ageCategoryLabel(event.ageCategory)}
                      {event.idRequired ? " · Carry valid ID" : ""}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </TicketReveal>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Keep this ticket safe. One QR admits {ticket.seats} guest
          {ticket.seats > 1 ? "s" : ""}. Non-transferable after check-in.
        </p>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${
          highlight ? "text-violet-soft" : "text-white"
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
