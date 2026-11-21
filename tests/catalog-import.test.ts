import assert from "node:assert/strict";
import { test } from "node:test";
import { matchColumn } from "../src/lib/catalog-import/columns";
import {
  normalizeRecord,
  parseAvailability,
  parseCondition,
  parseCsv,
  parseImages,
  parsePrice,
  parseSpecs,
  sanitizeRow,
} from "../src/lib/catalog-import/parse";
import { sanitizeSvg } from "../src/lib/image-optimizer";

test("parsePrice memahami format harga Indonesia & internasional", () => {
  assert.equal(parsePrice("Rp 12.500.000"), 12_500_000);
  assert.equal(parsePrice("12.500.000,00"), 12_500_000);
  assert.equal(parsePrice("12,500,000.00"), 12_500_000);
  assert.equal(parsePrice("Rp12,500,000.00"), 12_500_000);
  assert.equal(parsePrice(9499000), 9_499_000);
  assert.equal(parsePrice("12.5jt"), 12_500_000);
  assert.equal(parsePrice("750rb"), 750_000);
  assert.equal(parsePrice(""), null);
  assert.equal(parsePrice("Hubungi kami"), null);
  assert.equal(parsePrice("-"), null);
  assert.equal(parsePrice(0), null);
});

test("kondisi, ketersediaan dan judul kolom dikenali secara longgar", () => {
  assert.equal(parseCondition("Second / Bekas"), "BEKAS");
  assert.equal(parseCondition(""), "BARU");
  assert.equal(parseAvailability("Out of stock"), "HABIS");
  assert.equal(parseAvailability("Inden 2 minggu"), "PREORDER");
  assert.equal(parseAvailability("Ready"), "TERSEDIA");
  assert.equal(matchColumn("Nama Produk*"), "name");
  assert.equal(matchColumn("  PRICE "), "basePrice");
  assert.equal(matchColumn("Merk"), "brand");
  assert.equal(matchColumn("kolom asing"), null);
});

test("parseCsv mendukung pemisah titik koma, kutip, dan baris baru di dalam sel", () => {
  const rows = parseCsv('﻿Nama Produk;Harga;Deskripsi\n"Laptop ""Pro"" 14";"12.500.000";"baris 1\nbaris 2"\n');
  assert.deepEqual(rows[0], ["Nama Produk", "Harga", "Deskripsi"]);
  assert.deepEqual(rows[1], ['Laptop "Pro" 14', "12.500.000", "baris 1\nbaris 2"]);
});

test("spesifikasi, foto dan label diurai dari satu sel", () => {
  assert.deepEqual(parseSpecs("CPU: Core i5 | RAM: 16GB\nSSD: 512GB"), [
    { key: "CPU", value: "Core i5" },
    { key: "RAM", value: "16GB" },
    { key: "SSD", value: "512GB" },
  ]);
  assert.deepEqual(parseImages("https://a.com/1.jpg | https://a.com/2.jpg https://a.com/1.jpg ftp://x"), [
    "https://a.com/1.jpg",
    "https://a.com/2.jpg",
  ]);
  const row = normalizeRecord({ rowNumber: 2, values: { name: "X", labels: "Promo, terlaris", code: " hc-0001 " } });
  assert.equal(row.isPromo, true);
  assert.equal(row.isBestSeller, true);
  assert.equal(row.isFeatured, false);
  assert.equal(row.code, "HC-0001");
});

test("sanitizeRow tidak mempercayai tipe dari klien", () => {
  const row = sanitizeRow({ name: "<b>X</b>", basePrice: "999", condition: "HACK", images: ["javascript:alert(1)", "https://ok.com/a.jpg"] });
  assert.ok(row);
  assert.equal(row!.basePrice, null);
  assert.equal(row!.condition, "BARU");
  assert.deepEqual(row!.images, ["https://ok.com/a.jpg"]);
  assert.equal(sanitizeRow(null), null);
});

test("sanitizeSvg membuang script, event handler dan link javascript:", () => {
  const out = sanitizeSvg(
    '<svg onload="x()"><script>alert(1)</script><a href="javascript:alert(2)"><rect/></a><foreignObject><div/></foreignObject></svg>'
  );
  assert.ok(!/script|onload|javascript:|foreignObject/i.test(out));
  assert.ok(out.includes("<rect/>"));
});

test("importer WooCommerce: bersihkan nama, deteksi merek & ekstrak spek dari judul", async () => {
  const { cleanName, detectBrand, extractSpecs, htmlToText } = await import("../src/lib/catalog-import/woocommerce");
  assert.equal(cleanName("MOUSE ROBOT M205 WIRELESS , Mouse Wireless 1600DPI | BITCOM PLAZA", "BITCOM PLAZA"), "MOUSE ROBOT M205 WIRELESS , Mouse Wireless 1600DPI");
  assert.equal(cleanName("External Hard Disk Seagate 2TB &#8211; BLACK | BITCOM", "BITCOM PLAZA"), "External Hard Disk Seagate 2TB – BLACK");
  assert.equal(detectBrand("LENOVO LOQ Essential 15IRX11 – 3DID"), "Lenovo");
  assert.equal(detectBrand("Printer CANON PIXMA G4770 Ink Tank"), "Canon");
  assert.equal(detectBrand("ROG Strix G16"), "Asus");
  assert.equal(detectBrand("Kabel Power 3 Lubang"), "Lainnya");
  const specs = extractSpecs("LENOVO LOQ Essential 15IRX11 – 3DID, Intel Ci5-13450HX/16G DDR5/512G SSD/RTX 3050/15.6\" FHD/W11+OHS");
  const get = (k: string) => specs.find((s) => s.key === k)?.value;
  assert.equal(get("Prosesor"), "Intel Ci5-13450HX");
  assert.equal(get("RAM"), "16GB DDR5");
  assert.equal(get("Penyimpanan"), "512GB SSD");
  assert.equal(get("Grafis"), "RTX 3050");
  assert.equal(get("Layar"), "15.6 inci");
  assert.equal(get("Sistem Operasi"), "Windows 11 + Office Home & Student");
  assert.equal(extractSpecs("ASUS VIVOBOOK 14 A1404VAP, Intel Core 7-150U/16G/1T SSD").find((s) => s.key === "Penyimpanan")?.value, "1TB SSD");
  assert.equal(htmlToText("<p>Halo&nbsp;dunia</p><ul><li>A</li><li>B</li></ul>"), "Halo dunia\n• A\n• B");
});

test("importer WooCommerce: varian akhiran nama toko & lini produk tanpa merek", async () => {
  const { cleanName, detectBrand } = await import("../src/lib/catalog-import/woocommerce");
  assert.equal(cleanName("KABEL VGA MALE TO MALE 1,5M HIGH QUALITY | PLAZA BITCOM", "BITCOM PLAZA"), "KABEL VGA MALE TO MALE 1,5M HIGH QUALITY");
  assert.equal(cleanName("BATTERY UPS YUASA 12V, 7.0Ah | BITCOM PLAZA JEMBER", "BITCOM PLAZA"), "BATTERY UPS YUASA 12V, 7.0Ah");
  assert.equal(cleanName("Speaker GAMEN GS2 Gaming 6W USB BITCOM", "BITCOM PLAZA"), "Speaker GAMEN GS2 Gaming 6W USB");
  assert.equal(cleanName("Motorola Motopad 60 Lite – Tablet Android – 4GB/128GB", "BITCOM PLAZA"), "Motorola Motopad 60 Lite – Tablet Android – 4GB/128GB");
  assert.equal(detectBrand("VIVOBOOK GO 14 E1404FA, RYZEN 5"), "Asus");
  assert.equal(detectBrand("Aspire Lite 14 AL14-42P"), "Acer");
  assert.equal(detectBrand("PRINTER DESKJET INK ADVANTAGE 2989"), "HP");
  assert.equal(detectBrand("TPLINK TL-WN823N 300Mbps"), "TP-Link");
  assert.equal(detectBrand("FAN LAPTOP VENTUZ TWISTER"), "Ventuz");
});

test("aturan stok: 0 = Habis, restock = Tersedia, label sesuai mode toko", async () => {
  const { applyStockRule, normalizeStock, stockLabel } = await import("../src/lib/stock");
  assert.equal(applyStockRule(0, "TERSEDIA"), "HABIS");
  assert.equal(applyStockRule(5, "HABIS"), "TERSEDIA");
  assert.equal(applyStockRule(5, "PREORDER"), "PREORDER");
  assert.equal(applyStockRule(null, "HABIS"), "HABIS");
  assert.equal(normalizeStock(""), null);
  assert.equal(normalizeStock("12 unit"), 12);
  assert.equal(normalizeStock(-4), 0);
  assert.equal(stockLabel(4, "exact"), "Sisa 4 unit");
  assert.equal(stockLabel(2, "limited", 3), "Stok terbatas");
  assert.equal(stockLabel(10, "limited", 3), null);
  assert.equal(stockLabel(4, "hidden"), null);
  assert.equal(stockLabel(null, "exact"), null);
});

test("validasi pengaturan SEO & analitik menolak input berbahaya", async () => {
  const { normalizeGaId, normalizeGtmId, normalizeSiteVerification, normalizeSkuPrefix, SettingsValidationError } = await import("../src/lib/store-seo");
  assert.equal(normalizeGaId(" g-ab12cd34ef "), "G-AB12CD34EF");
  assert.equal(normalizeGaId(""), null);
  assert.throws(() => normalizeGaId("G-123');alert(1);//"), SettingsValidationError);
  assert.equal(normalizeGtmId("gtm-5abc12"), "GTM-5ABC12");
  assert.throws(() => normalizeGtmId("<script>"), SettingsValidationError);
  assert.equal(normalizeSiteVerification('<meta name="google-site-verification" content="AbC_123-xyzTOKEN" />'), "AbC_123-xyzTOKEN");
  assert.throws(() => normalizeSiteVerification('"><script>alert(1)</script>'), SettingsValidationError);
  assert.equal(normalizeSkuPrefix("bp-"), "BP");
  assert.throws(() => normalizeSkuPrefix("B P"), SettingsValidationError);
});
