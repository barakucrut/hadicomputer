import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { isPlatformRole, type PlatformRole } from "./platform-access";

const JWT_SECRET = new TextEncoder().encode(
  process.env.GOD_MODE_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    "platform-superadmin-god-mode-secret-key-32-chars-2026"
);

export const GOD_COOKIE_NAME = "platform_god_session";

export interface GodSessionPayload {
  username: string;
  role: PlatformRole;
  /** Kosong = superadmin bawaan dari env (GOD_MODE_USER); terisi = akun PlatformUser */
  userId?: string;
  name?: string;
}

/** Sesi tim platform yang sudah divalidasi live ke database. */
export interface PlatformSession {
  username: string;
  name: string;
  role: PlatformRole;
  userId: string | null;
  /** CMO: id akun MARKETING aktif/nonaktif di timnya (dibaca live per request). Selain CMO: kosong. */
  teamIds: string[];
}

export function checkGodCredentials(username: string, password: string): boolean {
  const allowedUser = (process.env.GOD_MODE_USER || "superadmin@platform.com").trim().toLowerCase();
  const allowedPassword = process.env.GOD_MODE_PASSWORD || "SuperGodMode2026!";

  const inputUser = username.trim().toLowerCase();

  // Allow either configured user or shorthand 'godmode'
  const isUserValid = inputUser === allowedUser || inputUser === "godmode";
  const isPassValid = password === allowedPassword;

  return isUserValid && isPassValid;
}

/** Login akun tim platform (PlatformUser). null bila email/password salah atau akun nonaktif. */
export async function checkPlatformUserCredentials(email: string, password: string) {
  const user = await prisma.platformUser.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true },
  });
  if (!user || !user.isActive) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  await prisma.platformUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { id: user.id, email: user.email, name: user.name, role: user.role as PlatformRole };
}

export async function signGodToken(payload: GodSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2d")
    .sign(JWT_SECRET);
}

export async function verifyGodToken(token: string): Promise<GodSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!isPlatformRole(payload.role)) return null;
    return payload as unknown as GodSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Sesi tim platform (superadmin maupun marketing). Akun PlatformUser dicek live:
 * akun nonaktif/dihapus langsung kehilangan akses, peran diambil dari database (bukan JWT).
 */
export async function getPlatformSession(): Promise<PlatformSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GOD_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyGodToken(token);
  if (!payload) return null;

  if (!payload.userId) {
    // Superadmin bawaan (env) — token lama tanpa userId hanya sah untuk peran ini
    if (payload.role !== "SUPERADMIN") return null;
    return { username: payload.username, name: "Superadmin", role: "SUPERADMIN", userId: null, teamIds: [] };
  }

  const user = await prisma.platformUser.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  const teamIds =
    user.role === "CMO"
      ? (await prisma.platformUser.findMany({ where: { managerId: user.id }, select: { id: true } })).map((m) => m.id)
      : [];
  return { username: user.email, name: user.name, role: user.role as PlatformRole, userId: user.id, teamIds };
}

/**
 * Sesi SUPERADMIN saja (akses CMS semua tenant, impersonasi, keuangan).
 * Marketing sengaja mengembalikan null di sini.
 */
export async function getGodSession(): Promise<PlatformSession | null> {
  const session = await getPlatformSession();
  return session?.role === "SUPERADMIN" ? session : null;
}

/**
 * Guard route /api/god-mode/* (middleware hanya melindungi halaman /god-mode).
 * Default hanya SUPERADMIN; berikan daftar peran untuk endpoint yang juga dibuka bagi marketing.
 */
export async function authorizePlatform(
  roles: PlatformRole[] = ["SUPERADMIN"]
): Promise<{ ok: true; session: PlatformSession } | { ok: false; response: Response }> {
  const session = await getPlatformSession();
  if (!session) return { ok: false, response: Response.json({ error: "Sesi berakhir, silakan login ulang." }, { status: 401 }) };
  if (!roles.includes(session.role)) {
    return { ok: false, response: Response.json({ error: "Akses ditolak untuk peran Anda." }, { status: 403 }) };
  }
  return { ok: true, session };
}

/** Kompatibel dengan kode lama: Response 401/403 bila bukan superadmin, null bila lolos. */
export async function requireGodSession(): Promise<Response | null> {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  return auth.ok ? null : auth.response;
}

/**
 * Filter tenant sesuai peran: marketing hanya tenant yang dibawanya, CMO + tenant timnya.
 * Dipakai di semua query tenant god-mode (sama seperti aturan tenantId di admin).
 */
export function tenantScope(session: PlatformSession): { acquiredById?: string | { in: string[] } } {
  if (session.role === "SUPERADMIN") return {};
  const self = session.userId ?? "__none__";
  // CMO: tenant miliknya + tenant semua marketing di timnya
  if (session.role === "CMO") return { acquiredById: { in: [self, ...session.teamIds] } };
  return { acquiredById: self };
}
