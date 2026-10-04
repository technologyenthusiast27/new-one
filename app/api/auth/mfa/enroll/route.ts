import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Begin TOTP enrollment for the signed-in admin. Returns the QR code (SVG data
 * URI) + secret for the authenticator app; the factor stays unverified until
 * /api/auth/mfa/enroll/verify confirms a code.
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Keyed by ACCOUNT, not IP: an attacker on an aal1 session can't churn
  // enrollment attempts (and clear factors) by rotating source addresses.
  const limited = await enforceRateLimit(req, { name: "mfa-enroll", limit: 6, windowSec: 300, key: user.id });
  if (limited) return limited;

  // Only admin accounts manage MFA here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const role = profile?.role as string | undefined;
  if (role !== "super_admin" && role !== "event_admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Clear any stale unverified factors from abandoned enrollment attempts so
  // enroll can't fail with a name collision.
  try {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const f of factors?.all ?? []) {
      if (f.factor_type === "totp" && f.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }
  } catch {
    /* non-fatal */
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `NovaLabs Admin (${new Date().toISOString().slice(0, 10)})`,
  });
  if (error || !data) {
    console.error("[mfa/enroll] failed:", error);
    return NextResponse.json(
      { error: error?.message || "Could not start MFA enrollment." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    factorId: data.id,
    qrCode: data.totp?.qr_code ?? null, // SVG data URI for <img>
    secret: data.totp?.secret ?? null, // manual-entry fallback
  });
}
