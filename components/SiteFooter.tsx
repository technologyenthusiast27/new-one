import Link from "next/link";
import { Sparkles, Instagram, Linkedin } from "lucide-react";
import { COMPANY } from "@/lib/company";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "/legal/refund", label: "Refund Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/community", label: "Community Guidelines" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About NovaLabs" },
  { href: "/contact", label: "Contact" },
];

// X (Twitter) has no lucide icon that reads as the new logo; inline the glyph.
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.9l-5.4-7.06L4.02 22H.76l8.02-9.17L1.5 2h7.07l4.88 6.45L18.244 2Zm-1.21 18h1.8L7.05 3.9H5.12L17.034 20Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-charcoal-950/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-semibold text-white">
                  {COMPANY.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-violet-soft/80">
                  Events & Ticketing
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-neutral-400">
              {COMPANY.tagline} Cinematic nights, secure ticketing and instant QR
              entry.
            </p>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-3">
              <SocialLink href={COMPANY.socials.instagram} label="Instagram">
                <Instagram className="h-4.5 w-4.5" />
              </SocialLink>
              <SocialLink href={COMPANY.socials.x} label="X (Twitter)">
                <XIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={COMPANY.socials.linkedin} label="LinkedIn">
                <Linkedin className="h-4.5 w-4.5" />
              </SocialLink>
            </div>
          </div>

          <FooterColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>© 2026 {COMPANY.name}. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <Link href="/legal/terms" className="hover:text-neutral-300">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-neutral-300">Privacy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-neutral-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-neutral-300 transition-all hover:border-violet-glow/40 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
    >
      {children}
    </a>
  );
}
