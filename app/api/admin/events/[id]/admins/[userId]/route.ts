import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossOrigin } from "@/lib/apiGuards";
import { isUuid, clientIp } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Remove an event admin's assignment from this event (super admin only). */
export async function DELETE(req: Request, props: { params: Promise<{ id: string; userId: string }> }) {
  const params = await props.params;
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
