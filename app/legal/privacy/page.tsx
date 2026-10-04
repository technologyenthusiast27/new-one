import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FizTickets collects, uses, protects and shares your personal information when you browse events and book tickets.",
  openGraph: {
    title: "Privacy Policy · FizTickets",
    description:
      "How FizTickets collects, uses, protects and shares your personal information.",
    type: "article",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          {COMPANY.legalName} (&ldquo;{COMPANY.name}&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) respects your privacy. This policy explains what
          information we collect when you use our website and booking services,
          how we use it, and the choices you have.
        </p>
      }
      sections={[
        {
          id: "information-we-collect",
          heading: "Information we collect",
          body: (
            <>
              <p>We collect information you provide and information collected automatically:</p>
              <ul>
                <li><strong>Booking details</strong> — name, email address and phone number you enter at checkout.</li>
                <li><strong>Payment information</strong> — processed securely by our payment partner (Razorpay). We do not store your card or bank details.</li>
                <li><strong>Ticket data</strong> — the events and ticket types you purchase, and check-in status.</li>
                <li><strong>Technical data</strong> — cookies and similar identifiers (see our Cookie Policy).</li>
              </ul>
            </>
          ),
        },
        {
          id: "how-we-use",
          heading: "How we use your information",
          body: (
            <ul>
              <li>To process bookings, issue digital tickets and manage entry.</li>
              <li>To send booking confirmations and event-related communications.</li>
              <li>To provide customer support and respond to enquiries.</li>
              <li>To detect, prevent and address fraud, abuse or security issues.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          ),
        },
        {
          id: "sharing",
          heading: "Sharing your information",
          body: (
            <>
              <p>
                We share personal data only as needed to deliver our service — with
                payment processors, email delivery providers, and the event organizer
                responsible for the event you booked (for entry management). We do not
                sell your personal information.
              </p>
            </>
          ),
        },
        {
          id: "data-retention",
          heading: "Data retention",
          body: (
            <p>
              We retain booking and ticket records for as long as necessary to provide
              the service and to meet legal, accounting or reporting requirements, after
              which they are deleted or anonymised.
            </p>
          ),
        },
        {
          id: "your-rights",
          heading: "Your rights",
          body: (
            <p>
              Subject to applicable law, you may request access to, correction of, or
              deletion of your personal data. To exercise any right, contact us at{" "}
              <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
            </p>
          ),
        },
        {
          id: "childrens-privacy",
          heading: "Children & minors",
          body: (
            <p>
              Some events admit attendees under 18 based on the organizer&rsquo;s age
              policy. Where an event permits minors, bookings are made by an adult
              purchaser who confirms any required parent or guardian permission. We do
              not knowingly collect data directly from children without such consent.
            </p>
          ),
        },
        {
          id: "contact",
          heading: "Contact us",
          body: (
            <p>
              Questions about this policy? Email{" "}
              <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a> or
              visit our <a href="/contact">Contact page</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
