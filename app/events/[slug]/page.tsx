import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventBySlug } from "@/lib/events";
import { getActiveTicketTypes } from "@/lib/ticketTypes";
import { formatEventDate } from "@/lib/format";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Experience } from "@/components/Experience";
import { Passes } from "@/components/Passes";
import { Lineup } from "@/components/Lineup";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const event = await getEventBySlug(supabase, params.slug);
    if (!event) return { title: "Event not found" };
    const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");
    const desc = `${event.tagline ?? ""} ${formatEventDate(event.eventDate)}${
      venue ? ` at ${venue}` : ""
    }. Book your pass.`.trim();
    return {
      title: `${event.name} — ${event.presenter}`,
      description: desc,
      openGraph: { title: event.name, description: desc, type: "website" },
    };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const event = await getEventBySlug(supabase, params.slug);

  // Only published or coming_soon events are publicly visible.
  if (!event || event.status === "draft" || event.status === "archived") {
    notFound();
  }

  const ticketTypes = await getActiveTicketTypes(supabase, event.id);

  return (
    <>
      <Navbar event={event} />
      <main className="relative">
        <Hero event={event} ticketTypes={ticketTypes} />
        <Marquee />
        <Experience event={event} />
        <Lineup event={event} />
        {ticketTypes.length > 0 && (
          <Passes event={event} ticketTypes={ticketTypes} />
        )}
        <FAQ event={event} />
        <CTASection event={event} />
      </main>
      <Footer event={event} />
    </>
  );
}
