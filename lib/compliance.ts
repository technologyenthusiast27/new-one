import type {
  Event,
  EventCompliance,
  OrderCompliance,
} from "./types";
import { REQUIRED_COMPLIANCE_FIELDS } from "./types";
import { allowsMinors } from "./age";

/**
 * What compliance capture a booking requires, derived from the event's policy.
 * - guardian: the event admits minors AND requires guardian permission.
 * - id: the event requires government-ID verification at entry.
 */
export function bookingComplianceRequirements(event: Event): {
  guardian: boolean;
  id: boolean;
} {
  return {
    guardian: allowsMinors(event) && event.guardianConsentRequired,
    id: event.idRequired,
  };
}

function looksLikeContact(value: string): boolean {
  const v = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phone = v.replace(/\D/g, "").length >= 8;
  return email || phone;
}

/**
 * Validate the purchaser's compliance capture against the event's policy.
 * Returns an error message, or null when valid. Used on both the client (for
 * inline feedback) and the server (as the authoritative gate).
 */
export function validateBookingCompliance(
  event: Event,
  input: OrderCompliance,
): string | null {
  const req = bookingComplianceRequirements(event);

  if (req.guardian) {
    if (!input.guardianName || input.guardianName.trim().length < 2) {
      return "Please enter the parent or legal guardian's full name.";
    }
    if (!input.guardianRelationship || input.guardianRelationship.trim().length < 2) {
      return "Please state the guardian's relationship to the attendee.";
    }
    if (!input.guardianContact || !looksLikeContact(input.guardianContact)) {
      return "Please enter a valid guardian contact (email or phone).";
    }
  }

  if (req.id) {
    if (!input.idAcknowledged) {
      return "Please confirm each attendee will carry a valid government photo ID.";
    }
    if (!input.idType || input.idType.trim().length === 0) {
      return "Please select the government ID type attendees will carry.";
    }
  }

  return null;
}

/** Normalise the purchaser compliance capture to what the event actually needs. */
export function normaliseBookingCompliance(
  event: Event,
  input: OrderCompliance,
): OrderCompliance {
  const req = bookingComplianceRequirements(event);
  const out: OrderCompliance = {};
  if (req.guardian) {
    out.guardianName = input.guardianName?.trim();
    out.guardianRelationship = input.guardianRelationship?.trim();
    out.guardianContact = input.guardianContact?.trim();
  }
  if (req.id) {
    out.idAcknowledged = Boolean(input.idAcknowledged);
    out.idType = input.idType?.trim();
  }
  return out;
}

/** Government ID types accepted in India (extensible for other countries). */
export const ID_TYPES = [
  "Aadhaar",
  "PAN Card",
  "Driving Licence",
  "Passport",
  "Voter ID",
] as const;

/**
 * Compliance fields still missing before an event can be published.
 * Returns human-readable labels; empty array means ready to publish.
 */
const FIELD_LABELS: Record<keyof EventCompliance, string> = {
  entryInstructions: "Entry instructions",
  venueRules: "Venue rules",
  safetyGuidelines: "Safety guidelines",
  itemsAllowed: "Items allowed",
  itemsProhibited: "Items prohibited",
  accessibilityInfo: "Accessibility information",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
};

export function missingComplianceForPublish(
  compliance: EventCompliance | undefined,
): string[] {
  const c = compliance ?? {};
  return REQUIRED_COMPLIANCE_FIELDS.filter((key) => {
    const v = c[key];
    return typeof v !== "string" || v.trim().length === 0;
  }).map((key) => FIELD_LABELS[key]);
}
