import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import { EVENT } from "@/lib/passes";

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
    default: `${EVENT.name} — presented by ${EVENT.presenter}`,
    template: `%s · ${EVENT.name}`,
  },
  description: `${EVENT.tagline} ${EVENT.date} at ${EVENT.venue}, ${EVENT.city}. Book your Normal, VIP or Group pass.`,
  keywords: [
    "House of Balloons",
    "Wolves Production",
    "event tickets",
    "music festival",
    "VIP passes",
    EVENT.city,
  ],
  openGraph: {
    title: `${EVENT.name} — presented by ${EVENT.presenter}`,
    description: `${EVENT.tagline} ${EVENT.date}.`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
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
        {children}
      </body>
    </html>
  );
}
