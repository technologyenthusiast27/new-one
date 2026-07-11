import { createAdminClient } from "./supabase/admin";

/**
 * Admin actions we record to the audit trail. Kept as a closed union so every
 * call site is grep-able and the log is queryable by a stable action name.
 */
export type AuditAction =
  | "attendee.check_in"
  | "attendee.undo_check_in"
  | "booking.cancel"
  | "booking.restore"
  | "event.create"
  | "event.update"
  | "event.delete"
  | "event_admin.assign"
  | "event_admin.remove"
  | "ticket_type.create"
  | "ticket_type.update"
  | "ticket_type.delete";

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  eventId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Append an entry to admin_audit_log. Writes go through the service-role client
 * so the log is append-only from the app's perspective (no admin can rewrite
 * it via RLS). Audit failures are swallowed — they must never break the action
 * being audited.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("admin_audit_log").insert({
      actor_id: entry.actorId,
      action: entry.action,
      event_id: entry.eventId ?? null,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write log:", err);
  }
}
