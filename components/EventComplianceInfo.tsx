import {
  DoorOpen,
  ScrollText,
  ShieldPlus,
  Check,
  Ban,
  Accessibility,
  Phone,
} from "lucide-react";
import type { Event } from "@/lib/types";
import { Reveal } from "./ui/Reveal";

/**
 * Renders the organizer-configured compliance & venue information on the public
 * event page. Each block renders only when the organizer has provided it.
 */
export function EventComplianceInfo({ event }: { event: Event }) {
  const c = event.compliance ?? {};
  const hasItems =
    (c.itemsAllowed?.length ?? 0) > 0 || (c.itemsProhibited?.length ?? 0) > 0;
  const emergency = [c.emergencyContactName, c.emergencyContactPhone]
    .filter(Boolean)
    .join(" · ");

  const hasAnything =
    c.entryInstructions ||
    c.venueRules ||
    c.safetyGuidelines ||
    hasItems ||
    c.accessibilityInfo ||
    emergency;

  if (!hasAnything) return null;

  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-4 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Venue & safety</span>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
          Know before you <span className="text-gradient-violet italic">go</span>
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {c.entryInstructions && (
          <InfoBlock icon={<DoorOpen className="h-5 w-5" />} title="Entry instructions">
            <p className="whitespace-pre-line">{c.entryInstructions}</p>
          </InfoBlock>
        )}
        {c.venueRules && (
          <InfoBlock icon={<ScrollText className="h-5 w-5" />} title="Venue rules">
            <p className="whitespace-pre-line">{c.venueRules}</p>
          </InfoBlock>
        )}
        {c.safetyGuidelines && (
          <InfoBlock icon={<ShieldPlus className="h-5 w-5" />} title="Safety guidelines">
            <p className="whitespace-pre-line">{c.safetyGuidelines}</p>
          </InfoBlock>
        )}

        {hasItems && (
          <InfoBlock icon={<Check className="h-5 w-5" />} title="What to bring">
            <div className="grid gap-4 sm:grid-cols-2">
              {(c.itemsAllowed?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Allowed
                  </p>
                  <ul className="space-y-1.5">
                    {c.itemsAllowed!.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-neutral-300">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(c.itemsProhibited?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-300">
                    Prohibited
                  </p>
                  <ul className="space-y-1.5">
                    {c.itemsProhibited!.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-neutral-300">
                        <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </InfoBlock>
        )}

        {c.accessibilityInfo && (
          <InfoBlock icon={<Accessibility className="h-5 w-5" />} title="Accessibility">
            <p className="whitespace-pre-line">{c.accessibilityInfo}</p>
          </InfoBlock>
        )}
        {emergency && (
          <InfoBlock icon={<Phone className="h-5 w-5" />} title="Emergency contact">
            <p>{emergency}</p>
          </InfoBlock>
        )}
      </div>
    </section>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl glass p-7">
      <div className="flex items-center gap-2 text-violet-soft">
        {icon}
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-neutral-300">{children}</div>
    </div>
  );
}
