"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import type { Event, TicketType } from "@/lib/types";
import {
  formatEventDate,
  formatTime,
  splitTitle,
  inr,
} from "@/lib/format";
import { AmbientGlow } from "./ui/AmbientGlow";
import { Countdown } from "./Countdown";
import { AgeBadge } from "./AgeBadge";

export function Hero({
  event,
  ticketTypes,
}: {
  event: Event;
  ticketTypes: TicketType[];
}) {
  const reduce = useReducedMotion();
  const { head, tail } = splitTitle(event.name);
  const minPrice = ticketTypes.length
    ? Math.min(...ticketTypes.map((t) => t.priceInr))
    : null;
  const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");
  const dateLine = [formatEventDate(event.eventDate), formatTime(event.doorsOpenAt)]
    .filter(Boolean)
    .join(" · ");

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-16 text-center sm:px-8"
    >
      <AmbientGlow />

      {/* subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl"
      >
        <motion.div variants={item} className="mb-7 flex justify-center">
          <span className="section-eyebrow rounded-full glass px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {event.presenter} presents
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-[15vw] font-semibold leading-[0.92] tracking-tight sm:text-7xl md:text-8xl"
        >
          {head && <span className="block text-gradient">{head}</span>}
          <span className="block text-gradient-violet italic">{tail}</span>
        </motion.h1>

        {event.tagline && (
          <motion.p
            variants={item}
            className="mx-auto mt-7 max-w-xl text-balance text-base text-neutral-300 sm:text-lg"
          >
            {event.tagline}
          </motion.p>
        )}

        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-neutral-300"
        >
          {dateLine && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-violet-soft" />
              {dateLine}
            </span>
          )}
          {dateLine && venue && (
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
          )}
          {venue && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-soft" />
              {venue}
            </span>
          )}
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <AgeBadge category={event.ageCategory} />
        </motion.div>

        <motion.div variants={item} className="mt-10 flex justify-center">
          <Countdown target={event.eventDate} />
        </motion.div>

        <motion.div
          variants={item}
          className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href="#passes" className="btn-primary w-full sm:w-auto">
            Get your pass
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#experience" className="btn-ghost w-full sm:w-auto">
            Explore the night
          </a>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-6 text-xs text-neutral-500"
        >
          {minPrice != null && <>Passes from {inr(minPrice)} · </>}
          Limited capacity · 18+ event
        </motion.p>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-9 w-5.5 items-start justify-center rounded-full border border-white/20 p-1.5">
          <motion.span
            animate={reduce ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-violet-soft"
          />
        </div>
      </motion.div>
    </section>
  );
}
