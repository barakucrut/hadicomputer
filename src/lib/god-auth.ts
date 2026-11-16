import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.GOD_MODE_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    "platform-superadmin-god-mode-secret-key-32-chars-2026"
);

export const GOD_COOKIE_NAME = "platform_god_session";

export interface GodSessionPayload {
  username: string;
  role: "SUPERADMIN";
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
    return payload as unknown as GodSessionPayload;
  } catch {
    return null;
  }
}

export async function getGodSession(): Promise<GodSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GOD_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyGodToken(token);
}
