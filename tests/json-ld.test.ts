import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLdString } from "../src/lib/json-ld";

test("jsonLdString escapes </script> so tenant text cannot break out of the tag", () => {
  const out = jsonLdString({ name: 'Laptop </script><script>alert(1)</script>' });
  assert.equal(out.includes("<"), false);
  assert.equal(out.toLowerCase().includes("</script"), false);
});

test("jsonLdString output parses back to the same data", () => {
  const data = { name: "A < B & \"C\"", sep: "x\u2028y\u2029z", n: 5, list: [1, "<!--"] };
  const out = jsonLdString(data);
  assert.equal(out.includes("\u2028"), false);
  assert.equal(out.includes("\u2029"), false);
  assert.deepEqual(JSON.parse(out), data);
});
