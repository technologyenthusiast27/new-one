import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "The standards of conduct we expect from everyone who attends or takes part in FizTickets events.",
  openGraph: {
    title: "Community Guidelines · FizTickets",
    description:
      "The standards of conduct we expect from everyone who attends FizTickets events.",
    type: "article",
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      eyebrow="Community"
      title="Community Guidelines"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          {COMPANY.name} events are built on respect, safety and shared enjoyment.
          These guidelines apply to everyone — attendees, artists, staff and
          partners.
        </p>
      }
      sections={[
        {
          id: "respect",
          heading: "Respect everyone",
          body: (
            <ul>
              <li>Treat fellow guests, staff and performers with courtesy.</li>
              <li>Harassment, discrimination or hate speech of any kind is not tolerated.</li>
              <li>Consent matters — respect personal space and boundaries.</li>
            </ul>
          ),
        },
        {
          id: "safety",
          heading: "Keep it safe",
          body: (
            <ul>
              <li>Follow the venue&rsquo;s safety guidelines and staff instructions.</li>
              <li>Do not bring prohibited items; they will be refused at entry.</li>
              <li>Report anything unsafe or suspicious to security immediately.</li>
              <li>Look out for one another — if someone needs help, tell a staff member.</li>
            </ul>
          ),
        },
        {
          id: "responsible",
          heading: "Party responsibly",
          body: (
            <ul>
              <li>Know your limits. Alcohol, where served, is for 18+ only.</li>
              <li>Illegal substances are strictly prohibited.</li>
              <li>Arrange safe transport home in advance.</li>
            </ul>
          ),
        },
        {
          id: "age",
          heading: "Age & entry",
          body: (
            <p>
              Each event publishes its own age requirement and entry rules. Please
              review the event&rsquo;s Age &amp; Entry Policy and carry any required ID.
              See our <a href="/legal/age-policy">Age Policy</a> for details.
            </p>
          ),
        },
        {
          id: "enforcement",
          heading: "Enforcement",
          body: (
            <p>
              Guests who breach these guidelines may be refused entry or removed
              without refund, and may be reported to authorities where appropriate.
              Serious breaches may result in a ban from future events.
            </p>
          ),
        },
        {
          id: "contact",
          heading: "Report a concern",
          body: (
            <p>
              To report a concern, email{" "}
              <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> or
              speak to any staff member at the event.
            </p>
          ),
        },
      ]}
    />
  );
}
