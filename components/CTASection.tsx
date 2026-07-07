import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { EVENT } from "@/lib/passes";
import { Reveal } from "./ui/Reveal";

export function CTASection() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong px-6 py-16 text-center sm:px-12 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-glow/25 blur-[100px]"
          />
          <span className="section-eyebrow">The night is almost here</span>
          <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
            Don&apos;t just hear about it.
            <span className="block text-gradient-violet italic">Be in the room.</span>
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-300">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-violet-soft" />
              {EVENT.date}
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-soft" />
              {EVENT.venue}, {EVENT.city}
            </span>
          </div>
          <div className="mt-9 flex justify-center">
            <a href="#passes" className="btn-primary">
              Secure your pass
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
