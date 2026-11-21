import assert from "node:assert/strict";
import { test } from "node:test";
import { backgroundMask, findFrameRect, foregroundStats, looksLikePoster } from "../src/lib/product-cutout";

type RGB = [number, number, number];

/** Gambar sintetis RGBA: isi dengan fungsi warna per piksel. */
function image(width: number, height: number, color: (x: number, y: number) => RGB) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [r, g, b] = color(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  return data;
}

const WHITE: RGB = [255, 255, 255];
const PEACH: RGB = [236, 200, 186];
const GREY: RGB = [90, 92, 95];
const inRect = (x: number, y: number, l: number, t: number, r: number, b: number) => x >= l && x <= r && y >= t && y <= b;

test("bingkai poster terdeteksi & dipotong ke area putih produk", () => {
  // Bingkai peach 10px, area putih 10..89, produk abu-abu di tengah
  const data = image(100, 100, (x, y) =>
    !inRect(x, y, 10, 10, 89, 89) ? PEACH : inRect(x, y, 35, 40, 65, 60) ? GREY : WHITE
  );
  const rect = findFrameRect(data, 100, 100, 4)!;
  assert.ok(rect, "bingkai harus terdeteksi");
  assert.ok(rect.left >= 10 && rect.left <= 14);
  assert.ok(rect.top >= 10 && rect.top <= 14);
  assert.ok(rect.left + rect.width <= 90 && rect.top + rect.height <= 90);
});

test("foto produk biasa berlatar putih tidak dianggap berbingkai", () => {
  const data = image(100, 100, (x, y) => (inRect(x, y, 30, 30, 70, 70) ? GREY : WHITE));
  assert.equal(findFrameRect(data, 100, 100, 4), null);
});

test("latar putih yang terhubung ke tepi dibuang, putih di dalam produk dipertahankan", () => {
  // Produk berupa cincin abu dengan "layar" putih di dalamnya (tidak terhubung ke tepi)
  const data = image(60, 60, (x, y) =>
    inRect(x, y, 15, 15, 45, 45) ? (inRect(x, y, 22, 22, 38, 38) ? WHITE : GREY) : WHITE
  );
  const { mask, backgroundRatio } = backgroundMask(data, 60, 60, 4);
  assert.equal(mask[0], 0, "pojok = latar");
  assert.equal(mask[30 * 60 + 30], 255, "putih di dalam produk tetap");
  assert.equal(mask[16 * 60 + 16], 255, "badan produk tetap");
  assert.ok(backgroundRatio > 0.6 && backgroundRatio < 0.8);
});

test("satu produk dominan = bukan poster; banyak potongan teks = poster", () => {
  const w = 200;
  const h = 200;
  const product = new Uint8Array(w * h);
  for (let y = 50; y < 150; y++) for (let x = 40; x < 160; x++) product[y * w + x] = 255;
  const productStats = foregroundStats(product, w, h);
  assert.equal(productStats.blobs, 1);
  assert.equal(looksLikePoster(productStats), false);

  // Poster: 30 "huruf" kecil terpisah + produk kecil
  const poster = new Uint8Array(w * h);
  for (let k = 0; k < 30; k++) {
    const ox = 10 + (k % 10) * 18;
    const oy = 10 + Math.floor(k / 10) * 20;
    for (let y = oy; y < oy + 8; y++) for (let x = ox; x < ox + 8; x++) poster[y * w + x] = 255;
  }
  for (let y = 120; y < 170; y++) for (let x = 60; x < 140; x++) poster[y * w + x] = 255;
  assert.equal(looksLikePoster(foregroundStats(poster, w, h)), true);
});
