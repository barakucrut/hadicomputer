/**
 * "Clean photo": rapikan foto produk katalog toko menjadi foto e-commerce bersih.
 *
 * 1. Bingkai poster (warna + logo toko + nama produk di luar kotak putih) dipotong (findFrameRect).
 * 2. Bila isi kotak berupa satu produk berlatar putih: tempelan kecil yang terpisah dari produk
 *    (logo toko, watermark, teks) diputihkan, lalu produk dipusatkan di kanvas putih persegi.
 * 3. Bila isinya poster brand (banyak teks/ikon): cukup bingkainya yang dibuang, tidak dipaksa.
 * Foto tanpa bingkai & tanpa tempelan dikembalikan apa adanya (changed=false).
 */
import sharp, { type Sharp } from "sharp";
import { backgroundMask, findFrameRect, foregroundStats, looksLikePoster, type Rect } from "./product-cutout";

/**
 * Bingkai berwarna polos (mis. peach + bayangan + logo/nama toko) di sekeliling kartu poster
 * yang isinya tidak putih. Warna bingkai = median piksel tepi. Dari tiap sisi ditembakkan "sinar"
 * yang berhenti di piksel non-bingkai pertama yang diikuti blok padat (tepi kartu) — teks tipis
 * & garis hiasan di bingkai dilewati. Tepi wajib lurus (mayoritas sinar berhenti di posisi sama),
 * sehingga produk di atas latar warna polos tidak ikut terpotong. Bayangan gelap seragam di tepi
 * kartu ikut dipangkas.
 */
export function findColorFrameRect(data: Uint8Array | Buffer, width: number, height: number, channels: number): Rect | null {
  const px = (x: number, y: number) => (y * width + x) * channels;
  const edge: [number, number, number][] = [];
  const sample = (x: number, y: number) => {
    const i = px(x, y);
    edge.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < width; x += 3) sample(x, 1), sample(x, height - 2);
  for (let y = 0; y < height; y += 3) sample(1, y), sample(width - 2, y);
  const med = [0, 1, 2].map((k) => edge.map((c) => c[k]).sort((a, b) => a - b)[edge.length >> 1]) as [number, number, number];
  // Bingkai putih/abu sangat terang ditangani findFrameRect / bukan bingkai
  if (Math.min(...med) >= 232 && Math.max(...med) - Math.min(...med) <= 14) return null;

  const TOL = 24;
  const near = (r: number, g: number, b: number, ref: number[], tol: number) =>
    (r - ref[0]) ** 2 + (g - ref[1]) ** 2 + (b - ref[2]) ** 2 <= tol * tol;
  const isFrame = (x: number, y: number) => {
    const i = px(x, y);
    return near(data[i], data[i + 1], data[i + 2], med, TOL);
  };
  if (edge.filter(([r, g, b]) => near(r, g, b, med, TOL)).length / edge.length < 0.7) return null;

  type Side = "left" | "right" | "top" | "bottom";
  const castRays = (side: Side): number | null => {
    const horizontal = side === "left" || side === "right";
    const span = horizontal ? height : width;
    const depth = horizontal ? width : height;
    const run = Math.max(8, Math.round(depth * 0.03));
    const at = (pos: number, t: number) => {
      const d = side === "left" || side === "top" ? t : depth - 1 - t;
      return horizontal ? isFrame(d, pos) : isFrame(pos, d);
    };
    const hits: number[] = [];
    const step = Math.max(2, Math.round(span / 120));
    let rays = 0;
    for (let pos = Math.round(span * 0.15); pos <= span * 0.85; pos += step) {
      rays++;
      for (let t = 0; t < depth * 0.45; t++) {
        if (at(pos, t)) continue;
        let solid = 0;
        for (let k = 0; k < run; k++) if (!at(pos, t + k)) solid++;
        if (solid >= run * 0.85) {
          hits.push(t);
          break;
        }
      }
    }
    if (hits.length < rays * 0.5) return null;
    hits.sort((a, b) => a - b);
    const median = hits[hits.length >> 1];
    const slack = Math.max(3, Math.round(depth * 0.01));
    if (hits.filter((h) => Math.abs(h - median) <= slack).length < rays * 0.6) return null;
    return median;
  };

  const l = castRays("left");
  const r = castRays("right");
  const t = castRays("top");
  const b = castRays("bottom");
  if (l === null || r === null || t === null || b === null) return null;
  let left = l;
  let right = width - 1 - r;
  let top = t;
  let bottom = height - 1 - b;
  if (right <= left || bottom <= top) return null;

  // Pangkas bayangan: strip tipis (<4%) seragam & lebih gelap dari bingkai di tepi kartu.
  // Strip yang terus berlanjut ke dalam = isi kartu (mis. poster berlatar gelap) -> tidak dipangkas.
  const luma = (c: number[]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const frameLuma = luma(med);
  const lineColor = (horizontal: boolean, at: number): number[] | null => {
    const from = horizontal ? left : top;
    const to = horizontal ? right : bottom;
    const cols: number[][] = [];
    for (let k = from; k <= to; k += 3) {
      const i = horizontal ? px(k, at) : px(at, k);
      cols.push([data[i], data[i + 1], data[i + 2]]);
    }
    const avg = [0, 1, 2].map((ch) => cols.reduce((sum, c) => sum + c[ch], 0) / cols.length);
    const uniform = cols.filter((c) => near(c[0], c[1], c[2], avg, 26)).length / cols.length >= 0.8;
    return uniform && !near(avg[0], avg[1], avg[2], med, TOL) && luma(avg) < frameLuma - 20 ? avg : null;
  };
  const stripDepth = (horizontal: boolean, start: number, dir: 1 | -1, max: number) => {
    const first = lineColor(horizontal, start);
    if (!first) return 0;
    for (let k = 1; k <= max; k++) {
      const c = lineColor(horizontal, start + dir * k);
      if (!c || !near(c[0], c[1], c[2], first, 26)) return k;
    }
    return 0; // berlanjut melewati batas -> isi kartu, bukan bayangan
  };
  const maxX = Math.round(width * 0.04);
  const maxY = Math.round(height * 0.04);
  right -= stripDepth(false, right, -1, maxX);
  left += stripDepth(false, left, 1, maxX);
  bottom -= stripDepth(true, bottom, -1, maxY);
  top += stripDepth(true, top, 1, maxY);
  if (right <= left || bottom <= top) return null;

  const rect = { left, top, width: right - left + 1, height: bottom - top + 1 };
  const area = (rect.width * rect.height) / (width * height);
  if (area < 0.3 || area > 0.95) return null;
  const inset = Math.max(2, Math.round(Math.min(rect.width, rect.height) * 0.006));
  return { left: rect.left + inset, top: rect.top + inset, width: rect.width - inset * 2, height: rect.height - inset * 2 };
}

export interface Component {
  area: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  pixels: number[];
}

/** Komponen terhubung (4-arah) dari mask (255 = foreground). */
export function components(mask: Uint8Array, width: number, height: number): Component[] {
  const seen = new Uint8Array(width * height);
  const out: Component[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const c: Component = { area: 0, left: width, top: height, right: 0, bottom: 0, pixels: [] };
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      const y = (p - x) / width;
      c.area++;
      c.pixels.push(p);
      if (x < c.left) c.left = x;
      if (x > c.right) c.right = x;
      if (y < c.top) c.top = y;
      if (y > c.bottom) c.bottom = y;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) (seen[p - 1] = 1), stack.push(p - 1);
      if (x < width - 1 && mask[p + 1] && !seen[p + 1]) (seen[p + 1] = 1), stack.push(p + 1);
      if (y > 0 && mask[p - width] && !seen[p - width]) (seen[p - width] = 1), stack.push(p - width);
      if (y < height - 1 && mask[p + width] && !seen[p + width]) (seen[p + width] = 1), stack.push(p + width);
    }
    out.push(c);
  }
  return out;
}

/**
 * Pisahkan produk dari tempelan: komponen terbesar = produk. Komponen lain ikut produk bila
 * cukup besar (≥15% produk, mis. bundling mouse/tas) atau menempel/di dalam kotak produk (+2%).
 */
export function splitProduct(parts: Component[], width: number, height: number) {
  if (!parts.length) return null;
  const main = parts.reduce((a, b) => (b.area > a.area ? b : a));
  const padX = Math.round(width * 0.02);
  const padY = Math.round(height * 0.02);
  const keep: Component[] = [];
  const drop: Component[] = [];
  for (const c of parts) {
    const touches =
      c.right >= main.left - padX && c.left <= main.right + padX && c.bottom >= main.top - padY && c.top <= main.bottom + padY;
    if (c === main || c.area >= main.area * 0.15 || touches) keep.push(c);
    else drop.push(c);
  }
  const box = {
    left: Math.min(...keep.map((c) => c.left)),
    top: Math.min(...keep.map((c) => c.top)),
    right: Math.max(...keep.map((c) => c.right)),
    bottom: Math.max(...keep.map((c) => c.bottom)),
  };
  return { keep, drop, box };
}

export interface CleanResult {
  buffer: Buffer;
  changed: boolean;
  kind: "unchanged" | "frame-removed" | "product-centered";
  removedParts: number;
}

const OUTPUT = 1200;
const MARGIN = 0.08;

async function squareOnWhite(input: Sharp, margin = MARGIN): Promise<Buffer> {
  const inner = Math.round(OUTPUT * (1 - margin * 2));
  const fitted = await input.resize({ width: inner, height: inner, fit: "inside", withoutEnlargement: false }).png().toBuffer();
  return sharp({ create: { width: OUTPUT, height: OUTPUT, channels: 3, background: "#ffffff" } })
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toBuffer();
}

export async function cleanProductPhoto(input: Buffer): Promise<CleanResult> {
  const base = sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let pixels: Buffer = data;
  let width = info.width;
  let height = info.height;
  const frame = findFrameRect(data, width, height, 4) || findColorFrameRect(data, width, height, 4);
  if (frame) {
    const cropped = await sharp(data, { raw: { width, height, channels: 4 } }).extract(frame).raw().toBuffer({ resolveWithObject: true });
    pixels = cropped.data;
    width = cropped.info.width;
    height = cropped.info.height;
  }
  const raw = () => sharp(pixels, { raw: { width, height, channels: 4 } });

  const posterResult = async (): Promise<CleanResult> =>
    frame
      ? { buffer: await squareOnWhite(raw().removeAlpha(), 0), changed: true, kind: "frame-removed", removedParts: 0 }
      : { buffer: input, changed: false, kind: "unchanged", removedParts: 0 };

  const { mask, backgroundRatio } = backgroundMask(pixels, width, height, 4);
  if (backgroundRatio < 0.12 || backgroundRatio > 0.96) return posterResult();

  // Pisahkan produk dari tempelan dulu (logo toko, watermark), baru nilai apakah sisanya poster
  const split = splitProduct(components(mask, width, height), width, height);
  if (!split) return posterResult();
  const keptMask = new Uint8Array(width * height);
  for (const c of split.keep) for (const p of c.pixels) keptMask[p] = 255;
  if (looksLikePoster(foregroundStats(keptMask, width, height))) return posterResult();

  // Putihkan tempelan (dilebarkan 2px supaya sisa anti-aliasing ikut hilang)
  for (const c of split.drop) {
    for (const p of c.pixels) {
      const x = p % width;
      const y = (p - x) / width;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const i = (ny * width + nx) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
        }
    }
  }
  if (!frame && split.drop.length === 0) return { buffer: input, changed: false, kind: "unchanged", removedParts: 0 };

  const { box } = split;
  const pad = 2;
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const region = {
    left,
    top,
    width: Math.min(width - left, box.right - box.left + 1 + pad * 2),
    height: Math.min(height - top, box.bottom - box.top + 1 + pad * 2),
  };
  const buffer = await squareOnWhite(raw().extract(region).removeAlpha());
  return { buffer, changed: true, kind: "product-centered", removedParts: split.drop.length };
}
