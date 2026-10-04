import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your use of the FizTickets website, ticket purchases and event entry.",
  openGraph: {
    title: "Terms & Conditions · FizTickets",
    description:
      "The terms governing your use of the FizTickets website, ticket purchases and event entry.",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          These Terms &amp; Conditions govern your use of the {COMPANY.name} website
          and the purchase of tickets to events listed on it. By booking, you agree to
          these terms.
        </p>
      }
      sections={[
        {
          id: "acceptance",
          heading: "Acceptance of terms",
          body: (
            <p>
              By accessing the site or purchasing a ticket, you confirm that you are
              able to enter into a binding agreement and that you accept these terms and
              our <a href="/legal/privacy">Privacy Policy</a>.
            </p>
          ),
        },
        {
          id: "tickets",
          heading: "Tickets & bookings",
          body: (
            <ul>
              <li>All bookings are subject to availability and confirmation of payment.</li>
              <li>A digital QR ticket is issued once payment is verified.</li>
              <li>Ticket prices and inclusions are shown at checkout and may vary by ticket type.</li>
              <li>You are responsible for the accuracy of the details provided at booking.</li>
            </ul>
          ),
        },
        {
          id: "entry",
          heading: "Entry & conduct",
          body: (
            <ul>
              <li>A valid QR ticket is required for entry. Each ticket admits the stated number of guests.</li>
              <li>Government-issued photo ID may be required to verify age at entry.</li>
              <li>Entry may be refused where age or entry requirements are not met, or for unsafe or unlawful conduct.</li>
              <li>Organizers may set additional venue rules that you agree to follow.</li>
            </ul>
          ),
        },
        {
          id: "age-policy",
          heading: "Age policy",
          body: (
            <p>
              Each event publishes its own minimum age requirement. Some events admit
              minors subject to parent or guardian permission and applicable local laws.
              Please review the event&rsquo;s Age &amp; Entry Policy before booking.
            </p>
          ),
        },
        {
          id: "refunds",
          heading: "Refunds & cancellations",
          body: (
            <p>
              Refunds and cancellations are governed by our{" "}
              <a href="/legal/refund">Refund &amp; Cancellation Policy</a>.
            </p>
          ),
        },
        {
          id: "liability",
          heading: "Limitation of liability",
          body: (
            <p>
              To the fullest extent permitted by law, {COMPANY.name} acts as a ticketing
              platform and is not liable for the conduct of events beyond the ticketing
              service it provides. Nothing in these terms limits liability that cannot be
              excluded under applicable law.
            </p>
          ),
        },
        {
          id: "changes",
          heading: "Changes to these terms",
          body: (
            <p>
              We may update these terms from time to time. Continued use of the site
              after changes take effect constitutes acceptance of the updated terms.
            </p>
          ),
        },
        {
          id: "contact",
          heading: "Contact",
          body: (
            <p>
              Questions? Email{" "}
              <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
