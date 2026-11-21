/**
 * Hak akses tim internal platform (god-mode) — logika murni, tanpa I/O,
 * dipakai middleware (redirect halaman), API (penegakan), dan UI (menyembunyikan menu).
 *
 * SUPERADMIN : akses penuh.
 * CMO        : seperti marketing, tetapi lingkupnya tenant miliknya + tenant semua marketing di timnya
 *              (PlatformUser.managerId = CMO). Tetap tidak boleh paket/status/fitur/domain, hapus,
 *              masuk CMS tenant, keuangan, atau mengelola akun tim.
 * MARKETING  : dashboard portofolio + tenant yang dibawanya sendiri (lihat, tambah, edit kontak & warna).
 *              Tidak boleh: paket/status/fitur/domain, hapus, masuk CMS tenant, keuangan, tim.
 */

export type PlatformRole = "SUPERADMIN" | "CMO" | "MARKETING";

export const PLATFORM_ROLES: PlatformRole[] = ["SUPERADMIN", "CMO", "MARKETING"];

/** Semua peran tim platform (untuk endpoint yang dibuka bagi tim penjualan). */
export const ALL_PLATFORM_ROLES: PlatformRole[] = ["SUPERADMIN", "CMO", "MARKETING"];

/** Peran penjual: bisa memegang tenant (acquiredById) & menerima komisi langsung. */
export const SALES_ROLES: PlatformRole[] = ["CMO", "MARKETING"];

export const PLATFORM_ROLE_LABEL: Record<PlatformRole, string> = {
  SUPERADMIN: "Superadmin",
  CMO: "CMO",
  MARKETING: "Marketing",
};

export function isPlatformRole(value: unknown): value is PlatformRole {
  return value === "SUPERADMIN" || value === "CMO" || value === "MARKETING";
}

export function isSalesRole(role: PlatformRole): boolean {
  return role === "CMO" || role === "MARKETING";
}

/** Halaman god-mode yang boleh dibuka marketing & CMO (prefix). Lainnya hanya superadmin. */
const MARKETING_PATHS = ["/god-mode", "/god-mode/tenants"];

/** CMO: halaman marketing + kotak masuk permintaan demo dari landing page. */
const CMO_PATHS = [...MARKETING_PATHS, "/god-mode/permintaan-demo"];

export function canAccessGodPath(role: PlatformRole, pathname: string): boolean {
  if (role === "SUPERADMIN") return true;
  const path = pathname.replace(/\/+$/, "") || "/";
  const allowed = role === "CMO" ? CMO_PATHS : MARKETING_PATHS;
  return allowed.some((p) => path === p || (p !== "/god-mode" && path.startsWith(`${p}/`)));
}

export interface GodNavItem {
  href: string;
  label: string;
  icon: "dashboard" | "tenants" | "leads" | "team" | "transactions" | "styleguide";
}

const NAV: GodNavItem[] = [
  { href: "/god-mode", label: "Dashboard Summary", icon: "dashboard" },
  { href: "/god-mode/tenants", label: "Daftar Tenant Toko", icon: "tenants" },
  { href: "/god-mode/permintaan-demo", label: "Permintaan Demo", icon: "leads" },
  { href: "/god-mode/team", label: "Tim Platform", icon: "team" },
  { href: "/god-mode/transactions", label: "Transaksi Keuangan", icon: "transactions" },
  { href: "/god-mode/styleguide", label: "Design Guide", icon: "styleguide" },
];

export function godNavFor(role: PlatformRole): GodNavItem[] {
  return NAV.filter((item) => canAccessGodPath(role, item.href));
}

// ----------------------------------------------------
// Update tenant: field yang boleh diubah per peran
// ----------------------------------------------------

export interface TenantUpdateInput {
  name?: string;
  customDomain?: string | null;
  plan?: "STARTER" | "PRO" | "ENTERPRISE";
  status?: "ACTIVE" | "TRIAL" | "SUSPENDED";
  features?: Record<string, boolean>;
  primaryColor?: string;
  secondaryColor?: string;
  whatsappNumber?: string;
  address?: string;
  openHours?: string;
  acquiredById?: string | null;
}

const PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;
const STATUSES = ["ACTIVE", "TRIAL", "SUSPENDED"] as const;

/** Nomor WhatsApp wajar: 9–15 digit, diawali 62 atau 0 (dinormalisasi ke 62…). */
export function normalizeWhatsapp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith("62") || digits.length < 10 || digits.length > 15) return null;
  return digits;
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

export type TenantUpdateResult = { ok: true; data: TenantUpdateInput } | { ok: false; error: string };

/**
 * Saring & validasi body PATCH tenant sesuai peran. Field di luar hak peran diabaikan
 * (bukan error) supaya form lama tetap jalan, tetapi tidak pernah tersimpan.
 */
export function pickTenantUpdate(role: PlatformRole, body: unknown): TenantUpdateResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: TenantUpdateInput = {};

  if (b.name !== undefined) {
    const name = text(b.name, 150);
    if (!name) return { ok: false, error: "Nama toko wajib diisi." };
    data.name = name;
  }
  // Kosong / placeholder "628" = belum diisi -> tidak diubah (form edit selalu mengirim field ini)
  const waDigits = typeof b.whatsappNumber === "string" ? b.whatsappNumber.replace(/[^\d]/g, "") : "";
  if (b.whatsappNumber !== undefined && waDigits.length > 3) {
    const wa = normalizeWhatsapp(b.whatsappNumber);
    if (!wa) return { ok: false, error: "Nomor WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx." };
    data.whatsappNumber = wa;
  }
  if (b.address !== undefined) data.address = text(b.address, 500) ?? "";
  if (b.openHours !== undefined) data.openHours = text(b.openHours, 150) ?? "";
  if (b.primaryColor !== undefined) {
    if (typeof b.primaryColor !== "string" || !/^#[0-9a-f]{6}$/i.test(b.primaryColor)) {
      return { ok: false, error: "Warna brand harus berformat hex, mis. #cc252b." };
    }
    data.primaryColor = b.primaryColor;
  }
  if (b.secondaryColor !== undefined) {
    if (typeof b.secondaryColor !== "string" || !/^#[0-9a-f]{6}$/i.test(b.secondaryColor)) {
      return { ok: false, error: "Warna sekunder harus berformat hex, mis. #111413." };
    }
    data.secondaryColor = b.secondaryColor;
  }

  if (role !== "SUPERADMIN") return { ok: true, data };

  if (b.customDomain !== undefined) {
    const domain = typeof b.customDomain === "string" ? b.customDomain.trim().toLowerCase() : "";
    if (domain && !/^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/.test(domain)) {
      return { ok: false, error: "Custom domain tidak valid." };
    }
    data.customDomain = domain || null;
  }
  if (b.plan !== undefined) {
    if (!PLANS.includes(b.plan as (typeof PLANS)[number])) return { ok: false, error: "Paket tidak dikenal." };
    data.plan = b.plan as TenantUpdateInput["plan"];
  }
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status as (typeof STATUSES)[number])) return { ok: false, error: "Status tidak dikenal." };
    data.status = b.status as TenantUpdateInput["status"];
  }
  if (b.features !== undefined) {
    if (!b.features || typeof b.features !== "object" || Array.isArray(b.features)) {
      return { ok: false, error: "Format fitur tidak valid." };
    }
    data.features = Object.fromEntries(
      Object.entries(b.features as Record<string, unknown>)
        .filter(([key]) => /^[a-zA-Z]{1,40}$/.test(key))
        .map(([key, value]) => [key, value === true])
    );
  }
  if (b.acquiredById !== undefined) {
    data.acquiredById = typeof b.acquiredById === "string" && b.acquiredById.trim() ? b.acquiredById.trim() : null;
  }
  return { ok: true, data };
}

// ----------------------------------------------------
// Kesehatan onboarding tenant (dashboard marketing)
// ----------------------------------------------------

export interface TenantHealthInput {
  products: number;
  sampleProducts: number;
  banners: number;
  hasLogo: boolean;
  whatsappNumber: string | null | undefined;
  address: string | null | undefined;
  lastAdminLoginAt: Date | string | null | undefined;
  inquiries30d: number;
}

export type HealthCheckKey = "katalog" | "dataAsli" | "banner" | "logo" | "kontak" | "aktif" | "inquiry";

export interface TenantHealth {
  checks: { key: HealthCheckKey; label: string; ok: boolean }[];
  score: number; // 0–100
  stage: "baru" | "onboarding" | "siap" | "berjalan";
  /** Pekerjaan follow-up paling penting untuk marketing */
  nextAction: string | null;
}

/** Placeholder bawaan createTenant / form ("628", "6285769000007", "Indonesia") dianggap belum diisi. */
const PLACEHOLDER_WA = new Set(["628", "6285769000007", "6281234567890"]);

export function hasRealWhatsapp(value: string | null | undefined): boolean {
  const wa = normalizeWhatsapp(value ?? "");
  return Boolean(wa && !PLACEHOLDER_WA.has(wa));
}

export function hasRealAddress(value: string | null | undefined): boolean {
  const a = (value || "").trim();
  return a.length >= 10 && a.toLowerCase() !== "indonesia";
}

export function tenantHealth(input: TenantHealthInput, now: Date = new Date()): TenantHealth {
  const lastLogin = input.lastAdminLoginAt ? new Date(input.lastAdminLoginAt) : null;
  const loggedInRecently = Boolean(lastLogin && now.getTime() - lastLogin.getTime() <= 14 * 86_400_000);
  const realProducts = Math.max(0, input.products - input.sampleProducts);

  const checks: TenantHealth["checks"] = [
    { key: "katalog", label: "Minimal 10 produk", ok: input.products >= 10 },
    { key: "dataAsli", label: "Produk asli (bukan data contoh)", ok: realProducts > 0 && input.sampleProducts === 0 },
    { key: "banner", label: "Banner etalase", ok: input.banners > 0 },
    { key: "logo", label: "Logo toko", ok: input.hasLogo },
    { key: "kontak", label: "WhatsApp & alamat asli", ok: hasRealWhatsapp(input.whatsappNumber) && hasRealAddress(input.address) },
    { key: "aktif", label: "Admin login 14 hari terakhir", ok: loggedInRecently },
    { key: "inquiry", label: "Ada inquiry 30 hari terakhir", ok: input.inquiries30d > 0 },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  const setupDone = checks.slice(0, 5).every((c) => c.ok);
  const stage: TenantHealth["stage"] =
    input.products === 0 && !lastLogin ? "baru" : !setupDone ? "onboarding" : input.inquiries30d > 0 ? "berjalan" : "siap";

  const ACTION: Record<HealthCheckKey, string> = {
    kontak: "Minta nomor WhatsApp & alamat toko yang asli",
    katalog: "Bantu toko mengunggah atau mengimpor katalog",
    dataAsli: "Ganti data contoh dengan produk asli toko",
    logo: "Minta logo toko",
    banner: "Buat banner etalase (Studio Banner)",
    aktif: "Hubungi admin toko, belum login 14 hari",
    inquiry: "Dorong toko membagikan link etalase",
  };
  const order: HealthCheckKey[] = ["kontak", "katalog", "dataAsli", "logo", "banner", "aktif", "inquiry"];
  const firstMissing = order.find((key) => !checks.find((c) => c.key === key)!.ok);
  return { checks, score, stage, nextAction: firstMissing ? ACTION[firstMissing] : null };
}
