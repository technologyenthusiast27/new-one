import type { ReactNode } from "react";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

/**
 * Shared layout for legal / policy pages: sticky table of contents, consistent
 * typography, "last updated" line, header + footer. Fully responsive.
 */
export function LegalPage({
  eyebrow = "Legal",
  title,
  intro,
  lastUpdated,
  sections,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative min-h-dvh px-5 pb-24 pt-32 sm:px-8">
        <AmbientGlow />
        <div className="mx-auto max-w-5xl">
          <header className="max-w-3xl">
            <p className="section-eyebrow">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-neutral-500">
              Last updated: <time>{lastUpdated}</time>
            </p>
            {intro && (
              <div className="mt-6 text-base leading-relaxed text-neutral-300">
                {intro}
              </div>
            )}
          </header>

          <div className="mt-12 gap-12 lg:grid lg:grid-cols-[220px_1fr]">
            {/* Table of contents */}
            <nav
              aria-label="On this page"
              className="mb-10 lg:sticky lg:top-28 lg:mb-0 lg:self-start"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                On this page
              </p>
              <ol className="mt-4 space-y-2.5">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex gap-2 text-sm text-neutral-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
                    >
                      <span className="tabular-nums text-violet-soft/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections */}
            <div className="min-w-0 space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="flex items-baseline gap-3 font-display text-2xl font-semibold text-white">
                    <span className="text-base tabular-nums text-violet-soft/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-neutral-300 [&_a]:text-violet-soft [&_a:hover]:underline [&_li]:ml-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
