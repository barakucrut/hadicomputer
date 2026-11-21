/**
 * Akses CMS toko (/admin) oleh tim platform (god-mode). Murni, bisa dites.
 *
 * - SUPERADMIN : semua toko, izin penuh ("*").
 * - CMO/MARKETING : HANYA toko dalam lingkupnya (tenantScope), dicek live tiap request.
 *   Izin = semua izin CMS kecuali kelola user & role, supaya tim penjualan tidak bisa membuat
 *   akun toko tersembunyi yang tetap aktif setelah tenant dipindah ke marketing lain.
 *
 * Menambah izin CMS baru: tambahkan juga di sini bila tim penjualan boleh memakainya.
 */
import type { PlatformRole } from "./platform-access";

export const IMPERSONATION_COOKIE = "god_impersonated_tenant_id";

export const SALES_CMS_PERMISSIONS: string[] = [
  "dashboard:view",
  "products:view",
  "products:create",
  "products:edit",
  "products:delete",
  "categories:manage",
  "brands:manage",
  "banners:view",
  "banners:manage",
  "services:view",
  "services:manage",
  "testimonials:view",
  "testimonials:manage",
  "inquiries:view",
  "settings:appearance",
  "settings:store_info",
  "settings:sections",
  "users:view",
];

/** Izin yang tidak pernah diberikan ke tim penjualan di CMS toko. */
export const SALES_CMS_FORBIDDEN = ["users:manage", "roles:manage"];

export function platformCmsPermissions(role: PlatformRole): string[] {
  return role === "SUPERADMIN" ? ["*"] : SALES_CMS_PERMISSIONS;
}

/** ID sesi admin sintetis untuk tim platform (bukan AdminUser). */
export function platformCmsSessionId(role: PlatformRole, userId: string | null): string {
  return role === "SUPERADMIN" ? "god-mode-superadmin" : `platform-${userId ?? "unknown"}`;
}

export function isPlatformCmsSessionId(id: string | null | undefined): boolean {
  return id === "god-mode-superadmin" || Boolean(id?.startsWith("platform-"));
}
