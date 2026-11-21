/**
 * Simulasi harga coret untuk data contoh (Starter Pack): harga normal ≈ +8–14%
 * dari harga jual, dibulatkan ke atas ke kelipatan yang wajar. Deterministik per indeks
 * supaya hasil seed selalu sama. Hanya ~separuh produk yang diberi harga coret,
 * agar etalase contoh tetap realistis (tidak semua produk "diskon").
 */
export function roundUpPrice(value: number): number {
  const step = value >= 5_000_000 ? 50_000 : value >= 1_000_000 ? 25_000 : value >= 100_000 ? 5_000 : 1_000;
  return Math.ceil(value / step) * step;
}

export function simulateStrikePrice(price: number | null, index: number): number | null {
  if (price === null || !Number.isFinite(price) || price <= 0) return null;
  if (index % 2 === 1) return null;
  const markup = [0.1, 0.08, 0.14, 0.12][(index / 2) % 4];
  const original = roundUpPrice(price * (1 + markup));
  return original > price ? original : null;
}
