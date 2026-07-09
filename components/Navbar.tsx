"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Ticket } from "lucide-react";
import type { Event } from "@/lib/types";

const LINKS = [
  { href: "#experience", label: "Experience" },
  { href: "#passes", label: "Passes" },
  { href: "#lineup", label: "Lineup" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar({ event }: { event: Event }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 sm:px-8 ${
          scrolled
            ? "my-3 rounded-full glass py-2.5"
            : "my-4 rounded-full border border-transparent py-3"
        }`}
      >
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep shadow-glow">
            <span className="text-base">🎈</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold tracking-wide text-white">
              {event.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-soft/80">
              {event.presenter}
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="#passes" className="btn-primary hidden sm:inline-flex">
            <Ticket className="h-4 w-4" />
            Book now
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-4 mt-1 rounded-3xl glass-strong p-3 md:hidden"
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-neutral-200 transition-colors hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#passes"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full"
            >
              <Ticket className="h-4 w-4" />
              Book now
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
