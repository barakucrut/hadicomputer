import assert from "node:assert/strict";
import { test } from "node:test";
import { components, findColorFrameRect, splitProduct } from "../src/lib/product-photo-clean";

type RGB = [number, number, number];
const inRect = (x: number, y: number, l: number, t: number, r: number, b: number) => x >= l && x <= r && y >= t && y <= b;

function image(width: number, height: number, color: (x: number, y: number) => RGB) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      [data[i], data[i + 1], data[i + 2]] = color(x, y);
      data[i + 3] = 255;
    }
  return data;
}

const PEACH: RGB = [239, 204, 191];
const SHADOW: RGB = [190, 147, 114];
const PURPLE: RGB = [90, 60, 200];
const INK: RGB = [20, 20, 20];

test("bingkai warna + bayangan + teks nama di bingkai: kartu poster ditemukan, bayangan ikut dipangkas", () => {
  // Kartu ungu 20..169, bayangan cokelat 170..175 (kanan & bawah), teks hitam tipis di bawah kartu
  const data = image(200, 200, (x, y) => {
    if (inRect(x, y, 20, 20, 169, 169)) return PURPLE;
    if (inRect(x, y, 20, 20, 175, 175)) return SHADOW;
    if (inRect(x, y, 20, 185, 120, 188)) return INK;
    return PEACH;
  });
  const rect = findColorFrameRect(data, 200, 200, 4)!;
  assert.ok(rect, "kartu harus terdeteksi");
  assert.ok(rect.left >= 20 && rect.left <= 24, `left ${rect.left}`);
  assert.ok(rect.top >= 20 && rect.top <= 24, `top ${rect.top}`);
  assert.ok(rect.left + rect.width <= 170, "bayangan kanan tidak ikut");
  assert.ok(rect.top + rect.height <= 170, "bayangan bawah tidak ikut");
});

test("produk di atas latar warna polos (tanpa kartu persegi) tidak dianggap berbingkai", () => {
  // Lingkaran produk di latar peach: tepinya tidak lurus
  const data = image(200, 200, (x, y) => ((x - 100) ** 2 + (y - 100) ** 2 < 60 ** 2 ? INK : PEACH));
  assert.equal(findColorFrameRect(data, 200, 200, 4), null);
});

test("foto berlatar putih tidak diproses detektor bingkai warna", () => {
  const data = image(100, 100, (x, y) => (inRect(x, y, 30, 30, 70, 70) ? INK : [255, 255, 255]));
  assert.equal(findColorFrameRect(data, 100, 100, 4), null);
});

test("logo toko yang terpisah jauh dari produk dibuang, aksesori besar tetap ikut", () => {
  const w = 200;
  const h = 200;
  const mask = new Uint8Array(w * h);
  const fill = (l: number, t: number, r: number, b: number) => {
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) mask[y * w + x] = 255;
  };
  fill(20, 20, 120, 120); // produk utama
  fill(130, 40, 175, 85); // aksesori besar (≥15% produk) -> tetap
  fill(150, 175, 170, 182); // logo kecil di pojok -> dibuang
  const split = splitProduct(components(mask, w, h), w, h)!;
  assert.equal(split.keep.length, 2);
  assert.equal(split.drop.length, 1);
  assert.deepEqual(split.box, { left: 20, top: 20, right: 175, bottom: 120 });
});
