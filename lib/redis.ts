/**
 * Hanzo KV client
 *
 * Connects to Hanzo KV (Valkey-compatible) via standard wire protocol.
 * Uses ioredis as transport (wire-compatible with Hanzo KV / Valkey / Redis).
 *
 * Environment: KV_URL (e.g. redis://:password@hanzo-kv.hanzo.svc:6379)
 */
import IORedis from "ioredis";

const kvUrl = process.env.KV_URL || process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new IORedis(kvUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const lockerRedisClient = new IORedis(kvUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Upstash-compatible set() shim — translates options-object calls to ioredis positional args
const originalSet = redis.set.bind(redis);
(redis as any).set = async function (
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
  return (redis as any).call("SET", ...args);
};

// Upstash-compatible zadd() shim — translates { score, member } to positional args
const originalZadd = redis.zadd.bind(redis);
(redis as any).zadd = async function (key: string, ...args: any[]) {
  if (args.length === 1 && typeof args[0] === "object" && "score" in args[0]) {
    const { score, member } = args[0];
    return originalZadd(key, score, member);
  }
  return originalZadd(key, ...args);
};

// Upstash-compatible zrange() shim — translates { byScore, rev } options
const originalZrange = redis.zrange.bind(redis);
const originalZrevrange = redis.zrevrange.bind(redis);
const originalZrangebyscore = redis.zrangebyscore.bind(redis);
(redis as any).zrange = async function (key: string, start: number | string, stop: number | string, opts?: { byScore?: boolean; rev?: boolean }) {
  if (opts?.rev) return originalZrevrange(key, start as number, stop as number);
  if (opts?.byScore) return originalZrangebyscore(key, start, stop);
  return originalZrange(key, start as number, stop as number);
};

// Upstash-compatible getdel() shim — atomic GET + DEL
(redis as any).getdel = async function (key: string) {
  const pipeline = redis.pipeline();
  pipeline.get(key);
  pipeline.del(key);
  const results = await pipeline.exec();
  return results?.[0]?.[1] ?? null;
};

// Upstash-compatible get() shim — try to auto-parse JSON
const originalGet = redis.get.bind(redis);
(redis as any).get = async function (key: string) {
  const val = await originalGet(key);
  if (val === null) return null;
  try { return JSON.parse(val); } catch { return val; }
};

// Upstash-compatible hincrby — already same signature in ioredis

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

      const pipeline = redis.pipeline();
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
