/**
 * MemoryKV — the in-process KV backend (the WITHOUT-KV mode).
 *
 * When KV_URL is unset, `lib/redis.ts` binds `redis`/`lockerRedisClient` to a
 * MemoryKV instead of an external Hanzo KV connection. It implements the exact
 * ioredis method subset dataroom uses — strings (+TTL), sorted sets, sets,
 * hashes, lists, and pipelines — with ioredis-faithful signatures and return
 * types, so every call site and the Upstash-compat shims in `lib/redis.ts` are
 * unchanged. A single process shares ONE map, which is correct for a
 * single-replica deployment (dataroom runs replicas: 1).
 *
 * SCOPE / SECURITY (read before scaling): MemoryKV is per-process. It is
 * authoritative ONLY for a single replica. Running dataroom with replicas > 1
 * and KV_URL unset would give each replica its OWN map — sessions, rate-limit
 * counters, tus upload locks and digest queues would NOT be shared across
 * replicas (split-brain). Multi-replica HA REQUIRES KV_URL set (external Hanzo
 * KV). This is the deliberate WITH/WITHOUT-KV contract, not a bug.
 *
 * This module has ZERO imports (pure leaf) so it is unit-testable with
 * `node --test` and carries no bundling cost into the edge runtime.
 */

type Zset = Map<string, number>; // member -> score
type Hash = Map<string, string>; // field -> value

interface Entry {
  // Exactly one of these is set, per Redis key type.
  str?: string;
  zset?: Zset;
  set?: Set<string>;
  hash?: Hash;
  list?: string[];
  // Absolute expiry in epoch ms; undefined = no expiry.
  expireAt?: number;
}

/** A queued pipeline op: run it and yield ioredis's [err, result] tuple. */
type PipelineOp = () => Promise<[Error | null, unknown]>;

export class MemoryKV {
  private store = new Map<string, Entry>();

  // ── expiry + typed accessors ──────────────────────────────────────────────

  /** Return the live entry for key, evicting it first if its TTL has elapsed. */
  private live(key: string): Entry | undefined {
    const e = this.store.get(key);
    if (e === undefined) return undefined;
    if (e.expireAt !== undefined && e.expireAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e;
  }

  private zsetOf(key: string): Zset {
    const e = this.live(key);
    if (e?.zset) return e.zset;
    const z: Zset = new Map();
    this.store.set(key, { zset: z, expireAt: e?.expireAt });
    return z;
  }

  private setOf(key: string): Set<string> {
    const e = this.live(key);
    if (e?.set) return e.set;
    const s = new Set<string>();
    this.store.set(key, { set: s, expireAt: e?.expireAt });
    return s;
  }

  private hashOf(key: string): Hash {
    const e = this.live(key);
    if (e?.hash) return e.hash;
    const h: Hash = new Map();
    this.store.set(key, { hash: h, expireAt: e?.expireAt });
    return h;
  }

  private listOf(key: string): string[] {
    const e = this.live(key);
    if (e?.list) return e.list;
    const l: string[] = [];
    this.store.set(key, { list: l, expireAt: e?.expireAt });
    return l;
  }

  // ── strings ───────────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    const e = this.live(key);
    return e?.str ?? null;
  }

  /**
   * set(key, value, ...opts) — supports the ioredis positional option tokens
   * dataroom uses: EX <s>, PX <ms>, EXAT <s-epoch>, PXAT <ms-epoch>, NX.
   * Returns "OK" on write, or null when NX is set and the key already holds a
   * live value (this null is what the tus RedisLocker relies on for mutual
   * exclusion — do not change it).
   */
  async set(
    key: string,
    value: string | number,
    ...opts: Array<string | number>
  ): Promise<"OK" | null> {
    let expireAt: number | undefined;
    let nx = false;
    for (let i = 0; i < opts.length; i++) {
      const tok = String(opts[i]).toUpperCase();
      switch (tok) {
        case "EX":
          expireAt = Date.now() + Number(opts[++i]) * 1000;
          break;
        case "PX":
          expireAt = Date.now() + Number(opts[++i]);
          break;
        case "EXAT":
          expireAt = Number(opts[++i]) * 1000;
          break;
        case "PXAT":
          expireAt = Number(opts[++i]);
          break;
        case "NX":
          nx = true;
          break;
        case "XX":
          // present for completeness; not used by dataroom
          if (this.live(key) === undefined) return null;
          break;
        case "KEEPTTL":
          expireAt = this.live(key)?.expireAt;
          break;
        default:
          break;
      }
    }
    if (nx && this.live(key) !== undefined) {
      return null;
    }
    this.store.set(key, { str: String(value), expireAt });
    return "OK";
  }

  async setex(key: string, seconds: number, value: string | number): Promise<"OK"> {
    this.store.set(key, {
      str: String(value),
      expireAt: Date.now() + Number(seconds) * 1000,
    });
    return "OK";
  }

  async getdel(key: string): Promise<string | null> {
    const v = await this.get(key);
    this.store.delete(key);
    return v;
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys.flat()) {
      // Count only keys that are currently live (matches Redis DEL semantics:
      // an already-expired key is not counted).
      if (this.live(k) !== undefined) n++;
      this.store.delete(k);
    }
    return n;
  }

  async incr(key: string): Promise<number> {
    const cur = (await this.get(key)) ?? "0";
    const n = Number.parseInt(cur, 10);
    if (Number.isNaN(n)) {
      throw new Error("ERR value is not an integer or out of range");
    }
    const next = n + 1;
    const prev = this.live(key);
    this.store.set(key, { str: String(next), expireAt: prev?.expireAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const e = this.live(key);
    if (e === undefined) return 0;
    e.expireAt = Date.now() + Number(seconds) * 1000;
    return 1;
  }

  async pexpire(key: string, ms: number): Promise<number> {
    const e = this.live(key);
    if (e === undefined) return 0;
    e.expireAt = Date.now() + Number(ms);
    return 1;
  }

  // ── sorted sets ────────────────────────────────────────────────────────────

  /** zadd(key, score, member) — single pair (the only form dataroom uses). */
  async zadd(key: string, score: number | string, member: string): Promise<number> {
    const z = this.zsetOf(key);
    const isNew = !z.has(member);
    z.set(member, Number(score));
    return isNew ? 1 : 0;
  }

  /** Members sorted by (score asc, member lexicographic) — Redis ordering. */
  private sortedMembers(key: string): string[] {
    const z = this.live(key)?.zset;
    if (!z) return [];
    return [...z.entries()]
      .sort((a, b) => (a[1] - b[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([m]) => m);
  }

  private static sliceRange(arr: string[], start: number, stop: number): string[] {
    const n = arr.length;
    let s = start < 0 ? n + start : start;
    let e = stop < 0 ? n + stop : stop;
    if (s < 0) s = 0;
    if (e >= n) e = n - 1;
    if (s > e) return [];
    return arr.slice(s, e + 1);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return MemoryKV.sliceRange(this.sortedMembers(key), start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return MemoryKV.sliceRange(this.sortedMembers(key).reverse(), start, stop);
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    const lo = min === "-inf" ? -Infinity : Number(min);
    const hi = max === "+inf" ? Infinity : Number(max);
    const z = this.live(key)?.zset;
    if (!z) return [];
    return [...z.entries()]
      .filter(([, s]) => s >= lo && s <= hi)
      .sort((a, b) => (a[1] - b[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([m]) => m);
  }

  async zremrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<number> {
    const lo = min === "-inf" ? -Infinity : Number(min);
    const hi = max === "+inf" ? Infinity : Number(max);
    const z = this.live(key)?.zset;
    if (!z) return 0;
    let removed = 0;
    for (const [m, s] of [...z.entries()]) {
      if (s >= lo && s <= hi) {
        z.delete(m);
        removed++;
      }
    }
    return removed;
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const z = this.live(key)?.zset;
    if (!z) return 0;
    let removed = 0;
    for (const m of members.flat()) {
      if (z.delete(m)) removed++;
    }
    return removed;
  }

  async zcard(key: string): Promise<number> {
    return this.live(key)?.zset?.size ?? 0;
  }

  // ── sets ───────────────────────────────────────────────────────────────────

  async sadd(key: string, ...members: string[]): Promise<number> {
    const s = this.setOf(key);
    let added = 0;
    for (const m of members.flat()) {
      if (!s.has(m)) {
        s.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const s = this.live(key)?.set;
    if (!s) return 0;
    let removed = 0;
    for (const m of members.flat()) {
      if (s.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    return [...(this.live(key)?.set ?? [])];
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.live(key)?.set?.has(member) ? 1 : 0;
  }

  // ── hashes ─────────────────────────────────────────────────────────────────

  /** hset(key, field, value) OR hset(key, { field: value, ... }). */
  async hset(
    key: string,
    fieldOrObj: string | Record<string, string | number>,
    value?: string | number,
  ): Promise<number> {
    const h = this.hashOf(key);
    let added = 0;
    const put = (f: string, v: string | number) => {
      if (!h.has(f)) added++;
      h.set(f, String(v));
    };
    if (typeof fieldOrObj === "object") {
      for (const [f, v] of Object.entries(fieldOrObj)) put(f, v);
    } else {
      put(fieldOrObj, value as string | number);
    }
    return added;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const h = this.hashOf(key);
    const cur = Number.parseInt(h.get(field) ?? "0", 10);
    if (Number.isNaN(cur)) {
      throw new Error("ERR hash value is not an integer");
    }
    const next = cur + Number(increment);
    h.set(field, String(next));
    return next;
  }

  // ── lists ──────────────────────────────────────────────────────────────────

  async rpush(key: string, ...values: string[]): Promise<number> {
    const l = this.listOf(key);
    l.push(...values.flat());
    return l.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const l = this.live(key)?.list;
    if (!l) return [];
    return MemoryKV.sliceRange(l, start, stop);
  }

  // ── generic command dispatch (used by the SET-with-options shim) ───────────

  async call(command: string, ...args: Array<string | number>): Promise<unknown> {
    if (command.toUpperCase() === "SET") {
      const [key, value, ...opts] = args;
      return this.set(String(key), value, ...opts);
    }
    throw new Error(`MemoryKV: unsupported command '${command}'`);
  }

  // ── pipeline ───────────────────────────────────────────────────────────────

  pipeline(): MemoryPipeline {
    return new MemoryPipeline(this);
  }

  // ── lifecycle no-ops (ioredis parity; MemoryKV needs no connection) ────────

  get status(): string {
    return "ready";
  }
  on(): this {
    return this;
  }
  once(): this {
    return this;
  }
  async connect(): Promise<void> {}
  async quit(): Promise<"OK"> {
    return "OK";
  }
  disconnect(): void {}
}

/**
 * MemoryPipeline mirrors ioredis's chainable pipeline. Each method queues the
 * corresponding MemoryKV op and returns `this`; `exec()` runs them in order and
 * returns ioredis's `Array<[Error | null, result]>` shape.
 */
export class MemoryPipeline {
  private ops: PipelineOp[] = [];
  private kv: MemoryKV;
  constructor(kv: MemoryKV) {
    this.kv = kv;
  }

  private queue<T>(fn: () => Promise<T>): this {
    this.ops.push(async () => {
      try {
        return [null, await fn()];
      } catch (err) {
        return [err as Error, undefined];
      }
    });
    return this;
  }

  get(key: string): this {
    return this.queue(() => this.kv.get(key));
  }
  del(...keys: string[]): this {
    return this.queue(() => this.kv.del(...keys));
  }
  expire(key: string, seconds: number): this {
    return this.queue(() => this.kv.expire(key, seconds));
  }
  pexpire(key: string, ms: number): this {
    return this.queue(() => this.kv.pexpire(key, ms));
  }
  zadd(key: string, score: number | string, member: string): this {
    return this.queue(() => this.kv.zadd(key, score, member));
  }
  zcard(key: string): this {
    return this.queue(() => this.kv.zcard(key));
  }
  zremrangebyscore(key: string, min: number | string, max: number | string): this {
    return this.queue(() => this.kv.zremrangebyscore(key, min, max));
  }
  sadd(key: string, ...members: string[]): this {
    return this.queue(() => this.kv.sadd(key, ...members));
  }
  rpush(key: string, ...values: string[]): this {
    return this.queue(() => this.kv.rpush(key, ...values));
  }

  async exec(): Promise<Array<[Error | null, unknown]>> {
    const results: Array<[Error | null, unknown]> = [];
    for (const op of this.ops) {
      results.push(await op());
    }
    return results;
  }
}
