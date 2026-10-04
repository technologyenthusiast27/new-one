import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How refunds, cancellations, transfers and rescheduled or cancelled events are handled at NovaLabs.",
  openGraph: {
    title: "Refund & Cancellation Policy · NovaLabs",
    description:
      "How refunds, cancellations, transfers and cancelled events are handled at NovaLabs.",
    type: "article",
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          This policy explains when tickets can be refunded, transferred or cancelled.
          Specific events may publish additional terms, which take precedence where
          stated.
        </p>
      }
      sections={[
        {
          id: "general",
          heading: "General policy",
          body: (
            <p>
              Unless stated otherwise for a specific event, tickets are{" "}
              <strong>non-refundable</strong> once purchased. Please review the event
              details carefully before booking.
            </p>
          ),
        },
        {
          id: "transfers",
          heading: "Transfers",
          body: (
            <p>
              Tickets are generally <strong>transferable</strong> until check-in — anyone
              presenting a valid QR ticket may enter, subject to the event&rsquo;s age and
              entry requirements. Once a ticket is checked in, it cannot be reused.
            </p>
          ),
        },
        {
          id: "event-cancelled",
          heading: "If an event is cancelled",
          body: (
            <p>
              If an event is cancelled by the organizer, eligible ticket holders will be
              offered a refund or the option to retain the ticket for a rescheduled date,
              in line with the organizer&rsquo;s instructions. Refunds are returned to the
              original payment method.
            </p>
          ),
        },
        {
          id: "event-rescheduled",
          heading: "If an event is rescheduled",
          body: (
            <p>
              If an event is postponed, existing tickets normally remain valid for the new
              date. Where a refund is offered, the window and method will be communicated
              by email.
            </p>
          ),
        },
        {
          id: "how-to-request",
          heading: "How to request a refund",
          body: (
            <p>
              Where a refund is applicable, email{" "}
              <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> with
              your ticket ID and booking email. Approved refunds are processed to the
              original payment method; timelines depend on your bank or card issuer.
            </p>
          ),
        },
        {
          id: "denied-entry",
          heading: "Denied entry",
          body: (
            <p>
              No refund is due where entry is refused because age, ID or entry
              requirements published for the event were not met. Please check the
              event&rsquo;s Age &amp; Entry Policy before travelling.
            </p>
          ),
        },
      ]}
    />
  );
}
