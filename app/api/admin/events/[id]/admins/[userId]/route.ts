import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Remove an event admin's assignment from this event (super admin only). */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; userId: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

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
  return NextResponse.json({ ok: true });
}
