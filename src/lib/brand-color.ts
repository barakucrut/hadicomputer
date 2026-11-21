/**
 * Warna teks yang terbaca di atas warna aksen toko (bg-brand).
 * Merchant bebas memilih warna; aksen terang (kuning, hijau muda) butuh teks gelap.
 * Murni & deterministik supaya bisa dites.
 */
const DARK_INK = "#0b0d0c";
const LIGHT_INK = "#ffffff";

function channel(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminans relatif WCAG dari hex #rgb / #rrggbb; null bila format tidak valid. */
export function relativeLuminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Pilih teks putih atau hitam, mana yang kontrasnya lebih tinggi di atas aksen. */
export function brandInk(hex: string | null | undefined): string {
  const lum = relativeLuminance(hex || "");
  if (lum === null) return LIGHT_INK;
  const darkLum = relativeLuminance(DARK_INK)!;
  return contrast(lum, 1) >= contrast(lum, darkLum) ? LIGHT_INK : DARK_INK;
}

export const DEFAULT_PRIMARY = "#dd2028";
/** Warna sekunder = permukaan gelap template (topbar info, footer). Bawaan hampir hitam. */
export const DEFAULT_SECONDARY = "#111413";

/** Hex #rrggbb yang aman dipakai di CSS; selain itu kembali ke fallback (mencegah injeksi CSS). */
export function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : fallback;
}

/**
 * Variabel CSS warna toko untuk <html style>. Teks & ikon di atas tiap warna dihitung otomatis
 * (bukan pilihan merchant) supaya kombinasi apa pun tetap terbaca.
 */
export function brandCssVars(primary: unknown, secondary: unknown): Record<string, string> {
  const p = safeHex(primary, DEFAULT_PRIMARY);
  const s = safeHex(secondary, DEFAULT_SECONDARY);
  const sInk = brandInk(s);
  return {
    "--red": p,
    "--red-dark": p,
    "--border-focus": p,
    "--ring": `${p}33`,
    "--brand-ink": brandInk(p),
    "--brand-2": s,
    "--brand-2-ink": sInk,
    // Aksen kecil (label/ikon) di permukaan sekunder: krem di latar gelap, ikut teks di latar terang
    "--brand-2-accent": sInk === LIGHT_INK ? "#f6e3a1" : sInk,
  };
}
