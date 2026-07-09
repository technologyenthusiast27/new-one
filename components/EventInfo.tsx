import {
  MapPin,
  CalendarDays,
  Clock,
  ShieldAlert,
  DoorOpen,
  Receipt,
  Mail,
  Contact,
  Users,
  Ban,
} from "lucide-react";
import type { Event } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/format";
import { ageCategoryLabel, ageCategoryDescription, allowsMinors } from "@/lib/age";
import { COMPANY } from "@/lib/company";
import { Reveal } from "./ui/Reveal";
import { AgeBadge } from "./AgeBadge";

/**
 * Event details + Age & Entry Policy. Renders location, date, time, age
 * requirement, entry rules, refund summary and contact — plus a dedicated
 * Age & Entry Policy explainer driven entirely by the event's own settings.
 */
export function EventInfo({ event }: { event: Event }) {
  const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");
  const minors = allowsMinors(event);

  const entryRules: string[] = [
    `${ageCategoryDescription(event.ageCategory)}.`,
    event.idRequired
      ? "Government-issued photo ID may be checked at entry."
      : "ID checks are at the organizer's discretion.",
    "A valid QR ticket is required for entry.",
  ];
  if (minors && event.guardianConsentRequired) {
    entryRules.push(
      "Attendees under 18 require parent or legal guardian permission.",
    );
  }

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
    {
      icon: ShieldAlert,
      label: "Age requirement",
      value: ageCategoryLabel(event.ageCategory),
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
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Age & Entry Policy + Entry rules / Refund / Contact */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Age & Entry Policy */}
        <div className="rounded-3xl glass-strong p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-glow/15 text-violet-soft ring-1 ring-inset ring-violet-glow/30">
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="text-xl font-semibold">Age &amp; Entry Policy</h3>
            <AgeBadge category={event.ageCategory} className="ml-auto" />
          </div>

          <ul className="mt-5 space-y-3 text-sm text-neutral-300">
            <PolicyItem icon={<Users className="h-4 w-4" />}>
              <strong>Minimum age:</strong> {ageCategoryDescription(event.ageCategory)}.
            </PolicyItem>
            <PolicyItem icon={<Contact className="h-4 w-4" />}>
              {event.idRequired
                ? "Government-issued photo ID may be required to verify age at entry."
                : "ID verification is at the organizer's discretion."}
            </PolicyItem>
            {minors ? (
              <PolicyItem icon={<Users className="h-4 w-4" />}>
                Attendees under 18 may attend
                {event.guardianConsentRequired
                  ? " with parent or legal guardian permission, "
                  : " "}
                subject to the organizer&rsquo;s policy and applicable local laws.
              </PolicyItem>
            ) : (
              <PolicyItem icon={<Users className="h-4 w-4" />}>
                This event does not admit attendees under 18.
              </PolicyItem>
            )}
            <PolicyItem icon={<Ban className="h-4 w-4" />}>
              Entry may be refused if the attendee does not meet the published event
              requirements. No refund is due in that case.
            </PolicyItem>
          </ul>
        </div>

        {/* Entry rules + refund + contact */}
        <div className="space-y-4">
          <div className="rounded-3xl glass p-7">
            <div className="flex items-center gap-2 text-violet-soft">
              <DoorOpen className="h-5 w-5" aria-hidden />
              <h3 className="text-base font-semibold text-white">Entry rules</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              {entryRules.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-glow/60" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </div>
    </section>
  );
}

function PolicyItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/5 text-violet-soft ring-1 ring-inset ring-white/10">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
