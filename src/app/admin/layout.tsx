import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { getPlatformSession } from "@/lib/god-auth";
import { IMPERSONATION_COOKIE } from "@/lib/platform-cms";
import { CMS_PATH_HEADER } from "@/lib/storefront-template";
import { AdminShell } from "@/components/admin/admin-shell";
import "@/app/admin.css";

export const metadata = {
  title: {
    absolute: "Rigspace.id — Content Management System",
    template: "%s · Rigspace.id CMS",
  },
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminSession();

  // Tim penjualan membuka toko di luar lingkupnya (mis. tenant baru dipindah ke marketing lain)
  if (!user) {
    const headerStore = await headers();
    const path = headerStore.get(CMS_PATH_HEADER);
    const cookieStore = await cookies();
    if (path && path !== "/admin/login" && cookieStore.get(IMPERSONATION_COOKIE)?.value) {
      const platform = await getPlatformSession();
      if (platform && platform.role !== "SUPERADMIN") redirect("/god-mode/tenants?cms=ditolak");
    }
  }

  // If user is null and path is not /admin/login, client will redirect or middleware will handle.
  return <AdminShell user={user}>{children}</AdminShell>;
}
