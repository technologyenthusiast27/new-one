"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { Event } from "@/lib/types";
import { Reveal } from "./ui/Reveal";

export function FAQ({ event }: { event: Event }) {
  const faqs = event.content.faq ?? [];
  const [open, setOpen] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="text-center">
        <span className="section-eyebrow">Good to know</span>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Questions, <span className="text-gradient-violet italic">answered</span>
        </h2>
      </Reveal>

      <div className="mt-14 space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl glass">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-base font-medium text-white sm:text-lg">
                    {item.q}
                  </span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 transition-all duration-300 ${
                      isOpen ? "rotate-45 bg-violet-glow/20 border-violet-glow/40" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4 text-violet-soft" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-400">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
