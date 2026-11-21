import test from "node:test";
import assert from "node:assert/strict";
import { LANDING_EVENTS, readTrack, track } from "../src/components/platform/landing/tracking";

/** Simulasi browser: data-track-plan-id -> dataset.trackPlanId */
function toDataset(attrs: Record<string, string>) {
  const ds: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    const key = k.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    ds[key] = v;
  }
  return ds;
}

test("track() -> readTrack() bolak-balik menjaga nama event & parameter", () => {
  const attrs = track(LANDING_EVENTS.selectPlan, { plan: "pro", location: "pricing", plan_id: "x" });
  assert.equal(attrs["data-track"], "select_plan");
  assert.equal(attrs["data-track-plan-id"], "x");
  assert.deepEqual(readTrack(toDataset(attrs)), {
    event: "select_plan",
    params: { plan: "pro", location: "pricing", plan_id: "x" },
  });
});

test("event di luar daftar ditolak", () => {
  assert.equal(readTrack({ track: "purchase" }), null);
  assert.equal(readTrack({}), null);
});

test("nama parameter tidak valid dibuang & nilai dipotong 100 karakter", () => {
  const attrs = track(LANDING_EVENTS.ctaClick, { "Bad Key": "x", location: "a".repeat(300) });
  assert.equal(attrs["data-track-bad key"], undefined);
  const parsed = readTrack(toDataset(attrs));
  assert.equal(parsed?.params.location.length, 100);
  assert.deepEqual(Object.keys(parsed?.params ?? {}), ["location"]);
});
