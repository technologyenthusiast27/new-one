import { Volume2, Sparkles, Wine, Camera, type LucideIcon } from "lucide-react";
import type { Event } from "@/lib/types";
import { Reveal } from "./ui/Reveal";

// Icons are assigned by position so the section stays visual without the CMS
// needing to know about icon names.
const ICONS: LucideIcon[] = [Volume2, Sparkles, Wine, Camera];

export function Experience({ event }: { event: Event }) {
  const features = event.content.experience ?? [];
  if (features.length === 0) return null;

  return (
    <section id="experience" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">The Experience</span>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Every detail, <span className="text-gradient-violet italic">obsessed over</span>
        </h2>
        <p className="mt-5 text-neutral-400">
          {event.name} isn&apos;t a party — it&apos;s a production. Every element is
          engineered to move as one: sound, light, taste and space in perfect
          choreography.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl glass p-7 transition-all duration-300 hover:-translate-y-1 hover:border-violet-glow/30">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10 transition-all group-hover:from-violet-glow/40 group-hover:to-violet-deep/40">
                  <Icon className="h-6 w-6 text-violet-soft" />
                </div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{f.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
