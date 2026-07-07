import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveKvUrl } from "./url.ts";

test("unset / empty / whitespace ⇒ null (in-process backend)", () => {
  assert.equal(resolveKvUrl(undefined), null);
  assert.equal(resolveKvUrl(null), null);
  assert.equal(resolveKvUrl(""), null);
  assert.equal(resolveKvUrl("   "), null);
});

test("kv:// brand scheme normalizes to redis:// wire scheme", () => {
  assert.equal(
    resolveKvUrl("kv://hanzo-kv.hanzo.svc:6379"),
    "redis://hanzo-kv.hanzo.svc:6379",
  );
  assert.equal(
    resolveKvUrl("kv://:secret@hanzo-kv:6379"),
    "redis://:secret@hanzo-kv:6379",
  );
});

test("kvs:// (TLS brand scheme) normalizes to rediss://", () => {
  assert.equal(resolveKvUrl("kvs://hanzo-kv:6380"), "rediss://hanzo-kv:6380");
});

test("raw redis:// / rediss:// DSN is accepted verbatim (commerce parity)", () => {
  assert.equal(
    resolveKvUrl("redis://:pw@hanzo-kv:6379/0"),
    "redis://:pw@hanzo-kv:6379/0",
  );
  assert.equal(resolveKvUrl("rediss://hanzo-kv:6380"), "rediss://hanzo-kv:6380");
});

test("FAIL CLOSED: unparseable URL throws (never silent in-process fallback)", () => {
  assert.throws(() => resolveKvUrl("::: not a url :::"), /malformed/);
});

test("FAIL CLOSED: non-redis scheme throws", () => {
  // A bare host:port parses as scheme 'localhost:' — must be rejected, not
  // silently connected to a phantom localhost.
  assert.throws(() => resolveKvUrl("localhost:6379"), /unsupported scheme|malformed/);
  assert.throws(() => resolveKvUrl("http://hanzo-kv:6379"), /unsupported scheme/);
  assert.throws(() => resolveKvUrl("valkey://hanzo-kv:6379"), /unsupported scheme/);
});

test("FAIL CLOSED: missing host throws", () => {
  assert.throws(() => resolveKvUrl("redis://"), /missing a host/);
});

test("error message REDACTS the password (no credential leak in logs)", () => {
  let msg = "";
  try {
    resolveKvUrl("http://:supersecretpw@hanzo-kv:6379");
  } catch (e) {
    msg = (e as Error).message;
  }
  assert.ok(msg.length > 0, "expected a throw");
  assert.ok(!msg.includes("supersecretpw"), "password must not appear in error");
  assert.ok(msg.includes("<redacted>"), "expected redaction marker");
});
