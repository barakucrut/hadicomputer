import assert from "node:assert/strict";
import { test } from "node:test";
import { getProducts } from "../src/lib/repository";
import {
  effectiveOffer,
  productMessage,
  queryCatalog,
} from "../src/lib/catalog";
import { existsSync } from "node:fs";
import { join } from "node:path";

const products = getProducts();
test("catalog combines search, category, brand and condition filters", () => {
  const result = queryCatalog(products, {
    q: "XPS",
    kategori: "laptop",
    merek: "Dell",
    kondisi: "bekas",
  });
  assert.equal(result.total, 1);
  assert.equal(result.products[0].code, "HC-0003");
});
test("unknown search yields an empty catalog", () =>
  assert.equal(queryCatalog(products, { q: "tidak-ada-produk-ini" }).total, 0));
test("contact-price products appear last for either price sort direction", () => {
  for (const urut of ["harga-naik", "harga-turun"]) {
    const result = queryCatalog(products, { urut }, 100).products;
    const firstContact = result.findIndex(
      (p) => effectiveOffer(p).price === null,
    );
    assert.ok(firstContact > 0);
    assert.ok(
      result.slice(firstContact).every((p) => effectiveOffer(p).price === null),
    );
    const prices = result
      .slice(0, firstContact)
      .map((p) => effectiveOffer(p).price!);
    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => (urut === "harga-naik" ? a - b : b - a)),
    );
  }
});
test("price range excludes contact-price products and applies both bounds", () => {
  const result = queryCatalog(products, { min: "6000000", max: "10000000" });
  assert.ok(result.total > 0);
  assert.ok(
    result.products.every((p) => {
      const price = effectiveOffer(p).price;
      return price !== null && price >= 6000000 && price <= 10000000;
    }),
  );
});
test("invalid and out-of-range page numbers are clamped", () => {
  assert.equal(queryCatalog(products, { page: "-2" }).page, 1);
  assert.equal(queryCatalog(products, { page: "nope" }).page, 1);
  assert.equal(
    queryCatalog(products, { page: "999" }).page,
    Math.ceil(products.length / 12),
  );
  assert.equal(
    queryCatalog(products, { page: "2" }).products.length,
    Math.min(12, products.length - 12),
  );
});
test("availability, collection and needs filters combine", () => {
  const result = queryCatalog(products, {
    status: "tersedia",
    koleksi: "Terlaris",
    kebutuhan: "kerja",
  });
  assert.ok(result.total > 0);
  assert.ok(
    result.products.every(
      (p) =>
        effectiveOffer(p).availability === "tersedia" &&
        p.labels.includes("Terlaris") &&
        p.needs.includes("kerja"),
    ),
  );
});
test("selected variant controls price, availability and WhatsApp context", () => {
  const product = products[0],
    variant = product.variants[1];
  assert.deepEqual(effectiveOffer(product, variant), {
    price: 21999000,
    availability: "preorder",
  });
  const message = productMessage(
    product,
    variant,
    "https://example.test/produk/laptop",
  );
  for (const text of [
    product.name,
    product.code,
    variant.name,
    "21.999.000",
    "https://example.test/produk/laptop",
  ])
    assert.ok(message.includes(text));
  const unavailable = product.variants[2];
  assert.equal(effectiveOffer(product, unavailable).availability, "habis");
  assert.ok(
    productMessage(product, unavailable, "url").includes("Hubungi untuk harga"),
  );
});
test("products without variants produce a clean message", () => {
  const product = products.find((p) => !p.variants.length)!;
  const message = productMessage(product, undefined, "https://example.test");
  assert.ok(message.includes(product.code));
  assert.ok(!message.includes("Varian:"));
});
test("all product slugs are unique and all gallery assets exist", () => {
  assert.equal(new Set(products.map((p) => p.slug)).size, products.length);
  for (const product of products)
    for (const image of product.images)
      assert.ok(existsSync(join(process.cwd(), "public", image)), image);
});
