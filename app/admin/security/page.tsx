import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SecurityPanel } from "@/components/admin/SecurityPanel";

export const dynamic = "force-dynamic";

/**
 * Account security: TOTP enrollment, recovery codes, global sign-out.
 * Reachable at aal1 (before MFA enrollment) by design — this is where an
 * enforced account completes setup. Everything privileged the panel calls is
 * its own server-verified endpoint.
 */
export default async function AdminSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const role = profile?.role as string | undefined;
  if (role !== "super_admin" && role !== "event_admin") redirect("/admin/login");

  let hasVerifiedTotp = false;
  let factorId: string | null = null;
  let aal2 = false;
  try {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === "verified") ?? null;
    hasVerifiedTotp = Boolean(verified);
    factorId = verified?.id ?? null;
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    aal2 = aal?.currentLevel === "aal2";
  } catch {
    /* panel handles unknown state */
  }

  const mfaRequired = role === "super_admin" || profile?.mfa_enforced === true;

  return (
    <SecurityPanel
      email={(profile?.email as string | null) ?? user.email ?? null}
      role={role}
      mfaRequired={mfaRequired}
      hasVerifiedTotp={hasVerifiedTotp}
      factorId={factorId}
      aal2={aal2}
    />
  );
}
