import assert from "node:assert/strict";
import { test } from "node:test";

import { MemoryKV } from "./memory-kv.ts";

test("strings: set/get/del with correct del count", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.get("k"), null);
  assert.equal(await kv.set("k", "v"), "OK");
  assert.equal(await kv.get("k"), "v");
  assert.equal(await kv.del("k", "absent"), 1); // only the live key counts
  assert.equal(await kv.get("k"), null);
});

test("setex + TTL: expired key reads as absent (lazy eviction, deterministic)", async () => {
  const kv = new MemoryKV();
  await kv.set("live", "1", "PX", 60_000);
  await kv.set("dead", "1", "PXAT", Date.now() - 1); // already past
  assert.equal(await kv.get("live"), "1");
  assert.equal(await kv.get("dead"), null);
  assert.equal(await kv.setex("s", 60, "y"), "OK");
  assert.equal(await kv.get("s"), "y");
});

test("SECURITY — NX gives mutual exclusion (tus lock invariant)", async () => {
  const kv = new MemoryKV();
  // First acquirer wins.
  assert.equal(await kv.set("tus-lock-x", "locked", "PX", 30_000, "NX"), "OK");
  // Second acquirer is refused while the lock is live — the null the
  // RedisLocker relies on to NOT enter the critical section.
  assert.equal(await kv.set("tus-lock-x", "stolen", "PX", 30_000, "NX"), null);
  assert.equal(await kv.get("tus-lock-x"), "locked"); // value untouched
  // unlock (DEL) then re-acquire succeeds.
  assert.equal(await kv.del("tus-lock-x"), 1);
  assert.equal(await kv.set("tus-lock-x", "again", "PX", 30_000, "NX"), "OK");
});

test("SECURITY — an EXPIRED lock does not block a fresh NX acquire", async () => {
  const kv = new MemoryKV();
  await kv.set("tus-lock-y", "old", "PXAT", Date.now() - 1); // expired lock
  assert.equal(await kv.set("tus-lock-y", "new", "PX", 30_000, "NX"), "OK");
  assert.equal(await kv.get("tus-lock-y"), "new");
});

test("incr: absent→1→2 and preserves TTL", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.incr("rl:ip"), 1);
  assert.equal(await kv.incr("rl:ip"), 2);
  await kv.set("c", "5", "PX", 60_000);
  assert.equal(await kv.incr("c"), 6);
});

test("zset: zadd + zrange asc, zrevrange desc, ties broken lexicographically", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.zadd("z", 3, "c"), 1);
  assert.equal(await kv.zadd("z", 1, "a"), 1);
  assert.equal(await kv.zadd("z", 2, "b"), 1);
  assert.equal(await kv.zadd("z", 1, "a"), 0); // re-add existing member → 0 new
  assert.deepEqual(await kv.zrange("z", 0, -1), ["a", "b", "c"]);
  assert.deepEqual(await kv.zrevrange("z", 0, -1), ["c", "b", "a"]);
  assert.equal(await kv.zcard("z"), 3);
});

test("zset: job-store pattern — newest-first via score=timestamp + zrevrange", async () => {
  const kv = new MemoryKV();
  await kv.zadd("user_jobs:u", 1000, "job1");
  await kv.zadd("user_jobs:u", 2000, "job2");
  await kv.zadd("user_jobs:u", 3000, "job3");
  assert.deepEqual(await kv.zrange("user_jobs:u", 0, 1, ), ["job1", "job2"]);
  assert.deepEqual(await kv.zrevrange("user_jobs:u", 0, 1), ["job3", "job2"]);
});

test("zset: zrangebyscore inclusive + zremrangebyscore + zrem", async () => {
  const kv = new MemoryKV();
  for (const [s, m] of [[10, "a"], [20, "b"], [30, "c"]] as const) {
    await kv.zadd("cleanup", s, m);
  }
  assert.deepEqual(await kv.zrangebyscore("cleanup", 0, 20), ["a", "b"]);
  assert.equal(await kv.zremrangebyscore("cleanup", 0, 15), 1); // removes "a"
  assert.deepEqual(await kv.zrange("cleanup", 0, -1), ["b", "c"]);
  assert.equal(await kv.zrem("cleanup", "b", "missing"), 1);
  assert.deepEqual(await kv.zrange("cleanup", 0, -1), ["c"]);
});

test("sets: sadd dedups, sismember/smembers/srem", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.sadd("report:d", "view1", "view2"), 2);
  assert.equal(await kv.sadd("report:d", "view1"), 0); // dup → 0 new
  assert.equal(await kv.sismember("report:d", "view1"), 1);
  assert.equal(await kv.sismember("report:d", "nope"), 0);
  assert.deepEqual((await kv.smembers("report:d")).sort(), ["view1", "view2"]);
  assert.equal(await kv.srem("report:d", "view1"), 1);
  assert.equal(await kv.sismember("report:d", "view1"), 0);
});

test("hashes: hset(field,val) + hset(object) + hincrby", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.hset("report:d:details", "view1", "spam"), 1);
  assert.equal(await kv.hset("report:d:details", { view2: "abuse", view3: "x" }), 2);
  assert.equal(await kv.hincrby("reportCount", "doc_1", 1), 1);
  assert.equal(await kv.hincrby("reportCount", "doc_1", 2), 3);
});

test("lists: rpush + lrange incl negative range (0,-1 = all)", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.rpush("q", "a"), 1);
  assert.equal(await kv.rpush("q", "b", "c"), 3);
  assert.deepEqual(await kv.lrange("q", 0, -1), ["a", "b", "c"]);
  assert.deepEqual(await kv.lrange("q", 0, 0), ["a"]);
});

test("getdel returns value then removes it", async () => {
  const kv = new MemoryKV();
  await kv.set("state", "xyz");
  assert.equal(await kv.getdel("state"), "xyz");
  assert.equal(await kv.get("state"), null);
});

test("SECURITY — getdel is atomic: two racing getdel, exactly one sees the value", async () => {
  // The one-time login-code guard (lib/emails/send-verification-request.ts,
  // fetchAndDeleteLoginCodeData) relies on GETDEL atomicity to stop a login code
  // being used twice. A get-then-delete with an await BETWEEN the read and the
  // delete lets both racers observe the value (TOCTOU); getdel must read+delete
  // in one un-yielded step so only one caller ever wins.
  const kv = new MemoryKV();
  await kv.set("login_code:once", "grant");
  const [a, b] = await Promise.all([
    kv.getdel("login_code:once"),
    kv.getdel("login_code:once"),
  ]);
  const winners = [a, b].filter((v) => v === "grant");
  assert.equal(winners.length, 1, "exactly one racer may observe the value");
  assert.equal(await kv.get("login_code:once"), null); // key is gone either way
});

test("call('SET', ...) dispatches to set (the set-with-options shim path)", async () => {
  const kv = new MemoryKV();
  assert.equal(await kv.call("SET", "k", "v", "EX", 60, "NX"), "OK");
  assert.equal(await kv.call("SET", "k", "v2", "NX"), null); // exists → NX null
  assert.equal(await kv.get("k"), "v");
  await assert.rejects(() => kv.call("GET", "k") as Promise<unknown>, /unsupported/);
});

test("pipeline: ratelimit pattern returns ioredis [err,res] tuples in order", async () => {
  const kv = new MemoryKV();
  const now = Date.now();
  const results = await kv
    .pipeline()
    .zremrangebyscore("rl:k", 0, now - 10_000)
    .zadd("rl:k", now, `${now}:a`)
    .zcard("rl:k")
    .pexpire("rl:k", 10_000)
    .exec();
  assert.equal(results.length, 4);
  for (const [err] of results) assert.equal(err, null);
  assert.equal(results[2][1], 1); // zcard → 1 request in window
});

test("pipeline: notification-queue pattern (rpush/expire/sadd)", async () => {
  const kv = new MemoryKV();
  const res = await kv
    .pipeline()
    .rpush("items:v:d", JSON.stringify({ a: 1 }))
    .expire("items:v:d", 3600)
    .sadd("viewers:daily", "v:d:t")
    .exec();
  assert.equal(res.length, 3);
  assert.deepEqual(await kv.lrange("items:v:d", 0, -1), ['{"a":1}']);
  assert.deepEqual(await kv.smembers("viewers:daily"), ["v:d:t"]);
});

test("pipeline: get+del composes in order (results[0][1] = GET result before DEL)", async () => {
  const kv = new MemoryKV();
  await kv.set("g", "val");
  const res = await kv.pipeline().get("g").del("g").exec();
  assert.equal(res[0][1], "val");
  assert.equal(await kv.get("g"), null);
});

test("SECURITY CONTRACT — two MemoryKV instances DO NOT share state", async () => {
  // This is the WITHOUT-KV multi-replica split-brain guarantee, made explicit:
  // each process/replica owns an isolated map. Multi-replica HA requires KV_URL.
  const a = new MemoryKV();
  const b = new MemoryKV();
  await a.set("session:1", "alice");
  assert.equal(await b.get("session:1"), null);
});

test("active expiry: sweepExpired reclaims write-once-never-read keys (bounds memory)", async () => {
  // rl:<ip> rate-limit keys and one-shot session/token keys are written with a
  // TTL and never read again, so the lazy on-read eviction never fires for them.
  // Without an active sweep the map grows unbounded until the pod OOMKills.
  // sweepExpired() reclaims every elapsed-TTL entry in one pass.
  const kv = new MemoryKV();
  const N = 100_000;
  const past = Date.now() - 1; // already expired at write time (deterministic)
  for (let i = 0; i < N; i++) {
    await kv.set(`rl:${i}`, "1", "PXAT", past);
  }
  assert.equal(kv.size, N); // resident despite expiry — never read, so never lazily evicted
  const evicted = kv.sweepExpired();
  assert.equal(evicted, N);
  assert.equal(kv.size, 0); // resident memory reclaimed
});

test("active expiry: sweepExpired keeps live keys, drops only expired ones", async () => {
  const kv = new MemoryKV();
  await kv.set("live", "1", "PX", 60_000); // far-future TTL
  await kv.set("nottl", "1"); // no TTL at all
  await kv.set("dead", "1", "PXAT", Date.now() - 1); // expired
  assert.equal(kv.sweepExpired(), 1); // only "dead"
  assert.equal(kv.size, 2);
  assert.equal(await kv.get("live"), "1");
  assert.equal(await kv.get("nottl"), "1");
});
