import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { getGodSession } from "./god-auth";

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

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (session) {
    const user = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name || "Hadi Computer",
        isImpersonating: false,
      };
    }
  }

  // Check if Superadmin God-Mode session is active (Impersonation Mode)
  const godSession = await getGodSession();
  if (godSession) {
    const cookieStore = await cookies();
    const impersonatedTenantId = cookieStore.get("god_impersonated_tenant_id")?.value;

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

    return {
      id: "god-mode-superadmin",
      email: godSession.username,
      name: "Superadmin God-Mode",
      role: "SUPERADMIN",
      tenantId: tenant?.id || null,
      tenantName: tenant?.name || "Semua Merchant",
      isImpersonating: true,
    };
  }

  return null;
}
