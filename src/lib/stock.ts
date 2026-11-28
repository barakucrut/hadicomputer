/**
 * Aturan stok produk (dipakai form, API, import, dan storefront).
 * - stock null  = stok tidak dilacak (ketersediaan diatur manual)
 * - stock 0     = otomatis HABIS
 * - stock > 0 dan status HABIS = otomatis kembali TERSEDIA
 */
export type AvailabilityStatus = "TERSEDIA" | "PREORDER" | "HABIS";

export const MAX_STOCK = 1_000_000;

export function normalizeStock(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d-]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(Math.round(n), 0), MAX_STOCK);
}

export function applyStockRule(stock: number | null, availability: AvailabilityStatus): AvailabilityStatus {
  if (stock === null) return availability;
  if (stock === 0) return "HABIS";
  if (availability === "HABIS") return "TERSEDIA";
  return availability;
}

import type { Locale } from "./i18n";

/** Label stok untuk etalase sesuai mode tampilan toko & bahasa (null = tidak menampilkan apa pun). */
export function stockLabel(
  stock: number | null | undefined,
  mode: "hidden" | "exact" | "limited" | undefined,
  lowThreshold = 3,
  locale: Locale = "id"
): string | null {
  if (stock === null || stock === undefined || stock <= 0 || !mode || mode === "hidden") return null;
  if (mode === "exact") return locale === "en" ? `${stock} left in stock` : `Sisa ${stock} unit`;
  return stock <= lowThreshold ? (locale === "en" ? "Low stock" : "Stok terbatas") : null;
}
