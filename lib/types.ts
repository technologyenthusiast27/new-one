// ============================================================================
// NovaLabs.club — shared domain types
// These mirror the Supabase schema (supabase/migrations/0001_init.sql) but use
// camelCase for the app layer. Row → domain mapping lives in the lib/*.ts
// data-access modules.
// ============================================================================

export type EventStatus = "draft" | "coming_soon" | "published" | "archived";
export type AgeCategory = "all_ages" | "13_plus" | "16_plus" | "18_plus";
export type TicketTypeStatus = "active" | "hidden";
export type OrderStatus = "created" | "paid" | "failed" | "expired";
export type TicketStatus = "confirmed" | "checked_in" | "cancelled";
export type AdminRole = "super_admin" | "event_admin";
export type AttendeeStatus = "not_checked_in" | "checked_in";

/** The signed-in admin and the events they may manage. */
export interface AdminContext {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
  /** Event ids this admin may access. For super_admin this is empty and access
   *  is unrestricted; use `canAccess()` rather than reading this directly. */
  eventIds: string[];
  /** Whether MFA is required for this account (always true for super_admin). */
  mfaEnforced: boolean;
}

/** One admittee within a booking — carries its own QR and check-in state. */
export interface Attendee {
  id: string;
  bookingId: string;
  eventId: string;
  seatIndex: number;
  name: string | null;
  email: string | null;
  status: AttendeeStatus;
  checkedInAt: string | null;
  checkedInBy: string | null;
  ticketCode: string;
  qrCode: string | null;
}

/** Structured, per-event marketing content stored in events.content (jsonb). */
export interface EventContent {
  experience?: { title: string; body: string }[];
  lineup?: { time: string; title: string; subtitle?: string }[];
  faq?: { q: string; a: string }[];
}

/**
 * Organizer-configured compliance info stored in events.compliance (jsonb).
 * Kept as an open object so new fields (e.g. country-specific rules) can be
 * added without a schema migration.
 */
export interface EventCompliance {
  entryInstructions?: string;
  venueRules?: string;
  safetyGuidelines?: string;
  itemsAllowed?: string[];
  itemsProhibited?: string[];
  accessibilityInfo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/** Compliance fields that must be filled before an event may be published. */
export const REQUIRED_COMPLIANCE_FIELDS: (keyof EventCompliance)[] = [
  "entryInstructions",
  "venueRules",
  "safetyGuidelines",
  "emergencyContactName",
  "emergencyContactPhone",
];

/** Purchaser compliance capture stored in orders.compliance (jsonb). */
export interface OrderCompliance {
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  idAcknowledged?: boolean;
  idType?: string;
}

export interface Event {
  id: string;
  slug: string;
  code: string; // ticket-id prefix, e.g. "HOB"
  name: string;
  presenter: string;
  tagline: string | null;
  status: EventStatus;
  eventDate: string; // ISO timestamptz
  doorsOpenAt: string | null; // ISO
  venueName: string | null;
  venueCity: string | null;
  currency: string; // e.g. "INR"
  coverImageUrl: string | null;
  content: EventContent;
  // Age & entry policy (per-event, organizer-configurable)
  ageCategory: AgeCategory;
  minorsAllowed: boolean;
  guardianConsentRequired: boolean;
  idRequired: boolean;
  compliance: EventCompliance;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  code: string; // event-scoped, e.g. "normal" | "vip" | "group"
  name: string;
  priceInr: number;
  seatsPerTicket: number;
  tagline: string | null;
  perks: string[];
  isFeatured: boolean;
  sortOrder: number;
  status: TicketTypeStatus;
  maxQtyPerOrder: number;
}

export interface Order {
  id: string;
  eventId: string;
  ticketTypeId: string;
  razorpayOrderId: string;
  quantity: number;
  amountInr: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: OrderStatus;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  failureReason: string | null;
  isDemo: boolean;
  compliance: OrderCompliance;
  /** Optional per-seat guest names captured at checkout (seat order). */
  guestNames: (string | null)[];
  createdAt: string;
  paidAt: string | null;
}

export interface Ticket {
  id: string; // public id, e.g. NL-HOB-VIP-3F7A2C
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  ticketTypeCode: string;
  quantity: number;
  seats: number;
  amountInr: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: TicketStatus;
  createdAt: string;
  checkedInAt: string | null;
  checkedInBy: string | null;
  isDemo: boolean;
}

/** Payload the booking modal sends to POST /api/events/[slug]/order. */
export interface CreateOrderPayload {
  ticketTypeCode: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  /** Optional per-seat guest names (index 0 = seat 1). Blank entries are ok. */
  guestNames?: (string | null)[];
  // Compliance capture (required conditionally based on the event's policy).
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  idAcknowledged?: boolean;
  idType?: string;
}

/** Payload the browser sends to POST /api/events/[slug]/verify. */
export interface VerifyPayload {
  orderId: string;
  paymentId: string;
  signature: string;
}
