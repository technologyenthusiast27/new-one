import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** List the event admins assigned to this event (super admin only). */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("event_admins")
    .select("user_id, created_at, profiles!inner(id, email, full_name, role)")
    .eq("event_id", params.id);
  if (error) {
    console.error("[admin/admins GET]", error);
    return NextResponse.json({ error: "Could not load admins." }, { status: 500 });
  }
  const admins = (rows ?? []).map((r) => {
    const p = r.profiles as unknown as {
      id: string;
      email: string | null;
      full_name: string | null;
    };
    return { id: p.id, email: p.email, fullName: p.full_name, assignedAt: r.created_at };
  });
  return NextResponse.json({ admins });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Assign an event admin to this event (super admin only). Creates the user via
 * Supabase Auth if they don't exist yet; otherwise assigns the existing user.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (admin.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: { email?: string; password?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const supabase = createAdminClient();

  // Find an existing profile with this email.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id as string | undefined;
  let createdPassword: string | undefined;

  if (!userId) {
    const password =
      body.password && body.password.length >= 8
        ? body.password
        : generatePassword();
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createErr || !created?.user) {
      console.error("[admin/admins POST] createUser", createErr);
      return NextResponse.json(
        { error: createErr?.message || "Could not create the user." },
        { status: 400 },
      );
    }
    userId = created.user.id;
    createdPassword = password;
    if (body.fullName) {
      await supabase.from("profiles").update({ full_name: body.fullName }).eq("id", userId);
    }
  }

  const { error: assignErr } = await supabase
    .from("event_admins")
    .upsert({ user_id: userId, event_id: params.id }, { onConflict: "user_id,event_id" });
  if (assignErr) {
    console.error("[admin/admins POST] assign", assignErr);
    return NextResponse.json({ error: "Could not assign the admin." }, { status: 500 });
  }

  // createdPassword is returned once so the super admin can share it.
  return NextResponse.json(
    { admin: { id: userId, email, createdPassword: createdPassword ?? null } },
    { status: 201 },
  );
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
