import type { Event } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { Reveal } from "./ui/Reveal";

export function Lineup({ event }: { event: Event }) {
  const sets = event.content.lineup ?? [];
  if (sets.length === 0) return null;

  const doors = formatTime(event.doorsOpenAt);

  return (
    <section id="lineup" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <span className="section-eyebrow">The Lineup</span>
          <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
            A set that <span className="text-gradient-violet italic">never dips</span>
          </h2>
          <p className="mt-5 max-w-md text-neutral-400">
            {sets.length} moments, one continuous journey — engineered to peak
            exactly when you do.{doors ? ` Doors at ${doors};` : ""} the room
            doesn&apos;t stop until the sun threatens to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Melodic House", "Afro House", "Progressive", "After-hours"].map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-neutral-300"
              >
                {g}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-3xl glass p-3 sm:p-4">
            <ul>
              {sets.map((s, i) => (
                <li
                  key={`${s.time}-${s.title}`}
                  className={`group flex items-center gap-5 rounded-2xl px-4 py-4 transition-colors hover:bg-white/[0.04] sm:px-5 ${
                    i !== sets.length - 1 ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <span className="w-20 shrink-0 font-display text-sm tabular-nums text-violet-soft sm:w-24 sm:text-base">
                    {s.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-white">{s.title}</p>
                    {s.subtitle && (
                      <p className="truncate text-sm text-neutral-400">{s.subtitle}</p>
                    )}
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-glow/40 transition-all group-hover:bg-violet-glow group-hover:shadow-glow" />
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-center text-xs text-neutral-500">
            Set times are indicative and subject to change on the night.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
