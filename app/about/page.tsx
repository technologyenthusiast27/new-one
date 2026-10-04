import type { Metadata } from "next";
import Link from "next/link";
import {
  Target,
  Eye,
  Heart,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { COMPANY } from "@/lib/company";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "About FizTickets",
  description:
    "FizTickets is a premium event experiences platform — cinematic nights, secure ticketing, and a community built on safety and trust.",
  openGraph: {
    title: "About FizTickets",
    description:
      "A premium event experiences platform — cinematic nights, secure ticketing, and safety-first community.",
    type: "website",
  },
};

const PILLARS = [
  {
    icon: Target,
    title: "Mission",
    body: "To make going out effortless and unforgettable — pairing standout events with ticketing that just works, from discovery to the door.",
  },
  {
    icon: Eye,
    title: "Vision",
    body: "To become the most trusted home for premium live experiences, where every event feels considered and every guest feels looked after.",
  },
  {
    icon: Heart,
    title: "Values",
    body: "Craft over clutter, honesty in pricing, and respect for the people on both sides of the ticket — guests and organizers alike.",
  },
  {
    icon: ShieldCheck,
    title: "Safety",
    body: "Clear age policies, ID verification where required, and secure payments. We design for responsible, well-run events by default.",
  },
  {
    icon: Users,
    title: "Community",
    body: "We celebrate the artists, organizers and guests who make nights memorable, and build tools that help great communities gather safely.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative min-h-dvh px-5 pb-24 pt-32 sm:px-8">
        <AmbientGlow />
        <div className="mx-auto max-w-5xl">
          <header className="max-w-3xl">
            <p className="section-eyebrow">About {COMPANY.name}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">
              Premium event <span className="text-gradient-violet italic">experiences</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              {COMPANY.name} is a premium event experiences platform. We curate and power
              cinematic nights — handling discovery, secure ticketing, digital QR entry
              and door check-in — so organizers can focus on the show and guests can focus
              on the moment.
            </p>
          </header>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <div className="h-full rounded-3xl glass p-7">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10">
                    <p.icon className="h-6 w-6 text-violet-soft" />
                  </div>
                  <h2 className="text-xl font-semibold">{p.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-400">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <div className="relative overflow-hidden rounded-[2rem] glass-strong px-6 py-14 text-center sm:px-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-glow/25 blur-[100px]"
              />
              <h2 className="mx-auto max-w-xl text-3xl font-semibold sm:text-4xl">
                Come to the next one
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-neutral-400">
                Browse what&rsquo;s on and grab your pass in seconds.
              </p>
              <div className="mt-8 flex justify-center">
                <Link href="/#events" className="btn-primary">
                  Explore events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
