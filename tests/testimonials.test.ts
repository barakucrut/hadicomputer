import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectHomeTestimonials,
  testimonialInitials,
  validateTestimonial,
} from "../src/lib/testimonials";

test("validateTestimonial requires name and quote, trims and nulls empties", () => {
  assert.equal(validateTestimonial({ quote: "Mantap" }).ok, false);
  assert.equal(validateTestimonial({ name: "Rina" }).ok, false);
  const r = validateTestimonial({ name: "  Rina ", quote: " Cepat beres ", descriptor: "", rating: "" });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.data.name, "Rina");
  assert.equal(r.data.quote, "Cepat beres");
  assert.equal(r.data.descriptor, null);
  assert.equal(r.data.rating, null);
  assert.equal(r.data.source, "DIRECT");
  assert.equal(r.data.isActive, true);
});

test("validateTestimonial rejects bad rating, long quote, unsafe urls", () => {
  const base = { name: "A", quote: "B" };
  assert.equal(validateTestimonial({ ...base, rating: 6 }).ok, false);
  assert.equal(validateTestimonial({ ...base, rating: 2.5 }).ok, false);
  assert.equal(validateTestimonial({ ...base, quote: "x".repeat(301) }).ok, false);
  assert.equal(validateTestimonial({ ...base, source: "FACEBOOK" }).ok, false);
  assert.equal(validateTestimonial({ ...base, photoUrl: "javascript:alert(1)" }).ok, false);
  assert.equal(validateTestimonial({ ...base, photoUrl: "/uploads/../.env" }).ok, false);
  assert.equal(validateTestimonial({ ...base, photoUrl: "https://tracker.example/p.png" }).ok, false);
  assert.equal(validateTestimonial({ ...base, sourceUrl: "ftp://x" }).ok, false);
  const ok = validateTestimonial({ ...base, rating: 5, source: "google", photoUrl: "/uploads/testimonials/a.jpg" });
  assert.ok(ok.ok && ok.data.rating === 5 && ok.data.source === "GOOGLE");
});

test("selectHomeTestimonials: active only, featured first, sortOrder, newest, max 6", () => {
  const mk = (id: string, o: Partial<{ isActive: boolean; isFeatured: boolean; sortOrder: number; createdAt: string }>) => ({
    id,
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
    createdAt: "2026-01-01",
    ...o,
  });
  const items = [
    mk("hidden", { isActive: false, isFeatured: true }),
    mk("old", { createdAt: "2026-01-01" }),
    mk("new", { createdAt: "2026-05-01" }),
    mk("ordered", { sortOrder: -1 }),
    mk("feat", { isFeatured: true, sortOrder: 9 }),
  ];
  assert.deepEqual(selectHomeTestimonials(items).map((t) => t.id), ["feat", "ordered", "new", "old"]);
  const many = Array.from({ length: 9 }, (_, i) => mk(String(i), { sortOrder: i }));
  assert.equal(selectHomeTestimonials(many).length, 6);
});

test("testimonialInitials", () => {
  assert.equal(testimonialInitials("budi santoso wijaya"), "BW");
  assert.equal(testimonialInitials("Rina"), "R");
  assert.equal(testimonialInitials("  "), "?");
});
