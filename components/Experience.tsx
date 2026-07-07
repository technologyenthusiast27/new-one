import { Volume2, Sparkles, Wine, Camera } from "lucide-react";
import { Reveal } from "./ui/Reveal";

const FEATURES = [
  {
    icon: Volume2,
    title: "Cinematic Sound",
    body: "A bespoke line-array system tuned for the room — physical bass you feel in your chest, crystal highs that never fatigue.",
  },
  {
    icon: Sparkles,
    title: "Immersive Visuals",
    body: "Kinetic lighting, volumetric lasers and a wall-to-wall LED canvas synced beat-for-beat to the set.",
  },
  {
    icon: Wine,
    title: "Elevated Indulgence",
    body: "Signature cocktails, curated bites and a members-style VIP lounge for when you need to breathe.",
  },
  {
    icon: Camera,
    title: "Moments, Captured",
    body: "Roaming cinematographers and a portrait corner so the night lives on long after the lights come up.",
  },
];

export function Experience() {
  return (
    <section id="experience" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">The Experience</span>
        <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Every detail, <span className="text-gradient-violet italic">obsessed over</span>
        </h2>
        <p className="mt-5 text-neutral-400">
          House of Balloons isn&apos;t a party — it&apos;s a production. We engineer a
          night that moves as one: sound, light, taste and space in perfect
          choreography.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="group h-full rounded-3xl glass p-7 transition-all duration-300 hover:-translate-y-1 hover:border-violet-glow/30">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10 transition-all group-hover:from-violet-glow/40 group-hover:to-violet-deep/40">
                <f.icon className="h-6 w-6 text-violet-soft" />
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                {f.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
