import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyHost, tenantSlugError, tenantStorefrontHost, cleanHostname, pickPreviewSlug, storePublicUrl } from "../src/lib/platform-domain";

const R = "rigspace.id";

test("klasifikasi host: root, subdomain, cadangan, custom, dev", () => {
  assert.deepEqual(classifyHost("rigspace.id", R), { kind: "platform-root" });
  assert.deepEqual(classifyHost("www.rigspace.id", R), { kind: "platform-root" });
  assert.deepEqual(classifyHost("RigSpace.ID:443", R), { kind: "platform-root" });
  assert.deepEqual(classifyHost("bitcomplaza.rigspace.id", R), { kind: "subdomain", slug: "bitcomplaza" });
  assert.deepEqual(classifyHost("admin.rigspace.id", R), { kind: "reserved", slug: "admin" });
  assert.deepEqual(classifyHost("a.b.rigspace.id", R), { kind: "reserved", slug: "a.b" });
  assert.deepEqual(classifyHost("bitcomplaza.com", R), { kind: "custom", domain: "bitcomplaza.com" });
  assert.deepEqual(classifyHost("www.bitcomplaza.com", R), { kind: "custom", domain: "bitcomplaza.com" });
  // Domain mirip tidak boleh dianggap subdomain platform
  assert.deepEqual(classifyHost("evilrigspace.id", R), { kind: "custom", domain: "evilrigspace.id" });

  for (const h of ["localhost:3000", "127.0.0.1:3000", "192.168.1.6:3000", "10.0.0.5", "abc-def.trycloudflare.com", "x.ngrok-free.app"]) {
    assert.equal(classifyHost(h, R).kind, "dev", h);
  }
  assert.deepEqual(classifyHost("plazabitcom.localhost:3000", R), { kind: "dev", slug: "plazabitcom" });
  assert.deepEqual(classifyHost("admin.localhost", R), { kind: "dev", slug: null });
  assert.deepEqual(classifyHost("rigspace.localhost:3000", R), { kind: "platform-root" });
  assert.equal(classifyHost("", R).kind, "dev");
  assert.equal(cleanHostname("Toko.RigSpace.id:8080"), "toko.rigspace.id");
});

test("slug toko: format & kata cadangan", () => {
  assert.equal(tenantSlugError("plazabitcom"), null);
  assert.equal(tenantSlugError("ijen-computer"), null);
  assert.match(tenantSlugError("www")!, /dicadangkan/);
  assert.match(tenantSlugError("admin")!, /dicadangkan/);
  assert.match(tenantSlugError("-toko")!, /Slug hanya/);
  assert.match(tenantSlugError("Toko")!, /Slug hanya/);
  assert.match(tenantSlugError("ab")!, /Slug hanya/);
  assert.equal(tenantStorefrontHost("plazabitcom", R), "plazabitcom.rigspace.id");
});

test("link demo: subdomain toko di produksi, origin request di dev", async () => {
  const { demoLinkUrl } = await import("../src/lib/platform-domain");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "rigspace.id", R), "https://bitcom.rigspace.id/demo/TOKEN123");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "ijen.rigspace.id", R), "https://bitcom.rigspace.id/demo/TOKEN123");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "localhost:3000", R), "http://localhost:3000/demo/TOKEN123");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "bitcom.localhost:3000", R), "http://bitcom.localhost:3000/demo/TOKEN123");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "192.168.1.6:3000", R), "http://192.168.1.6:3000/demo/TOKEN123");
  assert.equal(demoLinkUrl("bitcom", "TOKEN123", "abc.trycloudflare.com", R), "https://abc.trycloudflare.com/demo/TOKEN123");
});

test("pickPreviewSlug: cookie preview/impersonasi hanya di host dev", () => {
  const cookies = ["bitcom", null, "expocomp"];
  // produksi: cookie diabaikan -> rigspace.id tetap landing / subdomain tetap tokonya
  assert.equal(pickPreviewSlug({ isDev: false, cookies }), null);
  // produksi: ?store= eksplisit tetap boleh (izin tim dicek di resolver)
  assert.equal(pickPreviewSlug({ isDev: false, explicit: "rigcomputer", cookies }), "rigcomputer");
  // dev: cookie pertama yang valid
  assert.equal(pickPreviewSlug({ isDev: true, cookies }), "bitcom");
  assert.equal(pickPreviewSlug({ isDev: true, cookies: [undefined, "bad slug!", "ok-1"] }), "ok-1");
  // slug tidak valid ditolak
  assert.equal(pickPreviewSlug({ isDev: false, explicit: "../x" }), null);
});

test("storePublicUrl: produksi ke subdomain toko, dev ke origin yang sama", () => {
  assert.equal(storePublicUrl("bitcom", "rigspace.id", "rigspace.id"), "https://bitcom.rigspace.id");
  assert.equal(storePublicUrl("bitcom", "www.rigspace.id", "rigspace.id"), "https://bitcom.rigspace.id");
  assert.equal(storePublicUrl("bitcom", "tokoku.com", "rigspace.id"), "https://bitcom.rigspace.id");
  assert.equal(storePublicUrl("bitcom", "localhost:3000", "rigspace.id"), "/?store=bitcom");
  assert.equal(storePublicUrl(null, "rigspace.id", "rigspace.id"), "/");
});
