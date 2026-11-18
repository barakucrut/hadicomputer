import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "hadi-computer-cms-secret-key-32-chars-long-2026"
);

export const COOKIE_NAME = "hadi_admin_session";

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  roleName?: string;
  permissions?: string[];
}

export function hasPermission(session: AdminSessionPayload | null, permission: string): boolean {
  if (!session) return false;
  if (session.role?.toUpperCase() === "OWNER" || session.role === "owner") return true;
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

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }
  const user = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      roleRef: {
        select: {
          id: true,
          name: true,
          slug: true,
          permissions: true,
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const permissions = Array.isArray(user.roleRef?.permissions)
    ? (user.roleRef.permissions as string[])
    : user.role?.toUpperCase() === "OWNER" || user.role === "owner"
    ? ["*"]
    : [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.roleRef?.slug || user.role,
    roleName: user.roleRef?.name || user.role,
    permissions,
  };
}
