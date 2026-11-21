import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateDemoToken,
  isDemoTokenFormat,
  signDemoCookie,
  verifyDemoCookie,
  demoExpiry,
  isDemoLinkActive,
  deviceFromUserAgent,
} from "../src/lib/demo-access";

test("link demo: token, cookie bertanda tangan, kedaluwarsa", () => {
  const token = generateDemoToken();
  assert.equal(token.length, 24);
  assert.ok(isDemoTokenFormat(token));
  assert.ok(!isDemoTokenFormat("pendek"));
  assert.ok(!isDemoTokenFormat("../../etc/passwd"));
  assert.notEqual(generateDemoToken(), token);

  const now = new Date("2026-11-20T00:00:00Z");
  const exp = demoExpiry(now, 30);
  const cookie = signDemoCookie("tenant-a", token, exp);

  assert.equal(verifyDemoCookie("tenant-a", token, cookie, now), true);
  // toko lain, token baru (link dibuat ulang), kedaluwarsa, dan cookie dimodifikasi -> ditolak
  assert.equal(verifyDemoCookie("tenant-b", token, cookie, now), false);
  assert.equal(verifyDemoCookie("tenant-a", generateDemoToken(), cookie, now), false);
  assert.equal(verifyDemoCookie("tenant-a", token, cookie, new Date(exp.getTime() + 1)), false);
  const [e, mac] = cookie.split(".");
  assert.equal(verifyDemoCookie("tenant-a", token, `${Number(e) + 86_400_000}.${mac}`, now), false);
  assert.equal(verifyDemoCookie("tenant-a", token, "rusak", now), false);
  assert.equal(verifyDemoCookie("tenant-a", null, cookie, now), false);

  assert.equal(isDemoLinkActive(exp, now), true);
  assert.equal(isDemoLinkActive(null, now), false);
  assert.equal(isDemoLinkActive(new Date("2026-01-01"), now), false);
});

test("perangkat dari user-agent", () => {
  assert.equal(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "mobile");
  assert.equal(deviceFromUserAgent("Mozilla/5.0 (Linux; Android 14) Mobile"), "mobile");
  assert.equal(deviceFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(deviceFromUserAgent("Mozilla/5.0 (Macintosh)"), "desktop");
  assert.equal(deviceFromUserAgent(null), "desktop");
});
