"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";

/**
 * Client-side permission context for the CMS.
 * NOTE: this only hides UI. The real enforcement lives in the API routes
 * (authorizeAdmin in src/lib/auth.ts), which re-check every request.
 */
interface PermissionsContextValue {
  permissions: string[];
  isOwner: boolean;
}

const PermissionsContext = React.createContext<PermissionsContextValue>({
  permissions: [],
  isOwner: false,
});

export function PermissionsProvider({
  permissions,
  role,
  children,
}: {
  permissions?: string[];
  role?: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => {
    const list = Array.isArray(permissions) ? permissions : [];
    const isOwner = role?.toUpperCase() === "OWNER" || list.includes("*");
    return { permissions: list, isOwner };
  }, [permissions, role]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

/** Returns a checker: can("products:delete") or can(["a", "b"]) (any of). */
export function useCan() {
  const { permissions, isOwner } = React.useContext(PermissionsContext);
  return React.useCallback(
    (required: string | string[]) => {
      if (isOwner) return true;
      const list = Array.isArray(required) ? required : [required];
      return list.some((perm) => permissions.includes(perm));
    },
    [permissions, isOwner]
  );
}

/** Which permission(s) each CMS route needs (any of). Most specific first. */
export const ROUTE_PERMISSIONS: { match: (path: string) => boolean; required: string[] }[] = [
  { match: (p) => p === "/admin/produk/baru", required: ["products:create"] },
  { match: (p) => p.startsWith("/admin/produk/"), required: ["products:edit"] },
  { match: (p) => p.startsWith("/admin/produk"), required: ["products:view"] },
  { match: (p) => p.startsWith("/admin/kategori"), required: ["categories:manage", "brands:manage"] },
  { match: (p) => p.startsWith("/admin/banner"), required: ["banners:view", "banners:manage"] },
  { match: (p) => p.startsWith("/admin/layanan"), required: ["services:view", "services:manage"] },
  { match: (p) => p.startsWith("/admin/inquiry-analytics"), required: ["inquiries:view"] },
  { match: (p) => p.startsWith("/admin/user-role"), required: ["users:view", "users:manage", "roles:manage"] },
  // /admin/pengaturan stays open to every user: it also holds "Ganti Password".
  { match: (p) => p === "/admin", required: ["dashboard:view"] },
];

export function requiredPermissionsFor(pathname: string): string[] | null {
  const rule = ROUTE_PERMISSIONS.find((r) => r.match(pathname));
  return rule ? rule.required : null;
}

export function AccessDenied() {
  return (
    <div className="admin-card rounded-xl border bg-white" style={{ padding: "48px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 16px",
          borderRadius: 12,
          background: "#fee2e2",
          color: "var(--red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShieldAlert size={22} />
      </div>
      <h2 className="text-lg font-black text-[#111413]">Akses Ditolak</h2>
      <p className="text-sm text-[#525854] mt-2" style={{ maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
        Role Anda tidak memiliki hak akses ke halaman ini. Hubungi Owner toko jika Anda memerlukan akses.
      </p>
    </div>
  );
}
