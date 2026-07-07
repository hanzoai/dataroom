/**
 * createKvClient — the ONE backend selector, mirroring commerce infra/kv.go's
 * NewKVClient/NewKVClientFromURL split:
 *
 *   KV_URL unset   ⇒ MemoryKV  (in-process, single-replica correct)
 *   KV_URL set     ⇒ ioredis   (external Hanzo KV, multi-replica HA)
 *   KV_URL bad     ⇒ THROW     (fail closed — resolveKvUrl never returns a
 *                               silent in-process fallback for a malformed DSN)
 *
 * Kept SYNCHRONOUS so `lib/redis.ts` can export module-level singletons exactly
 * as before. ioredis is a static import (a declared dependency, present in the
 * built image); MemoryKV is the pure in-process leaf. The method surface either
 * backend exposes is identical, so every call site and the Upstash-compat shims
 * in `lib/redis.ts` are backend-agnostic.
 */
import IORedis, { type Redis } from "ioredis";

import { MemoryKV } from "./memory-kv";
import { resolveKvUrl } from "./url";

const IOREDIS_OPTS = { maxRetriesPerRequest: 3, lazyConnect: true } as const;

export function createKvClient(): Redis {
  const url = resolveKvUrl(process.env.KV_URL); // throws on malformed → fail closed
  if (url === null) {
    // WITHOUT-KV: in-process backend. `unknown as Redis` is a controlled cast —
    // MemoryKV implements the exact ioredis subset dataroom uses (proven by
    // lib/kv/memory-kv.test.ts), not the full ioredis type.
    return new MemoryKV() as unknown as Redis;
  }
  // WITH-KV: external Hanzo KV over the RESP wire protocol.
  return new IORedis(url, IOREDIS_OPTS);
}
