/**
 * Validasi & normalisasi pengaturan SEO, analitik, dan katalog per toko.
 * Nilai-nilai ini disuntikkan ke <head> storefront, jadi WAJIB divalidasi ketat
 * (hanya format ID resmi yang diterima) agar tidak bisa dipakai untuk menyisipkan script.
 */

export const STOCK_DISPLAY_MODES = ["hidden", "exact", "limited"] as const;
export type StockDisplayMode = (typeof STOCK_DISPLAY_MODES)[number];

export class SettingsValidationError extends Error {}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** "g-abc123xyz" -> "G-ABC123XYZ"; kosong -> null. */
export function normalizeGaId(v: unknown): string | null {
  const s = clean(v, 30).toUpperCase();
  if (!s) return null;
  if (!/^G-[A-Z0-9]{6,12}$/.test(s)) {
    throw new SettingsValidationError("Measurement ID GA4 tidak valid. Formatnya G-XXXXXXXXXX (lihat Admin → Data Streams di Google Analytics).");
  }
  return s;
}

export function normalizeGtmId(v: unknown): string | null {
  const s = clean(v, 30).toUpperCase();
  if (!s) return null;
  if (!/^GTM-[A-Z0-9]{4,10}$/.test(s)) {
    throw new SettingsValidationError("Container ID Google Tag Manager tidak valid. Formatnya GTM-XXXXXXX.");
  }
  return s;
}

/** Terima token saja ATAU tempelan tag lengkap <meta name="google-site-verification" content="..."/>. */
export function normalizeSiteVerification(v: unknown): string | null {
  const raw = clean(v, 400);
  if (!raw) return null;
  const fromTag = raw.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
  const token = (fromTag || raw).trim();
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(token)) {
    throw new SettingsValidationError("Kode verifikasi Google Search Console tidak valid. Tempel tag <meta> dari Search Console atau isi kodenya saja.");
  }
  return token;
}

export function normalizeSkuPrefix(v: unknown): string | null {
  const s = clean(v, 20).toUpperCase().replace(/-+$/, "");
  if (!s) return null;
  if (!/^[A-Z0-9]{2,8}$/.test(s)) {
    throw new SettingsValidationError("Prefix SKU harus 2–8 huruf/angka tanpa spasi, mis. HC atau BITCOM.");
  }
  return s;
}

export function normalizeImageUrl(v: unknown): string | null {
  const s = clean(v, 255);
  if (!s) return null;
  if (!s.startsWith("/uploads/") && !s.startsWith("/images/") && !/^https:\/\/[^\s"'<>]+$/i.test(s)) {
    throw new SettingsValidationError("Gambar share harus diunggah lewat CMS atau berupa URL https.");
  }
  return s;
}

export function normalizeStockDisplay(v: unknown): StockDisplayMode {
  return STOCK_DISPLAY_MODES.includes(v as StockDisplayMode) ? (v as StockDisplayMode) : "hidden";
}

export function normalizeThreshold(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 3;
}

/** Tahun berdiri toko (opsional), mis. 1998. */
export function normalizeFoundedYear(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  const now = new Date().getFullYear();
  if (!Number.isFinite(n) || n < 1900 || n > now) {
    throw new SettingsValidationError(`Tahun berdiri harus antara 1900 dan ${now}.`);
  }
  return n;
}

/** Chip pencarian cepat: maks. 8 frasa, masing-masing maks. 40 karakter, tanpa duplikat. */
export function normalizeQuickSearches(v: unknown): string[] {
  const list = Array.isArray(v) ? v : [];
  const out: string[] = [];
  for (const item of list) {
    const t = clean(item, 40);
    if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
    if (out.length === 8) break;
  }
  return out;
}

export interface AdvancedSettingsInput {
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  googleSiteVerification: string | null;
  searchIndexing: boolean;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  stockDisplay: StockDisplayMode;
  lowStockThreshold: number;
  skuPrefix: string | null;
  foundedYear: number | null;
  quickSearches: string[];
}

export function parseAdvancedSettings(body: Record<string, unknown>): AdvancedSettingsInput {
  return {
    seoTitle: clean(body.seoTitle, 70) || null,
    seoDescription: clean(body.seoDescription, 170) || null,
    seoKeywords: clean(body.seoKeywords, 255) || null,
    ogImageUrl: normalizeImageUrl(body.ogImageUrl),
    googleSiteVerification: normalizeSiteVerification(body.googleSiteVerification),
    searchIndexing: body.searchIndexing !== false,
    gaMeasurementId: normalizeGaId(body.gaMeasurementId),
    gtmContainerId: normalizeGtmId(body.gtmContainerId),
    stockDisplay: normalizeStockDisplay(body.stockDisplay),
    lowStockThreshold: normalizeThreshold(body.lowStockThreshold),
    skuPrefix: normalizeSkuPrefix(body.skuPrefix),
    foundedYear: normalizeFoundedYear(body.foundedYear),
    quickSearches: normalizeQuickSearches(body.quickSearches),
  };
}
