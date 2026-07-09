import { getAdminProfile } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminProfile();

  // Unauthenticated visitors are routed to /admin/login by middleware; the
  // login page renders bare (no shell). Authenticated admins get the shell.
  if (!admin) return <>{children}</>;

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
