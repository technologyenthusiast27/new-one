import { createAdminClient } from "./supabase/admin";

/**
 * Actions recorded to the audit trail — privileged admin mutations plus
 * authentication/security telemetry. A closed union keeps every call site
 * grep-able and the log queryable by stable action names.
 */
export type AuditAction =
  // Admin mutations
  | "attendee.check_in"
  | "attendee.undo_check_in"
  | "booking.cancel"
  | "booking.restore"
  | "event.create"
  | "event.update"
  | "event.delete"
  | "event_admin.assign"
  | "event_admin.remove"
  | "event_admin.mfa_policy"
  | "ticket_type.create"
  | "ticket_type.update"
  | "ticket_type.delete"
  // Authentication / session telemetry
  | "auth.login_success"
  | "auth.login_failed"
  | "auth.login_blocked"
  | "auth.logout"
  | "auth.logout_all"
  | "auth.session_timeout"
  | "auth.denied_401"
  | "auth.denied_403"
  | "auth.brute_force_detected"
  // MFA lifecycle
  | "auth.mfa_enrolled"
  | "auth.mfa_unenrolled"
  | "auth.mfa_verify_success"
  | "auth.mfa_verify_failed"
  | "auth.recovery_codes_generated"
  | "auth.recovery_code_used"
  | "auth.recovery_code_failed"
  // Bot protection
  | "security.turnstile_failed";

export interface AuditEntry {
  /** Acting user id, or null for unauthenticated events (failed logins…). */
  actorId: string | null;
  action: AuditAction;
  eventId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  /** Request path, stored in metadata for forensics. */
  route?: string | null;
}

/**
 * Append an entry to admin_audit_log. Writes go through the service-role client
 * so the log is append-only from the app's perspective (no client session can
 * rewrite it via RLS). Audit failures are swallowed — they must never break the
 * action being audited.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("admin_audit_log").insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      event_id: entry.eventId ?? null,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: {
        ...(entry.metadata ?? {}),
        ...(entry.userAgent ? { userAgent: entry.userAgent } : {}),
        ...(entry.route ? { route: entry.route } : {}),
      },
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write log:", err);
  }
}

/** Convenience: audit-relevant request context (IP, UA, path). */
export function requestContext(req: Request): {
  ip: string;
  userAgent: string | null;
  route: string;
} {
  let route = "";
  try {
    route = new URL(req.url).pathname;
  } catch {
    /* keep empty */
  }
  const fwd = req.headers.get("x-forwarded-for");
  return {
    ip: fwd ? fwd.split(",")[0]!.trim() : (req.headers.get("x-real-ip") ?? "unknown"),
    userAgent: req.headers.get("user-agent"),
    route,
  };
}

/**
 * Count recent failed logins for a key (email or IP) to detect brute force.
 * Returns 0 when the audit table is unavailable (fail-open — Supabase Auth
 * still applies its own server-side rate limits).
 */
export async function recentLoginFailures(
  keyField: "email" | "ip",
  value: string,
  windowMinutes = 15,
): Promise<number> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    let query = supabase
      .from("admin_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "auth.login_failed")
      .gte("created_at", since);
    query =
      keyField === "ip"
        ? query.eq("ip", value)
        : query.eq("metadata->>email", value);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}
