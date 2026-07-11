import { z } from "zod";

// ============================================================================
// Zod schemas for API request bodies. Every route that accepts JSON parses it
// through one of these so malformed / oversized / unexpected input is rejected
// with a 400 before it can reach the database.
// ============================================================================

const nameString = z.string().trim().min(1).max(80);
const optionalGuestName = z
  .string()
  .max(80)
  .transform((s) => s.trim())
  .nullish()
  .transform((s) => (s && s.length > 0 ? s : null));

/** POST /api/events/[slug]/order */
export const createOrderSchema = z.object({
  ticketTypeCode: z.string().trim().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(50),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(30),
  // Optional per-seat names captured when quantity > 1. The array is re-clamped
  // to the resolved seat count server-side; the cap here is only a DoS bound and
  // is set high enough not to reject a legitimate large group booking.
  guestNames: z.array(optionalGuestName).max(500).optional(),
  turnstileToken: z.string().max(4000).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** POST /api/events/[slug]/verify */
export const verifySchema = z.object({
  orderId: z.string().trim().min(1).max(120),
  paymentId: z.string().trim().min(1).max(120),
  signature: z.string().trim().max(400).optional(),
});

/** PATCH /api/admin/tickets/[id] — booking-lifecycle only (no check-in here). */
export const ticketStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
});

/** PATCH /api/admin/attendees/[code] */
export const attendeeStatusSchema = z.object({
  status: z.enum(["checked_in", "not_checked_in"]),
});

/** PATCH /api/booking/[id]/attendees — purchaser renames guests. */
export const renameAttendeesSchema = z.object({
  names: z
    .array(
      z.object({
        seatIndex: z.coerce.number().int().min(1).max(1000),
        name: optionalGuestName,
      }),
    )
    .min(1)
    .max(500),
  turnstileToken: z.string().max(4000).optional(),
});

/** POST /api/admin/events/[id]/admins */
export const assignAdminSchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: nameString.optional(),
  // ASVS L2: 12+ chars for humans choosing a password (generated ones are 20).
  password: z.string().min(12).max(200).optional(),
});

/** PATCH /api/admin/events/[id]/admins/[userId] — per-admin MFA policy. */
export const adminPolicySchema = z.object({
  mfaEnforced: z.boolean(),
});

const turnstileToken = z.string().max(4000).optional();

/** POST /api/auth/login */
export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
  turnstileToken,
});

/** POST /api/auth/mfa/verify — TOTP code or a recovery code. */
export const mfaVerifySchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.").optional(),
    recoveryCode: z
      .string()
      .trim()
      .regex(/^[A-F0-9-]{10,40}$/i, "Invalid recovery code.")
      .optional(),
  })
  .refine((v) => Boolean(v.code) !== Boolean(v.recoveryCode), {
    message: "Provide a 6-digit code or a recovery code.",
  });

/** POST /api/auth/mfa/enroll/verify */
export const mfaEnrollVerifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

/** POST /api/auth/mfa/unenroll */
export const mfaUnenrollSchema = z.object({
  factorId: z.string().uuid(),
});

/** POST /api/auth/logout */
export const logoutSchema = z.object({
  scope: z.enum(["local", "global"]).optional(),
});
