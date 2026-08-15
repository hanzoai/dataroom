/**
 * Hanzo KV client
 *
 * Connects to Hanzo KV (Valkey-compatible) via standard wire protocol.
 * Uses @hanzo/kv as transport (wire-compatible with Hanzo KV / Valkey / KV).
 *
 * Environment: KV_URL (e.g. kv://:password@hanzo-kv.hanzo.svc:6379)
 */
import KV from "@hanzo/kv";

const kvUrl = process.env.KV_URL || "kv://localhost:6379";

/**
 * The surface the shims below actually provide.
 *
 * Every shim is attached with `(kv as any).x = …`, which changes BEHAVIOUR
 * but not TYPE — TypeScript keeps seeing @hanzo/kv's `get(key): Promise<string
 * | null>`. So `kv.get<{ email: string }>(key)` reads back a `string`, and
 * the call sites written against the options-object shape fail with
 * "Expected 0 type arguments"
 * and "Property 'email' does not exist on type 'string'".
 *
 * The get() shim already JSON-parses (see below); this only makes the type say
 * so. Nothing here changes what runs.
 */
type Client = KV & {
  get<T>(key: string): Promise<T | null>;
  set(
    key: string,
    value: unknown,
    opts?: { ex?: number; px?: number; pxat?: number; exat?: number; nx?: boolean },
  ): Promise<unknown>;
  zadd(key: string, entry: { score: number; member: string }): Promise<number>;
  zrange(
    key: string,
    start: number | string,
    stop: number | string,
    opts?: { byScore?: boolean; rev?: boolean },
  ): Promise<string[]>;
  getdel(key: string): Promise<string | null>;
};

export const kv = new KV(kvUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}) as unknown as Client;

export const lockKv = new KV(kvUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// set(): call sites pass an options object; @hanzo/kv takes positional args
const originalSet = kv.set.bind(kv);
(kv as any).set = async function (
  key: string,
  value: any,
  opts?: { ex?: number; px?: number; pxat?: number; exat?: number; nx?: boolean },
) {
  const val = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (!opts) return originalSet(key, val);
  const args: any[] = [key, val];
  if (opts.ex) { args.push("EX", opts.ex); }
  else if (opts.px) { args.push("PX", opts.px); }
  else if (opts.pxat) { args.push("PXAT", opts.pxat); }
  else if (opts.exat) { args.push("EXAT", opts.exat); }
  if (opts.nx) { args.push("NX"); }
  return (kv as any).call("SET", ...args);
};

// zadd(): call sites pass { score, member }; @hanzo/kv takes positional args
const originalZadd = kv.zadd.bind(kv);
(kv as any).zadd = async function (key: string, ...args: any[]) {
  if (args.length === 1 && typeof args[0] === "object" && "score" in args[0]) {
    const { score, member } = args[0];
    return originalZadd(key, score, member);
  }
  return originalZadd(key, ...args);
};

// zrange(): call sites pass { byScore, rev }; @hanzo/kv has a method per mode
// Bound explicitly: `bind()` on an overloaded method resolves to ONE signature,
// and which one shifts once `kv` carries the generic get() below — leaving
// the numeric (index-range) form unreachable. zrange by index takes numbers.
const originalZrange = kv.zrange.bind(kv) as unknown as (
  key: string,
  start: number,
  stop: number,
) => Promise<string[]>;
const originalZrevrange = kv.zrevrange.bind(kv);
const originalZrangebyscore = kv.zrangebyscore.bind(kv);
(kv as any).zrange = async function (key: string, start: number | string, stop: number | string, opts?: { byScore?: boolean; rev?: boolean }) {
  if (opts?.rev) return originalZrevrange(key, start as number, stop as number);
  if (opts?.byScore) return originalZrangebyscore(key, start, stop);
  return originalZrange(key, start as number, stop as number);
};

// getdel(): atomic GET + DEL, which @hanzo/kv does not expose as one call
(kv as any).getdel = async function (key: string) {
  const pipeline = kv.pipeline();
  pipeline.get(key);
  pipeline.del(key);
  const results = await pipeline.exec();
  return results?.[0]?.[1] ?? null;
};

// get(): call sites expect the stored JSON back as a value, not a string
const originalGet = kv.get.bind(kv);
(kv as any).get = async function (key: string) {
  const val = await originalGet(key);
  if (val === null) return null;
  try { return JSON.parse(val); } catch { return val; }
};

// hincrby needs no shim — same signature in @hanzo/kv

// Simple sliding-window rate limiter using Hanzo KV
export function ratelimit(
  requests: number = 10,
  window:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) {
  const windowMs = parseWindow(window);
  return {
    limit: async (identifier: string) => {
      const key = `rl:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const pipeline = kv.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}:${Math.random()}`);
      pipeline.zcard(key);
      pipeline.pexpire(key, windowMs);
      const results = await pipeline.exec();

      const count = (results?.[2]?.[1] as number) ?? 0;
      return {
        success: count <= requests,
        remaining: Math.max(0, requests - count),
        limit: requests,
        reset: now + windowMs,
      };
    },
  };
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) return 10000;
  const [, num, unit] = match;
  const n = parseInt(num!, 10);
  switch (unit) {
    case "ms": return n;
    case "s": return n * 1000;
    case "m": return n * 60 * 1000;
    case "h": return n * 60 * 60 * 1000;
    case "d": return n * 24 * 60 * 60 * 1000;
    default: return 10000;
  }
}
