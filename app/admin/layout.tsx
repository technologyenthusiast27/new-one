import { createClient, getAdminContext } from "@/lib/supabase/server";
import { eventAdminLandingPath } from "@/lib/adminRoutes";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();

  // Unauthenticated visitors are routed to /admin/login by middleware; the
  // login page renders bare (no shell). Authenticated admins get the shell.
  if (!admin) return <>{children}</>;

  // Event admins have a single destination — their event — so the shell shows
  // only that, never the dashboard or the cross-event events list.
  let eventHref: string | undefined;
  if (admin.role !== "super_admin") {
    const supabase = await createClient();
    eventHref = await eventAdminLandingPath(supabase, admin);
  }

  return (
    <AdminShell email={admin.email} role={admin.role} eventHref={eventHref}>
      {children}
    </AdminShell>
  );
}
