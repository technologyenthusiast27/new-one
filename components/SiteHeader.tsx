import Link from "next/link";
import { Sparkles } from "lucide-react";
import { COMPANY } from "@/lib/company";

/** Compact header for non-event pages (legal, about, contact). */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto my-4 flex max-w-7xl items-center justify-between rounded-full glass px-5 py-2.5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold tracking-wide text-white">
              {COMPANY.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-soft/80">
              Events & Ticketing
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <Link
            href="/#events"
            className="rounded-full px-4 py-2 text-neutral-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
          >
            Events
          </Link>
          <Link
            href="/about"
            className="hidden rounded-full px-4 py-2 text-neutral-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60 sm:inline-flex"
          >
            About
          </Link>
          <Link href="/contact" className="btn-primary">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
