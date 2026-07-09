import Link from "next/link";
import { CalendarDays, MapPin, ArrowUpRight, Lock } from "lucide-react";
import type { Event } from "@/lib/types";
import { formatEventDate } from "@/lib/format";
import { AgeBadge } from "./AgeBadge";

/** A single glowing event card for the NovaLabs homepage grid. */
export function EventCard({ event }: { event: Event }) {
  const isLive = event.status === "published";
  const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");

  const inner = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-8 transition-all duration-300 ${
        isLive
          ? "glass-strong ring-1 ring-white/5 hover:-translate-y-1.5 hover:ring-violet-glow/40 hover:shadow-glow"
          : "glass opacity-80"
      }`}
    >
      {/* ambient glow blob */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px] transition-opacity duration-500 ${
          isLive
            ? "bg-violet-glow/25 opacity-60 group-hover:opacity-100"
            : "bg-white/5 opacity-40"
        }`}
      />

      <div className="relative flex items-center justify-between">
        <span className="section-eyebrow">{event.presenter}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            On sale
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-400 ring-1 ring-inset ring-white/10">
            <Lock className="h-3 w-3" />
            Coming soon
          </span>
        )}
      </div>

      <h3 className="relative mt-5 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
        {event.name}
      </h3>
      {event.tagline && (
        <p className="relative mt-3 text-sm text-neutral-400">{event.tagline}</p>
      )}

      <div className="relative mt-6 space-y-2 text-sm text-neutral-300">
        <p className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 text-violet-soft" />
          {formatEventDate(event.eventDate)}
        </p>
        {venue && (
          <p className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-violet-soft" />
            {venue}
          </p>
        )}
      </div>

      <div className="relative mt-4">
        <AgeBadge category={event.ageCategory} />
      </div>

      <div className="relative mt-8 flex items-center justify-between pt-2">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white">
            Book now
            <ArrowUpRight className="h-4 w-4 text-violet-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : (
          <span className="text-sm text-neutral-500">Tickets not yet available</span>
        )}
      </div>
    </div>
  );

  if (!isLive) return inner;

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
