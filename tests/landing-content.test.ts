import assert from "node:assert/strict";
import { test } from "node:test";
import { getLandingContent, previewSlug, PLANS } from "../src/components/platform/landing/content";
import { parseDemoRequest, salesWhatsappUrl } from "../src/lib/demo-request";

test("landing: slug pratinjau dari nama toko", () => {
  assert.equal(previewSlug("Rig Computer"), "rigcomputer");
  assert.equal(previewSlug("Toko Jaya Abadi!! 99"), "tokojayaabadi99");
  assert.equal(previewSlug("Café Komputer"), "cafekomputer");
  assert.equal(previewSlug("   "), "namatoko");
  assert.equal(previewSlug("<script>"), "script");
  assert.ok(PLANS.find((p) => p.highlight)?.id === "pro");
});

test("form minta demo: validasi, honeypot, link toko", () => {
  const ok = parseDemoRequest({ storeName: " Rig  Computer ", city: "Jember", whatsapp: "0812-3456-7890", storeLink: "tokopedia.com/rig" });
  assert.ok(ok.ok);
  assert.deepEqual(ok.ok && ok.data, { storeName: "Rig Computer", city: "Jember", whatsapp: "6281234567890", storeLink: "https://tokopedia.com/rig" });
  assert.equal(parseDemoRequest({ storeName: "R", city: "Jember", whatsapp: "081234567890" }).ok, false);
  assert.equal(parseDemoRequest({ storeName: "Rig", city: "", whatsapp: "081234567890" }).ok, false);
  assert.equal(parseDemoRequest({ storeName: "Rig", city: "Jember", whatsapp: "12345" }).ok, false);
  assert.equal(parseDemoRequest({ storeName: "Rig", city: "Jember", whatsapp: "081234567890", storeLink: "javascript:alert(1)" }).ok, false);
  const spam = parseDemoRequest({ storeName: "Rig", city: "Jember", whatsapp: "081234567890", website: "http://spam" });
  assert.ok(!spam.ok && spam.spam);
  const xss = parseDemoRequest({ storeName: "<b>Rig</b>", city: "Jember", whatsapp: "081234567890" });
  assert.ok(xss.ok && !xss.data.storeName.includes("<"));
  assert.match(salesWhatsappUrl("6281234567890", "Rig Computer"), /^https:\/\/wa\.me\/6281234567890\?text=Halo%20Rigspace/);
});

test("landing: fitur paket yang belum dibangun wajib berlabel segera", () => {
  const all = PLANS.flatMap((p) => p.features);
  const notShipped = [/pc builder/i, /trade-in/i, /broadcast/i, /keranjang/i, /payment gateway/i];
  for (const rule of notShipped) {
    const hits = all.filter((f) => rule.test(f));
    assert.ok(hits.length > 0, `fitur ${rule} harus tercantum`);
    for (const f of hits) assert.match(f, /\|segera$/, `"${f}" belum ada di produk → wajib "|segera"`);
  }
  const enterprise = PLANS.find((p) => p.id === "enterprise")!;
  assert.ok(enterprise.features.some((f) => /keranjang/i.test(f)));
  assert.ok(enterprise.features.some((f) => /payment gateway/i.test(f)));
});

test("landing EN: konten lengkap, harga USD, fitur belum jadi tetap berlabel segera", () => {
  const en = getLandingContent("en");
  assert.equal(en.locale, "en");
  assert.equal(en.soonLabel, "SOON");
  assert.equal(en.pricing.plans.length, 3);
  for (const plan of en.pricing.plans) {
    assert.match(plan.price, /^\$/);
  }
  const all = en.pricing.plans.flatMap((p) => p.features);
  const notShipped = [/pc builder/i, /trade-in/i, /broadcast/i, /shopping cart/i, /payment gateway/i];
  for (const rule of notShipped) {
    const hits = all.filter((f) => rule.test(f));
    assert.ok(hits.length > 0, `fitur EN ${rule} harus tercantum`);
    for (const f of hits) assert.match(f, /\|segera$/, `"${f}" belum ada di produk -> wajib "|segera"`);
  }
});

test("form minta demo EN: validasi & pesan WhatsApp berbahasa Inggris", () => {
  const err = parseDemoRequest({ storeName: "R", city: "Singapore", whatsapp: "6591234567" }, "en");
  assert.ok(!err.ok && /Store name/i.test(err.error));
  const wa = salesWhatsappUrl("6281234567890", "Rig Computer", "en");
  assert.match(wa, /^https:\/\/wa\.me\/6281234567890\?text=Hi%20Rigspace/);
});
