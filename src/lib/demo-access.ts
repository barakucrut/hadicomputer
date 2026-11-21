/**
 * Mode Demo: etalase calon klien terkunci sampai closing.
 *
 * Alur: marketing menyalin link `https://{slug}.rigspace.id/demo/{token}` → route /demo/[token]
 * memvalidasi token, mencatat DemoView, lalu memberi cookie `rs_demo_{tenantId}` bertanda tangan HMAC.
 * Cookie hanya sah selama token toko masih sama & belum kedaluwarsa, jadi "Buat link baru" langsung
 * mematikan semua link & cookie lama.
 *
 * Murni (crypto saja) supaya bisa dites.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEMO_LINK_DAYS = 30;
export const DEMO_COOKIE_PREFIX = "rs_demo_";

function secret(): string {
  return process.env.DEMO_LINK_SECRET || process.env.ADMIN_JWT_SECRET || "rigspace-demo-link-secret-dev-only-2026";
}

export function demoCookieName(tenantId: string): string {
  return `${DEMO_COOKIE_PREFIX}${tenantId}`;
}

/** Token acak URL-safe (24 karakter). */
export function generateDemoToken(): string {
  return randomBytes(18).toString("base64url");
}

export function isDemoTokenFormat(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

export function demoExpiry(now: Date = new Date(), days: number = DEMO_LINK_DAYS): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

function sign(tenantId: string, token: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${tenantId}:${token}:${exp}`).digest("base64url");
}

/** Nilai cookie akses demo: "{expMs}.{hmac}". */
export function signDemoCookie(tenantId: string, token: string, expiresAt: Date): string {
  const exp = expiresAt.getTime();
  return `${exp}.${sign(tenantId, token, exp)}`;
}

/** Cookie sah = ditandatangani untuk token toko saat ini dan belum kedaluwarsa. */
export function verifyDemoCookie(
  tenantId: string,
  currentToken: string | null | undefined,
  value: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!currentToken || !value) return false;
  const [expRaw, mac] = value.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !mac || exp <= now.getTime()) return false;
  const expected = Buffer.from(sign(tenantId, currentToken, exp));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function isDemoLinkActive(expiresAt: Date | string | null | undefined, now: Date = new Date()): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() > now.getTime());
}

/** Jenis perangkat kasar dari User-Agent (tanpa menyimpan UA mentah). */
export function deviceFromUserAgent(ua: string | null | undefined): "mobile" | "tablet" | "desktop" {
  const s = (ua || "").toLowerCase();
  if (/ipad|tablet/.test(s)) return "tablet";
  if (/mobi|android|iphone/.test(s)) return "mobile";
  return "desktop";
}
