"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = [
  "IMMERSIVE SOUND",
  "LIVE VISUALS",
  "CRAFT COCKTAILS",
  "WORLD-CLASS DJs",
  "LASER SHOW",
  "VIP LOUNGE",
];

export function Marquee() {
  const reduce = useReducedMotion();
  const row = [...WORDS, ...WORDS];

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-charcoal-950 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-charcoal-950 to-transparent"
      />
      <motion.div
        className="flex w-max items-center gap-8"
        animate={reduce ? {} : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {row.map((w, i) => (
          <div key={i} className="flex items-center gap-8">
            <span className="font-display text-lg tracking-[0.2em] text-neutral-400">
              {w}
            </span>
            <span className="text-violet-glow">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
