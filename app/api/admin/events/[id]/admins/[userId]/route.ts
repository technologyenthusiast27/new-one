import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readJson, rejectCrossOrigin, denied } from "@/lib/apiGuards";
import { adminPolicySchema } from "@/lib/schemas";
import { isUuid, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Per-admin security policy (super admin only). Currently: whether MFA is
 * required for this event admin. Super admins are always MFA-enforced by role,
 * so the flag only matters for event_admin accounts.
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string; userId: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (admin.role !== "super_admin") return denied(req, 403, { actorId: admin.id });
  if (!isUuid(params.id) || !isUuid(params.userId))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const parsed = await readJson(req, adminPolicySchema);
  if (!parsed.ok) return parsed.response;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ mfa_enforced: parsed.data.mfaEnforced })
    .eq("id", params.userId)
    .eq("role", "event_admin"); // never lets this weaken a super_admin
  if (error) {
    console.error("[admin/admins PATCH]", error);
    return NextResponse.json({ error: "Could not update the policy." }, { status: 500 });
  }

  await logAdminAction({
    actorId: admin.id,
    action: "event_admin.mfa_policy",
    eventId: params.id,
    targetType: "user",
    targetId: params.userId,
    metadata: { mfaEnforced: parsed.data.mfaEnforced },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, mfaEnforced: parsed.data.mfaEnforced });
}

/** Remove an event admin's assignment from this event (super admin only). */
export async function DELETE(req: Request, props: { params: Promise<{ id: string; userId: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return denied(req, 401);
  if (admin.role !== "super_admin")
    return denied(req, 403, { actorId: admin.id });
  if (!isUuid(params.id) || !isUuid(params.userId))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_admins")
    .delete()
    .eq("event_id", params.id)
    .eq("user_id", params.userId);
  if (error) {
    console.error("[admin/admins DELETE]", error);
    return NextResponse.json({ error: "Could not remove the admin." }, { status: 500 });
  }

  await logAdminAction({
    actorId: admin.id,
    action: "event_admin.remove",
    eventId: params.id,
    targetType: "user",
    targetId: params.userId,
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
