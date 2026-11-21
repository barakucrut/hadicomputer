import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { getPlatformSession, tenantScope, type PlatformSession } from "./god-auth";
import { PLATFORM_ROLE_LABEL } from "./platform-access";
import { IMPERSONATION_COOKIE, platformCmsPermissions, platformCmsSessionId } from "./platform-cms";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "hadi-computer-cms-secret-key-32-chars-long-2026"
);

export const COOKIE_NAME = "hadi_admin_session";

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string | null;
  roleName?: string;
  permissions?: string[];
}

export interface ResolvedAdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  roleName: string;
  permissions: string[];
  tenantId: string | null;
  tenantName: string;
  isImpersonating: boolean;
}

function isOwnerRole(role?: string | null) {
  const r = role?.toUpperCase();
  return r === "OWNER" || r === "SUPERADMIN";
}

export function hasPermission(
  session: Pick<AdminSessionPayload, "role" | "permissions"> | null,
  permission: string
): boolean {
  if (!session) return false;
  if (isOwnerRole(session.role)) return true;
  if (!session.permissions || !Array.isArray(session.permissions)) return false;
  if (session.permissions.includes("*")) return true;
  return session.permissions.includes(permission);
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Tenant CMS yang dibuka tim platform lewat god-mode.
 * - Superadmin: tenant dari cookie impersonasi, atau tenant pertama.
 * - CMO/Marketing: HANYA tenant dari cookie yang masih dalam lingkupnya (dicek live ke database).
 *   Tidak ada fallback ke toko lain: di luar lingkup = tidak punya akses CMS.
 */
async function resolvePlatformCmsTenant(platform: PlatformSession) {
  const cookieStore = await cookies();
  const impersonatedTenantId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (platform.role !== "SUPERADMIN") {
    if (!impersonatedTenantId) return null;
    return prisma.tenant.findFirst({
      where: { id: impersonatedTenantId, ...tenantScope(platform) },
      select: { id: true, name: true, slug: true },
    });
  }

  let tenant = null;
  if (impersonatedTenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: impersonatedTenantId },
      select: { id: true, name: true, slug: true },
    });
  }
  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true },
    });
  }
  return tenant;
}

/** Sesi CMS untuk tim platform yang sedang membuka toko lewat god-mode (null bila tidak berlaku). */
async function resolvePlatformCmsSession(): Promise<ResolvedAdminSession | null> {
  const platform = await getPlatformSession();
  if (!platform) return null;
  const tenant = await resolvePlatformCmsTenant(platform);
  // Tim penjualan tanpa tenant sah -> bukan sesi CMS (jatuh ke login admin toko biasa)
  if (platform.role !== "SUPERADMIN" && !tenant) return null;
  const label = platform.role === "SUPERADMIN" ? "Superadmin God-Mode" : `${platform.name} (${PLATFORM_ROLE_LABEL[platform.role]})`;
  return {
    id: platformCmsSessionId(platform.role, platform.userId),
    email: platform.username,
    name: label,
    role: platform.role,
    roleName: platform.role === "SUPERADMIN" ? "Superadmin" : `${PLATFORM_ROLE_LABEL[platform.role]} Rigspace`,
    permissions: platformCmsPermissions(platform.role),
    tenantId: tenant?.id || null,
    tenantName: tenant?.name || "RigSpace",
    isImpersonating: true,
  };
}

/** Sesi mentah dari cookie (JWT). Untuk keputusan izin gunakan requireAdminSession / authorizeAdmin. */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  // 1. Tim platform yang membuka CMS toko lewat god-mode (prioritas)
  const platformCms = await resolvePlatformCmsSession();
  if (platformCms) {
    return {
      id: platformCms.id,
      email: platformCms.email,
      name: platformCms.name,
      role: platformCms.role,
      tenantId: platformCms.tenantId,
      permissions: platformCms.permissions,
    };
  }

  // 2. Regular admin session
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

/**
 * Sesi admin yang sudah divalidasi ke database: user aktif, tenant, dan
 * izin role terkini (bukan dari JWT, jadi perubahan role langsung berlaku).
 */
export async function requireAdminSession(): Promise<ResolvedAdminSession | null> {
  // 1. Tim platform via god-mode (superadmin: semua toko; CMO/marketing: toko miliknya saja)
  const platformCms = await resolvePlatformCmsSession();
  if (platformCms) return platformCms;

  // 2. Admin tenant biasa
  const session = await getAdminSession();
  if (!session) return null;

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: { select: { id: true, name: true, slug: true, status: true } },
        roleRef: { select: { id: true, name: true, slug: true, permissions: true } },
      },
    });

    if (!user || user.isActive === false) return null;
    if (user.tenant?.status === "SUSPENDED") return null;

    const permissions = Array.isArray(user.roleRef?.permissions)
      ? (user.roleRef.permissions as string[])
      : isOwnerRole(user.role)
      ? ["*"]
      : [];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roleRef?.slug || user.role,
      roleName: user.roleRef?.name || user.role,
      permissions,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || "Toko",
      isImpersonating: false,
    };
  } catch (err) {
    console.error("requireAdminSession DB error:", err);
    return null;
  }
}

export type TenantAdminSession = ResolvedAdminSession & { tenantId: string };

type AuthorizeResult =
  | { ok: true; session: TenantAdminSession; tenantId: string }
  | { ok: false; response: NextResponse };

/**
 * Guard untuk semua route API admin tenant.
 * - Memastikan sesi valid & user aktif (izin dibaca live dari database).
 * - Memastikan sesi terhubung ke satu tenant; semua query WAJIB memakai
 *   `tenantId` hasil guard ini agar data antar toko tidak bocor.
 * - Lolos bila user memiliki SALAH SATU izin pada daftar `required`.
 */
export async function authorizeAdmin(required?: string | string[]): Promise<AuthorizeResult> {
  const session = await requireAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!session.tenantId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Akun ini belum terhubung ke toko mana pun." },
        { status: 403 }
      ),
    };
  }

  const list = required ? (Array.isArray(required) ? required : [required]) : [];
  if (list.length > 0 && !list.some((perm) => hasPermission(session, perm))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Anda tidak memiliki izin untuk melakukan aksi ini." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session: session as TenantAdminSession, tenantId: session.tenantId };
}
