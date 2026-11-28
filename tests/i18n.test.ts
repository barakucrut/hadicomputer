import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLocaleFromAcceptLanguage, parseLocale, resolveLocale } from "../src/lib/i18n";
import { convertSamplePrice, formatCompactMoney, formatMoney, parseCurrency } from "../src/lib/i18n/currency";
import { getAvailabilityLabel, priceLabel, productMessage } from "../src/lib/catalog";
import { stockLabel } from "../src/lib/stock";

test("parseLocale mengenali variasi id dan en", () => {
  assert.equal(parseLocale("id"), "id");
  assert.equal(parseLocale("ID-id"), "id");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("en-US"), "en");
  assert.equal(parseLocale("fr"), null);
  assert.equal(parseLocale(""), null);
  assert.equal(parseLocale(null), null);
});

test("detectLocaleFromAcceptLanguage membedakan pengunjung Indonesia vs internasional", () => {
  assert.equal(detectLocaleFromAcceptLanguage("id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"), "id");
  assert.equal(detectLocaleFromAcceptLanguage("en-US,en;q=0.9,id;q=0.5"), "en");
  assert.equal(detectLocaleFromAcceptLanguage("en-SG,en;q=0.9"), "en");
  assert.equal(detectLocaleFromAcceptLanguage("de-DE,de;q=0.9"), "en");
  assert.equal(detectLocaleFromAcceptLanguage(""), "id");
  assert.equal(detectLocaleFromAcceptLanguage(null), "id");
});

test("resolveLocale mengikuti prioritas: query -> cookie -> Accept-Language -> fallback", () => {
  assert.equal(resolveLocale({ query: "en", cookie: "id", acceptLanguage: "id-ID" }), "en");
  assert.equal(resolveLocale({ query: "xx", cookie: "en", acceptLanguage: "id-ID" }), "en");
  assert.equal(resolveLocale({ query: null, cookie: null, acceptLanguage: "en-GB,en;q=0.9" }), "en");
  assert.equal(resolveLocale({ query: null, cookie: null, acceptLanguage: null }), "id");
  assert.equal(resolveLocale({ query: null, cookie: null, acceptLanguage: null, fallback: "en" }), "en");
});

test("currency: parseCurrency, formatMoney, formatCompactMoney, convertSamplePrice", () => {
  assert.equal(parseCurrency("usd"), "USD");
  assert.equal(parseCurrency("SGD"), "SGD");
  assert.equal(parseCurrency("JPY"), null);

  assert.match(formatMoney(15000000, "IDR"), /15\.000\.000/);
  assert.equal(formatMoney(1299, "USD", "en"), "$1,299");
  assert.match(formatMoney(1499, "SGD", "en"), /1,499/);
  assert.equal(formatCompactMoney(15500000, "IDR"), "Rp15,5jt");
  assert.equal(formatCompactMoney(1299, "USD"), "$1,299");
  assert.equal(formatCompactMoney(12500, "USD"), "$12.5k");

  assert.equal(convertSamplePrice(16000000, "USD"), 999);
  assert.equal(convertSamplePrice(15000000, "IDR"), 15000000);
  assert.equal(convertSamplePrice(null, "USD"), null);
});

test("storefront EN: stockLabel, priceLabel, availabilityLabel, dan pesan WhatsApp USD", () => {
  assert.equal(stockLabel(4, "exact", 3, "en"), "4 left in stock");
  assert.equal(stockLabel(2, "limited", 3, "en"), "Low stock");
  assert.equal(priceLabel(null, "USD", "en"), "Contact for price");
  assert.equal(priceLabel(999, "USD", "en"), "$999");
  assert.equal(getAvailabilityLabel("tersedia", "en"), "In Stock");
  assert.equal(getAvailabilityLabel("habis", "en"), "Out of Stock");

  const msg = productMessage(
    {
      id: "1",
      slug: "thinkpad-x1",
      code: "TP-01",
      name: "ThinkPad X1 Carbon",
      brand: "Lenovo",
      category: "Laptops",
      condition: "baru",
      price: 1299,
      originalPrice: 1499,
      availability: "tersedia",
      images: [],
      summary: "",
      description: "",
      warranty: "1 Year",
      specs: [],
      variants: [],
      labels: [],
      needs: [],
      publishedAt: "2026-01-01",
    },
    undefined,
    "https://demo.rigspace.id/produk/thinkpad-x1",
    "Rig Store",
    { currency: "USD", locale: "en" },
  );
  assert.match(msg, /^Hi Rig Store/);
  assert.match(msg, /\$1,299/);
  assert.match(msg, /Save \$200/);
});
