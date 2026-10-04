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
import { EventInfo } from "@/components/EventInfo";
import { Passes } from "@/components/Passes";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  try {
    const supabase = await createClient();
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

export default async function EventPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const event = await getEventBySlug(supabase, params.slug);

  // Only published or coming_soon events are publicly visible.
  if (!event || event.status === "draft" || event.status === "archived") {
    notFound();
  }

  const ticketTypes = await getActiveTicketTypes(supabase, event.id);

  return (
    <>
      <Navbar event={event} />
      <main id="main-content" className="relative">
        <Hero event={event} ticketTypes={ticketTypes} />
        <Marquee />
        <Experience event={event} />
        <EventInfo event={event} />
        {ticketTypes.length > 0 && (
          <Passes event={event} ticketTypes={ticketTypes} />
        )}
        <FAQ event={event} />
        <CTASection event={event} />
      </main>
      <SiteFooter />
    </>
  );
}
