import { Instagram, Twitter, Youtube } from "lucide-react";
import type { Event } from "@/lib/types";

export function Footer({ event }: { event: Event }) {
  return (
    <footer className="relative border-t border-white/10 bg-charcoal-950/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep">
                <span className="text-base">🎈</span>
              </span>
              <span className="font-display text-lg font-semibold text-white">
                {event.name}
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-neutral-400">
              {event.tagline ? `${event.tagline} ` : ""}Presented by {event.presenter}.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-400">
            <a href="#experience" className="transition-colors hover:text-white">Experience</a>
            <a href="#passes" className="transition-colors hover:text-white">Passes</a>
            <a href="#lineup" className="transition-colors hover:text-white">Lineup</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
            <a href="/admin" className="transition-colors hover:text-white">Admin</a>
          </nav>

          <div className="flex items-center gap-3">
            {[
              { icon: Instagram, label: "Instagram" },
              { icon: Twitter, label: "Twitter" },
              { icon: Youtube, label: "YouTube" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-neutral-300 transition-all hover:border-violet-glow/40 hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {event.presenter}. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <a href="#" className="hover:text-neutral-300">Terms</a>
            <a href="#" className="hover:text-neutral-300">Privacy</a>
            <span>18+ event · Drink responsibly</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
