import { requireAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import "@/app/admin.css";

export const metadata = {
  title: "Admin Panel | Hadi Computer",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminSession();

  // If user is null and path is not /admin/login, client will redirect or middleware will handle.
  return <AdminShell user={user}>{children}</AdminShell>;
}
