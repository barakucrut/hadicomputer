import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLocaleFromAcceptLanguage, parseLocale, resolveLocale } from "../src/lib/i18n";

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
