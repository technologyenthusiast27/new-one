import type { Metadata } from "next";
import { Mail, MessageCircle, Briefcase, Clock, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with FizTickets — support, partnerships and business enquiries. We typically respond within 24–48 hours.",
  openGraph: {
    title: "Contact FizTickets",
    description:
      "Support, partnerships and business enquiries. We typically respond within 24–48 hours.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative min-h-dvh px-5 pb-24 pt-32 sm:px-8">
        <AmbientGlow />
        <div className="mx-auto max-w-5xl">
          <header className="max-w-3xl">
            <p className="section-eyebrow">Contact</p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">
              We&rsquo;re here to <span className="text-gradient-violet italic">help</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              Questions about a booking, an event or a partnership? Reach out and our
              team will get back to you.
            </p>
          </header>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            {/* Info */}
            <div className="space-y-4">
              <InfoCard
                icon={<Mail className="h-5 w-5" />}
                title="Support email"
                lines={[
                  <a key="s" className="text-violet-soft hover:underline" href={`mailto:${COMPANY.supportEmail}`}>
                    {COMPANY.supportEmail}
                  </a>,
                ]}
              />
              <InfoCard
                icon={<Briefcase className="h-5 w-5" />}
                title="Business enquiries"
                lines={[
                  <a key="b" className="text-violet-soft hover:underline" href={`mailto:${COMPANY.businessEmail}`}>
                    {COMPANY.businessEmail}
                  </a>,
                ]}
              />
              <InfoCard
                icon={<Clock className="h-5 w-5" />}
                title="Response time"
                lines={[COMPANY.responseTime]}
              />
              <a
                href={COMPANY.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-5 py-4 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>

              {/* Google Maps placeholder */}
              <div className="overflow-hidden rounded-2xl glass">
                <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_60%)] text-center">
                  <MapPin className="h-8 w-8 text-violet-soft" />
                  <p className="text-sm font-medium text-white">{COMPANY.addressLine}</p>
                  <p className="text-xs text-neutral-500">Map preview — embed coming soon</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: React.ReactNode[];
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl glass p-5">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-glow/15 text-violet-soft ring-1 ring-inset ring-violet-glow/30">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-neutral-500">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className="mt-1 text-sm text-neutral-200">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
