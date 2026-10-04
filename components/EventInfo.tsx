import { MapPin, CalendarDays, Clock, Receipt, Mail } from "lucide-react";
import type { Event } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { Reveal } from "./ui/Reveal";

/** Event details: location, date, time, plus refund summary and contact. */
export function EventInfo({ event }: { event: Event }) {
  const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");

  const infoItems = [
    { icon: MapPin, label: "Location", value: venue || "To be announced" },
    { icon: CalendarDays, label: "Date", value: formatEventDate(event.eventDate) },
    {
      icon: Clock,
      label: "Time",
      value: event.doorsOpenAt
        ? `Doors ${formatTime(event.doorsOpenAt)}`
        : formatTime(event.eventDate),
    },
  ];

  return (
    <section id="details" className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Good to know</span>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Event <span className="text-gradient-violet italic">details</span>
        </h2>
      </Reveal>

      {/* Quick info grid */}
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {infoItems.map((it) => (
          <div key={it.label} className="rounded-2xl glass p-5">
            <div className="flex items-center gap-2 text-violet-soft">
              <it.icon className="h-5 w-5" aria-hidden />
              <span className="text-xs uppercase tracking-wider text-neutral-400">
                {it.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-white">{it.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl glass p-6">
          <div className="flex items-center gap-2 text-violet-soft">
            <Receipt className="h-5 w-5" aria-hidden />
            <h3 className="text-base font-semibold text-white">Refund policy</h3>
          </div>
          <p className="mt-3 text-sm text-neutral-400">
            Tickets are non-refundable but transferable until check-in.{" "}
            <a href="/legal/refund" className="text-violet-soft hover:underline">
              Read the full policy
            </a>
            .
          </p>
        </div>

        <div className="rounded-3xl glass p-6">
          <div className="flex items-center gap-2 text-violet-soft">
            <Mail className="h-5 w-5" aria-hidden />
            <h3 className="text-base font-semibold text-white">Contact</h3>
          </div>
          <p className="mt-3 text-sm text-neutral-400">
            Need help?{" "}
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="text-violet-soft hover:underline"
            >
              {COMPANY.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
