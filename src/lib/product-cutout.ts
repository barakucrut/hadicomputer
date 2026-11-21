/**
 * "Studio cutout": ubah foto produk menjadi gambar produk berlatar transparan
 * untuk Studio Banner (panggung gelap di hero storefront).
 *
 * 1. Foto poster (bingkai warna + logo + teks, mis. foto katalog toko) dideteksi
 *    dan dipotong ke area putih tempat produk berada.
 * 2. Latar putih yang terhubung ke tepi gambar dibuat transparan (flood fill),
 *    tepinya dihaluskan, lalu area kosong dipangkas.
 * Foto berlatar ramai (bukan putih polos) tidak dipaksa: hasilnya `ok: false`.
 *
 * Fungsi piksel di sini murni (tanpa I/O) sehingga bisa dites.
 */
import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";
import { storeImage } from "./image-storage";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Piksel "putih latar": terang & hampir tanpa warna. */
export function isWhite(data: Uint8Array | Buffer, i: number, channels: number, min = 232): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (channels === 4 && data[i + 3] < 20) return true; // sudah transparan
  const lo = Math.min(r, g, b);
  const hi = Math.max(r, g, b);
  return lo >= min && hi - lo <= 14;
}

/**
 * Cari area putih di dalam bingkai poster. Mengembalikan null bila gambar tidak berbingkai
 * (tepi gambar sudah dominan putih) atau bingkai tidak terdeteksi dengan yakin.
 */
export function findFrameRect(data: Uint8Array | Buffer, width: number, height: number, channels: number): Rect | null {
  const white = (x: number, y: number) => isWhite(data, (y * width + x) * channels, channels);

  // Tepi luar (3%) dominan putih -> foto biasa, tidak perlu dipotong
  const band = Math.max(2, Math.round(Math.min(width, height) * 0.03));
  let edgeWhite = 0;
  let edgeTotal = 0;
  for (let x = 0; x < width; x += 2) {
    for (const y of [Math.floor(band / 2), height - 1 - Math.floor(band / 2)]) {
      edgeTotal++;
      if (white(x, y)) edgeWhite++;
    }
  }
  for (let y = 0; y < height; y += 2) {
    for (const x of [Math.floor(band / 2), width - 1 - Math.floor(band / 2)]) {
      edgeTotal++;
      if (white(x, y)) edgeWhite++;
    }
  }
  if (edgeWhite / edgeTotal > 0.35) return null;

  // Profil putih per kolom & baris: kolom/baris di dalam area produk punya banyak piksel putih
  const colWhite = new Array<number>(width).fill(0);
  const rowWhite = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (white(x, y)) {
        colWhite[x]++;
        rowWhite[y]++;
      }
    }
  }
  const colMin = height * 0.3;
  const rowMin = width * 0.3;
  const first = (arr: number[], min: number) => arr.findIndex((v) => v >= min);
  const last = (arr: number[], min: number) => {
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] >= min) return i;
    return -1;
  };
  const left = first(colWhite, colMin);
  const right = last(colWhite, colMin);
  const top = first(rowWhite, rowMin);
  const bottom = last(rowWhite, rowMin);
  if (left < 0 || top < 0 || right <= left || bottom <= top) return null;

  const rect = { left, top, width: right - left + 1, height: bottom - top + 1 };
  const area = (rect.width * rect.height) / (width * height);
  // Area produk wajar: 30–95% gambar
  if (area < 0.3 || area > 0.95) return null;
  // Rapatkan sedikit ke dalam supaya garis bingkai tidak ikut
  const inset = Math.max(2, Math.round(Math.min(rect.width, rect.height) * 0.006));
  return { left: rect.left + inset, top: rect.top + inset, width: rect.width - inset * 2, height: rect.height - inset * 2 };
}

/**
 * Mask latar: flood fill dari seluruh tepi melalui piksel putih.
 * Mengembalikan mask 1 kanal (0 = latar/transparan, 255 = produk) & rasio latar.
 */
export function backgroundMask(data: Uint8Array | Buffer, width: number, height: number, channels: number) {
  const mask = new Uint8Array(width * height).fill(255);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * width + x;
    if (mask[p] === 0) return;
    if (!isWhite(data, p * channels, channels, 226)) return;
    mask[p] = 0;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  let bg = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] === 0) bg++;
  return { mask, backgroundRatio: bg / mask.length };
}

/**
 * Statistik "pulau" foreground pada mask yang diperkecil:
 * - blobs: jumlah pulau berarti (≥0,02% area)
 * - largestShare: porsi pulau terbesar terhadap seluruh foreground
 * Foto produk = satu bentuk dominan (largestShare tinggi). Poster promo = banyak teks/ikon terpisah.
 */
export function foregroundStats(mask: Uint8Array, width: number, height: number): { blobs: number; largestShare: number } {
  const step = Math.max(1, Math.round(Math.max(width, height) / 240));
  const w = Math.ceil(width / step);
  const h = Math.ceil(height / step);
  const small = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) small[y * w + x] = mask[Math.min(height - 1, y * step) * width + Math.min(width - 1, x * step)] > 0 ? 1 : 0;
  const seen = new Uint8Array(w * h);
  const minArea = Math.max(2, w * h * 0.0002);
  let blobs = 0;
  let largest = 0;
  let total = 0;
  const stack: number[] = [];
  for (let start = 0; start < small.length; start++) {
    if (!small[start] || seen[start]) continue;
    let area = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop()!;
      area++;
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0 && small[p - 1] && !seen[p - 1]) (seen[p - 1] = 1), stack.push(p - 1);
      if (x < w - 1 && small[p + 1] && !seen[p + 1]) (seen[p + 1] = 1), stack.push(p + 1);
      if (y > 0 && small[p - w] && !seen[p - w]) (seen[p - w] = 1), stack.push(p - w);
      if (y < h - 1 && small[p + w] && !seen[p + w]) (seen[p + w] = 1), stack.push(p + w);
    }
    total += area;
    if (area >= minArea) blobs++;
    if (area > largest) largest = area;
  }
  return { blobs, largestShare: total ? largest / total : 0 };
}

/** Poster promo / kolase: terlalu banyak bagian terpisah, atau tidak ada satu bentuk dominan. */
export function looksLikePoster(stats: { blobs: number; largestShare: number }): boolean {
  return stats.largestShare < 0.9 || stats.blobs > 12;
}

export interface CutoutResult {
  /** PNG berlatar transparan (atau PNG terpotong tanpa transparansi bila ok=false) */
  buffer: Buffer;
  /** true = latar berhasil dibuang; false = latar tidak polos, tampil sebagai kartu */
  ok: boolean;
  framed: boolean;
  /** Alasan bila ok=false */
  reason?: "busy-background" | "poster" | "unsupported-source";
}

/** Proses buffer gambar menjadi cutout produk. */
export async function createCutout(input: Buffer): Promise<CutoutResult> {
  const base = sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true });
  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let pixels: Buffer = data;
  let width = info.width;
  let height = info.height;
  const frame = findFrameRect(data, width, height, 4);
  if (frame) {
    const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
      .extract(frame)
      .raw()
      .toBuffer({ resolveWithObject: true });
    pixels = cropped.data;
    width = cropped.info.width;
    height = cropped.info.height;
  }

  const { mask, backgroundRatio } = backgroundMask(pixels, width, height, 4);
  // Latar tidak polos (<12% terbuang) atau produk hilang (>96%) -> jangan dipaksa
  if (backgroundRatio < 0.12 || backgroundRatio > 0.96) {
    const buffer = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return { buffer, ok: false, framed: Boolean(frame), reason: "busy-background" };
  }
  const stats = foregroundStats(mask, width, height);
  if (process.env.CUTOUT_DEBUG) console.log("cutout stats", stats);
  if (looksLikePoster(stats)) {
    const buffer = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return { buffer, ok: false, framed: Boolean(frame), reason: "poster" };
  }

  // Haluskan tepi mask supaya tidak bergerigi di atas latar gelap
  const softMask = await sharp(Buffer.from(mask), { raw: { width, height, channels: 1 } }).blur(0.9).extractChannel(0).raw().toBuffer();
  for (let p = 0; p < width * height; p++) {
    pixels[p * 4 + 3] = Math.min(pixels[p * 4 + 3], softMask[p]);
  }
  const buffer = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 1 })
    .extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return { buffer, ok: true, framed: Boolean(frame) };
}

export const CUTOUT_REJECT_MESSAGE: Record<NonNullable<CutoutResult["reason"]>, string> = {
  poster: "Foto produk ini berupa poster promo (banyak teks/ikon), tidak cocok untuk Studio Banner. Pilih produk lain atau unggah foto produk berlatar putih.",
  "unsupported-source": "Foto produk ini bukan file unggahan toko, sehingga tidak bisa diproses. Unggah ulang foto produknya terlebih dahulu.",
  "busy-background": "Latar foto produk ini tidak polos, sehingga produk tidak bisa dipisahkan. Pilih produk lain atau unggah foto produk berlatar putih.",
};

/**
 * Buat cutout dari foto produk lokal (/uploads/...) dan simpan ke folder banners (hanya bila berhasil).
 * Hanya menerima path lokal di public/uploads atau public/images/products (tidak mengambil URL eksternal).
 */
export async function createCutoutFromUpload(
  imageUrl: string,
  name: string
): Promise<{ ok: true; url: string } | { ok: false; reason: NonNullable<CutoutResult["reason"]> }> {
  // Hanya file lokal: unggahan toko atau aset bawaan (tanpa "..", tanpa URL eksternal)
  if (!/^\/(uploads\/[a-z]+|images\/products)\/[A-Za-z0-9._-]+$/.test(imageUrl) || imageUrl.includes("..")) {
    return { ok: false, reason: "unsupported-source" };
  }
  const filePath = path.join(process.cwd(), "public", imageUrl);
  const result = await createCutout(await readFile(filePath));
  if (!result.ok) return { ok: false, reason: result.reason || "busy-background" };
  const { url } = await storeImage(result.buffer, { folder: "banners", fileName: `studio-${name}` });
  return { ok: true, url };
}
