import { prisma } from "./db";
import type { TenantAdminSession } from "./auth";

/** Role yang boleh dipakai sebuah tenant: role sistem bersama + custom role milik tenant itu. */
export function rolesVisibleTo(tenantId: string) {
  return { OR: [{ tenantId: null }, { tenantId }] };
}

export function isFullAccessRole(permissions: unknown): boolean {
  return Array.isArray(permissions) && permissions.includes("*");
}

export function isOwnerSession(session: TenantAdminSession): boolean {
  const r = session.role?.toUpperCase();
  return r === "OWNER" || r === "SUPERADMIN" || session.permissions.includes("*");
}

/** Ambil role yang valid untuk tenant (null bila tidak ada / milik tenant lain). */
export async function findAssignableRole(tenantId: string, roleId: string) {
  return prisma.adminRole.findFirst({ where: { id: roleId, ...rolesVisibleTo(tenantId) } });
}

/** Jumlah owner aktif di satu tenant (untuk mencegah toko kehilangan owner terakhir). */
export async function countTenantOwners(tenantId: string, excludeUserId?: string) {
  return prisma.adminUser.count({
    where: {
      tenantId,
      isActive: true,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      OR: [{ role: "OWNER" }, { roleRef: { slug: "owner" } }],
    },
  });
}

export function isOwnerUser(user: { role?: string | null; roleRef?: { slug: string } | null }) {
  return user.role?.toUpperCase() === "OWNER" || user.roleRef?.slug === "owner";
}
