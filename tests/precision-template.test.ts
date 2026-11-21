import assert from "node:assert/strict";
import { test } from "node:test";
import type { Banner, Product } from "../src/lib/types";
import {
  buildCategoryIndex,
  buildHeroSlides,
  buildPriceBoard,
  buildSideTiles,
  categoryIconKey,
  isGenericBrand,
  prettyCategoryName,
  rankProducts,
  shortName,
  shortRupiah,
} from "../src/components/storefront/templates/precision/model";
import { roundUpPrice, simulateStrikePrice } from "../src/lib/strike-price";

const product = (over: Partial<Product> = {}): Product => ({
  id: over.id || Math.random().toString(36).slice(2),
  slug: "p",
  code: "PBJ-0001",
  name: "Produk Uji",
  brand: "Asus",
  category: "laptop",
  condition: "baru" as Product["condition"],
  price: 10_000_000,
  originalPrice: null,
  availability: "tersedia",
  images: ["/uploads/products/a.webp"],
  summary: "",
  description: "",
  warranty: "",
  specs: [],
  variants: [],
  labels: [],
  needs: [],
  publishedAt: "2026-01-01",
  ...over,
});

test("toko kosong: semua builder aman & mengembalikan array kosong", () => {
  assert.deepEqual(buildHeroSlides([], [], (s) => s), []);
  assert.deepEqual(buildSideTiles([], [], [], new Set()), []);
  assert.deepEqual(buildCategoryIndex([], [{ name: "Laptop", value: "laptop" }]), []);
  assert.deepEqual(buildPriceBoard([]), []);
});

test("hero memakai banner CMS bila ada, harga coret palsu (≤ harga) dibuang", () => {
  const banner = {
    id: "b1",
    eyebrow: "PROMO",
    title: "Laptop Kerja",
    description: "",
    image: "/uploads/banners/b.webp",
    href: "/katalog",
    cta: "Lihat",
    placement: "hero",
    price: 9_000_000,
    originalPrice: 8_000_000,
  } as unknown as Banner;
  const slides = buildHeroSlides([banner], [product()], (s) => s);
  assert.equal(slides.length, 1);
  assert.equal(slides[0].id, "b1");
  assert.equal(slides[0].originalPrice, null);
});

test("hero otomatis dari produk terbaik bila belum ada banner (maks. 3, tanpa produk habis)", () => {
  const items = [
    product({ id: "a", labels: ["Pilihan Toko"] }),
    product({ id: "b", availability: "habis" }),
    product({ id: "c", price: null }),
    product({ id: "d", originalPrice: 12_000_000 }),
    product({ id: "e" }),
    product({ id: "f" }),
  ];
  const slides = buildHeroSlides([], items, (s) => s.toUpperCase());
  assert.deepEqual(slides.map((s) => s.id), ["auto-a", "auto-d", "auto-e"]);
  assert.equal(rankProducts(items).some((p) => p.id === "b" || p.id === "c"), false);
});

test("indeks kategori mengabaikan harga outlier untuk 'mulai dari'", () => {
  const items = [4_000, 6_000_000, 7_000_000, 8_000_000].map((price, i) => product({ id: String(i), price }));
  const [row] = buildCategoryIndex(items, [{ name: "Laptop", value: "laptop" }]);
  assert.equal(row.count, 4);
  assert.equal(row.minPrice, 6_000_000);
});

test("papan harga mendahulukan hemat terbesar", () => {
  const board = buildPriceBoard([
    product({ id: "x" }),
    product({ id: "small", originalPrice: 10_500_000 }),
    product({ id: "big", originalPrice: 13_000_000 }),
  ]);
  assert.deepEqual(board.map((p) => p.id), ["big", "small", "x"]);
});

test("format ringkas nama & rupiah", () => {
  assert.equal(shortName("ASUS Vivobook 14, Intel Core i5, 16GB"), "ASUS Vivobook 14");
  assert.equal(shortRupiah(4_900_000), "Rp 4,9 jt");
  assert.equal(shortRupiah(20_000), "Rp 20 rb");
});

test("simulasi harga coret Starter Pack: dibulatkan, selalu > harga, hanya separuh produk", () => {
  assert.equal(roundUpPrice(5_123_000), 5_150_000);
  const strike = simulateStrikePrice(7_499_000, 0)!;
  assert.ok(strike > 7_499_000 && strike % 25_000 === 0);
  assert.equal(simulateStrikePrice(7_499_000, 1), null);
  assert.equal(simulateStrikePrice(null, 0), null);
  assert.equal(simulateStrikePrice(0, 2), null);
});

test("nama kategori hasil impor dirapikan untuk tampilan", () => {
  assert.equal(prettyCategoryName("Printer And Fax"), "Printer & Fax");
  assert.equal(prettyCategoryName("Desktop & All In One PC"), "Desktop & All-in-One PC");
  assert.equal(prettyCategoryName("  Laptop  "), "Laptop");
});

test("ikon kategori dipilih dari nama, ikon tersimpan dipakai bila nama tak dikenali", () => {
  assert.equal(categoryIconKey("Printer And Fax"), "printer");
  assert.equal(categoryIconKey("Desktop & All In One PC"), "desktop");
  assert.equal(categoryIconKey("Aksesori"), "accessory");
  assert.equal(categoryIconKey("Tablet"), "tablet");
  assert.equal(categoryIconKey("Paket Spesial", "monitor"), "monitor");
  assert.equal(categoryIconKey("Paket Spesial", "tidak-ada"), "package");
});

test("merek keranjang (Lainnya/Other) tidak dianggap merek resmi", () => {
  assert.equal(isGenericBrand("Lainnya"), true);
  assert.equal(isGenericBrand("Lain-lain"), true);
  assert.equal(isGenericBrand("Other"), true);
  assert.equal(isGenericBrand("Lenovo"), false);
});
