"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "nl-cookie-consent"; // "accepted" | "rejected"

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "accepted" && stored !== "rejected") setVisible(true);
    } catch {
      // localStorage unavailable (e.g. privacy mode) — show the banner anyway.
      setVisible(true);
    }
  }, []);

  function choose(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore write failures
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[120] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl glass-strong p-5 shadow-glass sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-glow/15 text-violet-soft ring-1 ring-inset ring-violet-glow/30">
            <Cookie className="h-5 w-5" />
          </span>
          <p className="text-sm text-neutral-300">
            We use cookies to run the site and improve your experience. See our{" "}
            <Link
              href="/legal/cookies"
              className="text-violet-soft hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <Link
            href="/legal/cookies"
            className="rounded-full px-4 py-2 text-sm text-neutral-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
          >
            Learn More
          </Link>
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="btn-primary"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
