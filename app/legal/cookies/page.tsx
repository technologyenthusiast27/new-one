import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY, LEGAL_LAST_UPDATED } from "@/lib/company";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "What cookies NovaLabs uses, why we use them, and how you can control your preferences.",
  openGraph: {
    title: "Cookie Policy · NovaLabs",
    description:
      "What cookies NovaLabs uses, why we use them, and how you can control your preferences.",
    type: "article",
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          This policy explains how {COMPANY.name} uses cookies and similar technologies
          when you visit our website.
        </p>
      }
      sections={[
        {
          id: "what-are-cookies",
          heading: "What are cookies?",
          body: (
            <p>
              Cookies are small text files stored on your device by your browser. They
              help websites function, remember preferences, and understand how the site
              is used.
            </p>
          ),
        },
        {
          id: "how-we-use",
          heading: "How we use cookies",
          body: (
            <ul>
              <li><strong>Essential</strong> — required for core features such as sign-in sessions and secure checkout.</li>
              <li><strong>Preferences</strong> — remember choices such as your cookie consent selection.</li>
              <li><strong>Analytics</strong> — help us understand usage so we can improve the experience (only if enabled).</li>
            </ul>
          ),
        },
        {
          id: "your-choices",
          heading: "Your choices",
          body: (
            <p>
              When you first visit, you can <strong>Accept</strong> or <strong>Reject</strong>{" "}
              non-essential cookies via our consent banner; your choice is stored locally
              in your browser. You can also control cookies through your browser settings.
              Blocking essential cookies may affect site functionality.
            </p>
          ),
        },
        {
          id: "third-party",
          heading: "Third-party services",
          body: (
            <p>
              Some functionality relies on third parties (for example, our payment
              provider), which may set their own cookies governed by their respective
              policies.
            </p>
          ),
        },
        {
          id: "contact",
          heading: "Contact",
          body: (
            <p>
              Questions about cookies? Email{" "}
              <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
