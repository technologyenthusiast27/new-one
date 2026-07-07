"use client";

import { useState } from "react";
import { Check, Star, Users, ArrowRight } from "lucide-react";
import { PASSES, EVENT } from "@/lib/passes";
import type { Pass } from "@/lib/types";
import { Reveal } from "./ui/Reveal";
import { BookingModal } from "./BookingModal";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function Passes() {
  const [selected, setSelected] = useState<Pass | null>(null);

  return (
    <section id="passes" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Choose your pass</span>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Pick your <span className="text-gradient-violet italic">altitude</span>
        </h2>
        <p className="mt-5 text-neutral-400">
          Three ways in. Every pass includes a digital QR ticket delivered
          instantly to your inbox.
        </p>
      </Reveal>

      <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
        {PASSES.map((pass, i) => (
          <Reveal key={pass.id} delay={i * 0.1} className="h-full">
            <div
              className={`relative flex h-full flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                pass.featured
                  ? "glass-strong ring-1 ring-violet-glow/40 shadow-glow lg:scale-[1.03]"
                  : "glass hover:border-violet-glow/25"
              }`}
            >
              {pass.featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-glow to-violet-deep px-4 py-1 text-xs font-semibold text-white shadow-glow">
                  <Star className="h-3.5 w-3.5 fill-white" />
                  Most popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">{pass.name}</h3>
                {pass.seats > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-300">
                    <Users className="h-3.5 w-3.5 text-violet-soft" />
                    {pass.seats} guests
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-neutral-400">{pass.tagline}</p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="font-display text-5xl font-semibold tabular-nums text-white">
                  {inr(pass.price)}
                </span>
                <span className="mb-1.5 text-sm text-neutral-400">
                  {pass.seats > 1 ? "/ group" : "/ person"}
                </span>
              </div>
              {pass.seats > 1 && (
                <p className="mt-1 text-xs text-violet-soft">
                  Just {inr(Math.round(pass.price / pass.seats))} per head
                </p>
              )}

              <div className="my-6 divider-glow" />

              <ul className="flex-1 space-y-3">
                {pass.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-neutral-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-glow/15 ring-1 ring-inset ring-violet-glow/30">
                      <Check className="h-3 w-3 text-violet-soft" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setSelected(pass)}
                className={`mt-8 w-full ${pass.featured ? "btn-primary" : "btn-ghost"}`}
              >
                Book {pass.name}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 text-center">
        <p className="text-xs text-neutral-500">
          All prices in {EVENT.currency} INR · Inclusive of taxes · Non-transferable after check-in
        </p>
      </Reveal>

      <BookingModal pass={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
