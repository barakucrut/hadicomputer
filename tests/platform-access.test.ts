import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessGodPath,
  godNavFor,
  hasRealAddress,
  hasRealWhatsapp,
  normalizeWhatsapp,
  pickTenantUpdate,
  tenantHealth,
} from "../src/lib/platform-access";
import { parseTeamMemberInput } from "../src/lib/platform-team";

test("marketing hanya boleh membuka dashboard, tenant & design guide", () => {
  assert.equal(canAccessGodPath("MARKETING", "/god-mode"), true);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/tenants"), true);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/tenants/abc"), true);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/transactions"), false);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/team"), false);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/tenantsx"), false);
  assert.equal(canAccessGodPath("SUPERADMIN", "/god-mode/transactions"), true);
  assert.deepEqual(godNavFor("MARKETING").map((n) => n.icon), ["dashboard", "tenants"]);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/styleguide"), false);
  assert.ok(godNavFor("SUPERADMIN").some((n) => n.icon === "team"));
});

test("PATCH tenant: field superadmin diabaikan untuk marketing", () => {
  const body = { name: " Toko A ", plan: "ENTERPRISE", status: "ACTIVE", features: { pcBuilder: true }, customDomain: "a.com", acquiredById: "x", whatsappNumber: "0812-3456-7890" };
  const m = pickTenantUpdate("MARKETING", body);
  assert.ok(m.ok);
  assert.deepEqual(m.data, { name: "Toko A", whatsappNumber: "6281234567890" });

  const s = pickTenantUpdate("SUPERADMIN", body);
  assert.ok(s.ok);
  assert.equal(s.data.plan, "ENTERPRISE");
  assert.equal(s.data.customDomain, "a.com");
  assert.equal(s.data.acquiredById, "x");
  assert.deepEqual(s.data.features, { pcBuilder: true });
});

test("PATCH tenant: input salah ditolak dengan pesan jelas", () => {
  assert.equal(pickTenantUpdate("MARKETING", { name: "  " }).ok, false);
  assert.equal(pickTenantUpdate("MARKETING", { whatsappNumber: "0812" }).ok, false);
  // Placeholder "628" / kosong = belum diisi, tidak menggagalkan simpan & tidak ditulis
  const placeholder = pickTenantUpdate("MARKETING", { name: "Toko", whatsappNumber: "628" });
  assert.ok(placeholder.ok);
  assert.equal(placeholder.data.whatsappNumber, undefined);
  assert.equal(pickTenantUpdate("MARKETING", { primaryColor: "red" }).ok, false);
  assert.equal(pickTenantUpdate("SUPERADMIN", { plan: "GRATIS" }).ok, false);
  assert.equal(pickTenantUpdate("SUPERADMIN", { customDomain: "bukan domain" }).ok, false);
  const cleared = pickTenantUpdate("SUPERADMIN", { acquiredById: "", customDomain: "" });
  assert.ok(cleared.ok);
  assert.equal(cleared.data.acquiredById, null);
  assert.equal(cleared.data.customDomain, null);
});

test("nomor WhatsApp dinormalisasi & placeholder tidak dianggap asli", () => {
  assert.equal(normalizeWhatsapp("+62 812 3456 7890"), "6281234567890");
  assert.equal(normalizeWhatsapp("628"), null);
  assert.equal(hasRealWhatsapp("628"), false);
  assert.equal(hasRealWhatsapp("6285769000007"), false);
  assert.equal(hasRealWhatsapp("081234567891"), true);
  assert.equal(hasRealAddress("Indonesia"), false);
  assert.equal(hasRealAddress("Jl. Gajah Mada No. 10, Jember"), true);
});

test("kesehatan tenant: toko baru vs toko yang sudah berjalan", () => {
  const now = new Date("2026-11-20T10:00:00Z");
  const fresh = tenantHealth(
    { products: 0, sampleProducts: 0, banners: 0, hasLogo: false, whatsappNumber: "628", address: "Indonesia", lastAdminLoginAt: null, inquiries30d: 0 },
    now
  );
  assert.equal(fresh.stage, "baru");
  assert.equal(fresh.score, 0);
  assert.equal(fresh.nextAction, "Minta nomor WhatsApp & alamat toko yang asli");

  const sample = tenantHealth(
    { products: 22, sampleProducts: 22, banners: 3, hasLogo: true, whatsappNumber: "6281234567891", address: "Jl. Gajah Mada No. 10", lastAdminLoginAt: now, inquiries30d: 0 },
    now
  );
  assert.equal(sample.stage, "onboarding");
  assert.equal(sample.nextAction, "Ganti data contoh dengan produk asli toko");

  const live = tenantHealth(
    { products: 250, sampleProducts: 0, banners: 5, hasLogo: true, whatsappNumber: "6281234567891", address: "Jl. Gajah Mada No. 10", lastAdminLoginAt: "2026-11-15T00:00:00Z", inquiries30d: 4 },
    now
  );
  assert.equal(live.stage, "berjalan");
  assert.equal(live.score, 100);
  assert.equal(live.nextAction, null);

  const idle = tenantHealth(
    { products: 250, sampleProducts: 0, banners: 5, hasLogo: true, whatsappNumber: "6281234567891", address: "Jl. Gajah Mada No. 10", lastAdminLoginAt: "2026-10-01T00:00:00Z", inquiries30d: 0 },
    now
  );
  assert.equal(idle.stage, "siap");
  assert.equal(idle.nextAction, "Hubungi admin toko, belum login 14 hari");
});

test("validasi akun tim platform", () => {
  assert.equal(parseTeamMemberInput({ name: "Rina", email: "rina@x", password: "12345678" }, "create").ok, false);
  assert.equal(parseTeamMemberInput({ name: "Rina", email: "rina@rigspace.id", password: "1234" }, "create").ok, false);
  const ok = parseTeamMemberInput({ name: "Rina", email: " Rina@Rigspace.ID ", password: "rahasia123" }, "create");
  assert.ok(ok.ok);
  assert.equal(ok.data.email, "rina@rigspace.id");
  assert.equal(ok.data.role, "MARKETING");
  // Update: password kosong = tidak diganti
  const upd = parseTeamMemberInput({ password: "", isActive: false }, "update");
  assert.ok(upd.ok);
  assert.equal(upd.data.password, undefined);
  assert.equal(upd.data.isActive, false);
  assert.equal(parseTeamMemberInput({ role: "OWNER" }, "update").ok, false);
});

test("teks di atas warna aksen toko selalu terbaca", async () => {
  const { brandInk, relativeLuminance } = await import("../src/lib/brand-color");
  assert.equal(brandInk("#cc252b"), "#ffffff"); // merah
  assert.equal(brandInk("#2563eb"), "#ffffff"); // biru
  assert.equal(brandInk("#facc15"), "#0b0d0c"); // kuning
  assert.equal(brandInk("#a3e635"), "#0b0d0c"); // hijau muda
  assert.equal(brandInk("#fff"), "#0b0d0c");
  assert.equal(brandInk("bukan-warna"), "#ffffff");
  assert.equal(relativeLuminance("#000000"), 0);
});

test("warna sekunder: validasi & variabel CSS otomatis", async () => {
  const { brandCssVars, safeHex } = await import("../src/lib/brand-color");
  const { pickTenantUpdate } = await import("../src/lib/platform-access");

  assert.equal(safeHex("#0F1E3D", "#111413"), "#0f1e3d");
  assert.equal(safeHex("red;}body{", "#111413"), "#111413");
  assert.equal(safeHex("#abc", "#111413"), "#111413");

  const dark = brandCssVars("#dd2028", "#111413");
  assert.equal(dark["--brand-2"], "#111413");
  assert.equal(dark["--brand-2-ink"], "#ffffff");
  assert.equal(dark["--brand-2-accent"], "#f6e3a1");
  assert.equal(dark["--brand-ink"], "#ffffff");

  const light = brandCssVars("#facc15", "#f1f1ef");
  assert.equal(light["--brand-2-ink"], "#0b0d0c");
  assert.equal(light["--brand-2-accent"], "#0b0d0c");
  assert.equal(light["--brand-ink"], "#0b0d0c");

  const bad = brandCssVars("javascript:", undefined);
  assert.equal(bad["--red"], "#dd2028");
  assert.equal(bad["--brand-2"], "#111413");

  const ok = pickTenantUpdate("MARKETING", { secondaryColor: "#0f1e3d" });
  assert.ok(ok.ok && ok.data.secondaryColor === "#0f1e3d");
  assert.equal(pickTenantUpdate("MARKETING", { secondaryColor: "navy" }).ok, false);
});

test("standar password: berlaku sama untuk /admin & /god-mode", async () => {
  const { passwordPolicyError, passwordChangeError, PASSWORD_MIN } = await import("../src/lib/password-policy");
  assert.equal(PASSWORD_MIN, 8);
  assert.match(passwordPolicyError("")!, /wajib/);
  assert.match(passwordPolicyError("        ")!, /spasi/);
  assert.match(passwordPolicyError("abc1234")!, /minimal 8/);
  assert.equal(passwordPolicyError("abcd1234"), null);
  assert.match(passwordPolicyError("a".repeat(73))!, /maksimal 72/);
  assert.match(passwordPolicyError("😀".repeat(19))!, /maksimal 72/); // 76 byte
  assert.match(passwordPolicyError("Budi@Toko.com", { email: "budi@toko.com" })!, /email/);
  assert.match(passwordPolicyError("budisantoso", { email: "budisantoso@toko.com" })!, /email/);
  assert.equal(passwordPolicyError("budisantoso99", { email: "budisantoso@toko.com" }), null);

  const base = { currentPassword: "lama12345", newPassword: "baru12345", confirmPassword: "baru12345" };
  assert.equal(passwordChangeError(base), null);
  assert.match(passwordChangeError({ ...base, currentPassword: "" })!, /saat ini/);
  assert.match(passwordChangeError({ ...base, newPassword: "pendek", confirmPassword: "pendek" })!, /^Password baru minimal/);
  assert.match(passwordChangeError({ ...base, confirmPassword: "beda12345" })!, /Konfirmasi/);
  assert.match(passwordChangeError({ ...base, newPassword: "lama12345", confirmPassword: "lama12345" })!, /sama dengan password lama/);

  const { parseTeamMemberInput } = await import("../src/lib/platform-team");
  const team = parseTeamMemberInput({ name: "Rina", email: "rina@rigspace.id", password: "rina" }, "create");
  assert.equal(team.ok, false);
});

test("peran CMO: akses halaman & field sama seperti marketing, struktur tim valid", async () => {
  const { isPlatformRole, canAccessGodPath, godNavFor, pickTenantUpdate, isSalesRole } = await import("../src/lib/platform-access");
  const { resolveManagerId, parseTeamMemberInput } = await import("../src/lib/platform-team");

  assert.equal(isPlatformRole("CMO"), true);
  assert.equal(isSalesRole("CMO"), true);
  assert.equal(isSalesRole("SUPERADMIN"), false);
  assert.equal(canAccessGodPath("CMO", "/god-mode/tenants"), true);
  assert.equal(canAccessGodPath("CMO", "/god-mode/team"), false);
  assert.equal(canAccessGodPath("CMO", "/god-mode/transactions"), false);
  assert.deepEqual(godNavFor("CMO").map((n) => n.href), ["/god-mode", "/god-mode/tenants", "/god-mode/permintaan-demo"]);
  assert.equal(canAccessGodPath("MARKETING", "/god-mode/permintaan-demo"), false);

  const cmo = pickTenantUpdate("CMO", { name: "Toko A", plan: "ENTERPRISE", status: "ACTIVE", acquiredById: "x" });
  assert.ok(cmo.ok);
  assert.deepEqual(cmo.ok && Object.keys(cmo.data), ["name"]);

  assert.deepEqual(resolveManagerId({ role: "MARKETING", managerId: "cmo1", selfId: "m1" }), { ok: true, managerId: "cmo1" });
  assert.deepEqual(resolveManagerId({ role: "CMO", managerId: "cmo1" }), { ok: true, managerId: null });
  assert.deepEqual(resolveManagerId({ role: "SUPERADMIN", managerId: "cmo1" }), { ok: true, managerId: null });
  assert.equal(resolveManagerId({ role: "MARKETING", managerId: "m1", selfId: "m1" }).ok, false);

  const created = parseTeamMemberInput({ name: "Sinta", email: "sinta@rigspace.id", role: "CMO", password: "sinta12345" }, "create");
  assert.ok(created.ok && created.data.role === "CMO");
  const assigned = parseTeamMemberInput({ managerId: "  cmo1 " }, "update");
  assert.ok(assigned.ok && assigned.data.managerId === "cmo1");
  const released = parseTeamMemberInput({ managerId: "" }, "update");
  assert.ok(released.ok && released.data.managerId === null);
});

test("CMS toko via god-mode: tim penjualan tanpa kelola user & role", async () => {
  const { platformCmsPermissions, SALES_CMS_FORBIDDEN, platformCmsSessionId, isPlatformCmsSessionId } = await import("../src/lib/platform-cms");
  assert.deepEqual(platformCmsPermissions("SUPERADMIN"), ["*"]);
  for (const role of ["CMO", "MARKETING"] as const) {
    const perms = platformCmsPermissions(role);
    assert.ok(!perms.includes("*"));
    for (const forbidden of SALES_CMS_FORBIDDEN) assert.ok(!perms.includes(forbidden), `${role} tidak boleh ${forbidden}`);
    assert.ok(perms.includes("products:edit") && perms.includes("settings:appearance"));
  }
  assert.equal(platformCmsSessionId("SUPERADMIN", null), "god-mode-superadmin");
  assert.equal(platformCmsSessionId("MARKETING", "u1"), "platform-u1");
  assert.equal(isPlatformCmsSessionId("platform-u1"), true);
  assert.equal(isPlatformCmsSessionId("cmabc123"), false);
});
