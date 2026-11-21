import sharp, { type Metadata } from "sharp";

/**
 * RigSpace Image Optimizer
 * ------------------------
 * Semua gambar yang diunggah ke server melewati engine ini sebelum disimpan:
 *  1. Validasi isi file (magic bytes via libvips), bukan sekadar ekstensi/MIME dari browser.
 *  2. Batas ukuran input (MB) & piksel (anti "decompression bomb").
 *  3. Auto-rotate sesuai EXIF, lalu buang seluruh metadata (EXIF/GPS/ICC kamera).
 *  4. Resize: sisi terpanjang maksimal MAX_DIMENSION (default 1900px), tidak pernah diperbesar.
 *  5. Encode beberapa kandidat (WebP lossy / WebP lossless) lalu simpan yang PALING KECIL.
 *  SVG tidak di-rasterize, tetapi disanitasi (script, event handler, link javascript: dibuang).
 */

export const MAX_DIMENSION = 1900;
export const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_INPUT_PIXELS = 60_000_000; // ~ 7746 x 7746
const MAX_SVG_BYTES = 512 * 1024;

export type ImageProfile = "photo" | "logo";

export interface OptimizedImage {
  buffer: Buffer;
  /** Ekstensi file hasil, termasuk titik: ".webp" / ".svg" */
  ext: string;
  mime: string;
  width: number | null;
  height: number | null;
  originalBytes: number;
  bytes: number;
  /** Ringkasan untuk log/respons, mis. "4032x3024 jpeg 3.8MB -> 1900x1425 webp 214KB" */
  summary: string;
}

export class ImageValidationError extends Error {}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`);

function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 1024).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"));
}

/**
 * Sanitasi SVG: buang elemen & atribut yang bisa menjalankan kode.
 * SVG juga disajikan dengan header CSP sandbox (lihat route /uploads) sebagai lapisan kedua.
 */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "")
    .replace(/<(script|foreignObject|iframe|object|embed|audio|video|handler)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|foreignObject|iframe|object|embed|audio|video|handler)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')\s*(javascript|data:text\/html|vbscript):[^"']*\2/gi, "")
    .replace(/(href|xlink:href)\s*=\s*(javascript|vbscript):[^\s>]+/gi, "");
}

async function optimizeSvg(buffer: Buffer): Promise<OptimizedImage> {
  if (buffer.length > MAX_SVG_BYTES) {
    throw new ImageValidationError("File SVG terlalu besar (maksimal 512KB).");
  }
  const clean = sanitizeSvg(buffer.toString("utf8"));
  if (!/<svg[\s>]/i.test(clean)) {
    throw new ImageValidationError("File SVG tidak valid.");
  }
  const out = Buffer.from(clean.replace(/>\s+</g, "><").trim(), "utf8");
  return {
    buffer: out,
    ext: ".svg",
    mime: "image/svg+xml",
    width: null,
    height: null,
    originalBytes: buffer.length,
    bytes: out.length,
    summary: `svg ${kb(buffer.length)} -> sanitized ${kb(out.length)}`,
  };
}

/**
 * Optimasi satu gambar. Melempar ImageValidationError untuk input yang ditolak
 * (pesan aman ditampilkan ke user).
 */
export async function optimizeImage(
  input: Buffer,
  options: { profile?: ImageProfile; maxDimension?: number; trim?: boolean } = {}
): Promise<OptimizedImage> {
  const { profile = "photo", maxDimension = MAX_DIMENSION, trim = false } = options;

  if (input.length === 0) throw new ImageValidationError("File kosong.");
  if (input.length > MAX_INPUT_BYTES) {
    throw new ImageValidationError(`Ukuran file maksimal ${kb(MAX_INPUT_BYTES)}.`);
  }

  if (looksLikeSvg(input)) return optimizeSvg(input);

  // Baca header file yang sebenarnya (menolak file palsu, mis. .exe diganti .jpg)
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new ImageValidationError("File bukan gambar yang valid atau rusak.");
  }
  const allowed = ["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"];
  if (!meta.format || !allowed.includes(meta.format)) {
    throw new ImageValidationError("Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau HEIC.");
  }

  // Pipeline dasar: frame pertama saja (GIF animasi -> gambar diam), auto-rotate EXIF, metadata dibuang.
  let base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: false }).rotate();
  if (trim) {
    try {
      base = sharp(await base.trim({ threshold: 10 }).toBuffer());
    } catch {
      // trim gagal (mis. gambar polos) -> lanjut tanpa trim
    }
  }
  base = base.resize({
    width: maxDimension,
    height: maxDimension,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Render sekali ke raw supaya kandidat encode tidak memproses ulang dari awal
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const raw = () => sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  const hasAlpha = info.channels === 4 || info.channels === 2;

  const candidates: Promise<Buffer>[] = [
    // Kandidat 1: WebP lossy — terbaik untuk foto produk & banner
    raw()
      .webp({
        quality: profile === "logo" ? 90 : 80,
        alphaQuality: 100,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer(),
  ];
  if (profile === "logo" || hasAlpha || meta.format === "png" || meta.format === "gif") {
    // Kandidat 2: WebP lossless — sering jauh lebih kecil & tajam untuk logo/grafis warna datar
    candidates.push(raw().webp({ lossless: true, effort: 5 }).toBuffer());
  }

  const encoded = await Promise.all(candidates);
  const best = encoded.reduce((a, b) => (b.length < a.length ? b : a));

  const srcDim = meta.width && meta.height ? `${meta.width}x${meta.height}` : "?";
  return {
    buffer: best,
    ext: ".webp",
    mime: "image/webp",
    width: info.width,
    height: info.height,
    originalBytes: input.length,
    bytes: best.length,
    summary: `${srcDim} ${meta.format} ${kb(input.length)} -> ${info.width}x${info.height} webp ${kb(best.length)}`,
  };
}
