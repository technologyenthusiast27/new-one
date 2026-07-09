import type { Event } from "@/lib/types";
import { EventCard } from "./EventCard";
import { Reveal } from "./ui/Reveal";

export function EventGrid({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl glass px-6 py-16 text-center">
        <p className="text-neutral-400">
          No events announced yet. Check back soon — something is coming.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, i) => (
        <Reveal key={event.id} delay={i * 0.08} className="h-full">
          <EventCard event={event} />
        </Reveal>
      ))}
    </div>
  );
}
