import crypto from "crypto";
import { createAdminClient } from "./supabase/admin";

/**
 * Recovery codes for TOTP MFA. Codes are 64-bit CSPRNG values shown once and
 * stored only as SHA-256 hashes (high-entropy random input — no need for a
 * slow hash). Single-use: consuming a code marks it used.
 *
 * Recovery model: because Supabase cannot mint an aal2 session from a custom
 * code, using a recovery code (while signed in at aal1 — password already
 * proven) removes the account's TOTP factors so the owner can sign in and
 * re-enroll a new authenticator. Every use is audit-logged.
 */

const CODE_COUNT = 10;

function hashCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.replace(/-/g, "").toUpperCase())
    .digest("hex");
}

function newCode(): string {
  // 16 hex chars (64 bits), grouped for readability: XXXX-XXXX-XXXX-XXXX
  const hex = crypto.randomBytes(8).toString("hex").toUpperCase();
  return hex.replace(/(.{4})(?=.)/g, "$1-");
}

/** Postgres "relation does not exist" — migration 0007 not applied yet. */
const UNDEFINED_TABLE = "42P01";

/**
 * Replace the user's recovery codes with a fresh set. Returns the plaintext
 * codes (shown exactly once) or null when the storage table doesn't exist yet.
 */
export async function issueRecoveryCodes(userId: string): Promise<string[] | null> {
  const supabase = createAdminClient();
  const codes = Array.from({ length: CODE_COUNT }, newCode);

  const { error: delErr } = await supabase
    .from("mfa_recovery_codes")
    .delete()
    .eq("user_id", userId);
  if (delErr) {
    if (delErr.code === UNDEFINED_TABLE) return null;
    throw delErr;
  }

  const { error: insErr } = await supabase.from("mfa_recovery_codes").insert(
    codes.map((c) => ({ user_id: userId, code_hash: hashCode(c) })),
  );
  if (insErr) {
    if (insErr.code === UNDEFINED_TABLE) return null;
    throw insErr;
  }
  return codes;
}

/** Verify + consume one recovery code. True only for a valid, unused code. */
export async function consumeRecoveryCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("code_hash", hashCode(code))
      .is("used_at", null)
      .select("id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error("[mfa] recovery code check failed:", err);
    return false;
  }
}

/** Remove every TOTP factor from a user (recovery path). Service role. */
export async function deleteAllTotpFactors(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId });
  if (error) throw error;
  for (const factor of data?.factors ?? []) {
    await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
  }
}
