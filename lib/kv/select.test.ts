import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * select.ts statically imports ioredis (a production dependency, parity with the
 * original lib/redis.ts). In a bare checkout without node_modules the import
 * can't resolve, so we dynamic-import and SKIP — the selection logic itself is
 * proven dep-free by url.test.ts (fail-closed + normalization) and memory-kv.test.ts
 * (in-process semantics). Where ioredis is installed (CI, image), these run.
 */
let createKvClient: (() => any) | undefined;
try {
  ({ createKvClient } = await import("./select.ts"));
} catch {
  // ioredis not installed in this checkout — tests below skip.
}
const ready = createKvClient !== undefined;

function withEnv(value: string | undefined, fn: () => void | Promise<void>) {
  const prev = process.env.KV_URL;
  if (value === undefined) delete process.env.KV_URL;
  else process.env.KV_URL = value;
  const restore = () => {
    if (prev === undefined) delete process.env.KV_URL;
    else process.env.KV_URL = prev;
  };
  return Promise.resolve()
    .then(fn)
    .finally(restore);
}

test("KV_URL unset ⇒ in-process backend, fully functional", { skip: !ready }, async () => {
  await withEnv(undefined, async () => {
    const c = createKvClient!();
    assert.equal(c.status, "ready"); // MemoryKV lifecycle stub — no connection
    assert.equal(await c.set("k", "v"), "OK");
    assert.equal(await c.get("k"), "v");
  });
});

test("KV_URL malformed ⇒ THROWS (fail closed, no silent fallback)", { skip: !ready }, async () => {
  await withEnv("http://:pw@hanzo-kv:6379", () => {
    assert.throws(() => createKvClient!());
  });
});

test("KV_URL set (kv://) ⇒ external ioredis client, lazy (does not connect)", { skip: !ready }, async () => {
  await withEnv("kv://hanzo-kv:6379", () => {
    const c = createKvClient!();
    // ioredis with lazyConnect stays 'wait' until first command; MemoryKV is 'ready'.
    assert.notEqual(c.status, "ready");
    if (typeof c.disconnect === "function") c.disconnect();
  });
});
