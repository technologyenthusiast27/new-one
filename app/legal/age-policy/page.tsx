import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Age Policy",
  description:
    "How age requirements, minors, guardian consent and ID verification work across NovaLabs events.",
  openGraph: {
    title: "Age Policy · NovaLabs",
    description:
      "How age requirements, minors, guardian consent and ID verification work at NovaLabs.",
    type: "article",
  },
};

export default function AgePolicyPage() {
  return (
    <LegalPage
      eyebrow="Safety"
      title="Age Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          {COMPANY.name} hosts a range of events, some of which may be attended by
          teenagers. Every event sets and displays its own age requirement. This
          policy explains how age categories, guardian consent and ID verification
          work.
        </p>
      }
      sections={[
        {
          id: "categories",
          heading: "Age categories",
          body: (
            <>
              <p>Each event is published in one of four age categories:</p>
              <ul>
                <li><strong>All Ages</strong> — open to everyone.</li>
                <li><strong>13+</strong> — attendees must be 13 or older.</li>
                <li><strong>16+</strong> — attendees must be 16 or older.</li>
                <li><strong>18+</strong> — strictly for adults 18 and over.</li>
              </ul>
              <p>
                The applicable category is shown on the event page, at ticket
                selection, at checkout, on your digital ticket and in your
                confirmation email.
              </p>
            </>
          ),
        },
        {
          id: "minors",
          heading: "Minors & guardian consent",
          body: (
            <p>
              Where an event admits attendees under 18, the organizer may require a
              parent or legal guardian&rsquo;s permission. In that case, the person
              booking must provide the guardian&rsquo;s name, relationship and contact
              details at checkout, and confirm that permission has been given, in line
              with the organizer&rsquo;s policy and applicable local laws.
            </p>
          ),
        },
        {
          id: "id",
          heading: "ID verification",
          body: (
            <p>
              Many events require a valid government-issued photo ID to verify age at
              entry (for example Aadhaar, PAN, Driving Licence, Passport or Voter ID in
              India). Where required, you confirm at checkout that each attendee will
              carry valid ID. Entry may be refused if valid ID is not presented.
            </p>
          ),
        },
        {
          id: "refusal",
          heading: "Entry refusal",
          body: (
            <p>
              Entry may be refused if an attendee does not meet the published age
              requirement, cannot provide required ID, or does not have required
              guardian permission. In these cases no refund is due — please check the
              event requirements carefully before you travel.
            </p>
          ),
        },
        {
          id: "international",
          heading: "Different regions",
          body: (
            <p>
              Age thresholds and ID requirements can vary by country and local law.
              Each event reflects the rules applicable to its venue and jurisdiction.
            </p>
          ),
        },
        {
          id: "contact",
          heading: "Questions",
          body: (
            <p>
              For any question about an event&rsquo;s age policy, email{" "}
              <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
