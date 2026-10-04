import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "NovaLabs — Immersive Events & Ticketing",
    template: "%s · NovaLabs",
  },
  description:
    "NovaLabs curates cinematic, unforgettable events. Discover the lineup and book your pass — instant QR tickets, secure payments.",
  keywords: ["NovaLabs", "events", "tickets", "nightlife", "music", "experiences"],
  openGraph: {
    title: "NovaLabs — Immersive Events & Ticketing",
    description: "Discover cinematic events and book your pass in seconds.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="grain min-h-dvh selection:bg-violet-glow/30">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
