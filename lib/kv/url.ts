/**
 * KV_URL resolution — the ONE place that decides the KV backend.
 *
 * Contract (uniform across every Hanzo KV consumer; mirrors commerce infra/kv.go):
 *   - KV_URL unset/empty  ⇒ returns null ⇒ caller uses the in-process backend
 *                            (Base/in-memory). This is the WITHOUT-KV mode, which
 *                            is single-replica correct.
 *   - KV_URL set          ⇒ returns a normalized `redis://`/`rediss://` DSN for the
 *                            external Hanzo KV instance (RESP wire protocol).
 *   - KV_URL malformed     ⇒ THROWS. Fail CLOSED — never silently fall back to the
 *                            in-process backend, which would mask a misconfigured
 *                            external KV as a "working" single-replica cache
 *                            (silent split-brain across replicas).
 *
 * Brand law: the env var is `KV_URL` and its canonical scheme is the Hanzo KV
 * brand scheme `kv://` (`kvs://` for TLS). RESP is the wire protocol, so we map
 * the brand scheme onto `redis://`/`rediss://` — the ONE allowed "redis" token,
 * confined to the wire URL. A raw `redis://`/`rediss://` DSN (what commerce's
 * KMS-synced secret carries) is accepted verbatim for cross-service uniformity.
 */

/**
 * resolveKvUrl maps the raw KV_URL env value to either null (⇒ in-process) or a
 * validated `redis://`/`rediss://` DSN (⇒ external Hanzo KV). Throws on a
 * malformed URL — the fail-closed contract.
 */
export function resolveKvUrl(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (value === "") {
    return null;
  }

  // Brand scheme kv:// / kvs:// → RESP wire scheme redis:// / rediss://.
  const normalized = value.startsWith("kv://")
    ? "redis://" + value.slice("kv://".length)
    : value.startsWith("kvs://")
      ? "rediss://" + value.slice("kvs://".length)
      : value;

  // Parse to validate. `new URL` throws on a malformed URL → propagates as the
  // fail-closed error (we never swallow it into a null/in-process fallback).
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch (cause) {
    throw new Error(
      `KV_URL is malformed and cannot be parsed as a redis:// DSN (got ${redact(value)})`,
      { cause },
    );
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(
      `KV_URL has unsupported scheme '${parsed.protocol}' — expected kv://, kvs://, redis:// or rediss:// (got ${redact(value)})`,
    );
  }

  if (parsed.hostname === "") {
    throw new Error(
      `KV_URL is missing a host — expected e.g. redis://:<password>@hanzo-kv:6379 (got ${redact(value)})`,
    );
  }

  return normalized;
}

/**
 * redact strips any userinfo (password) from a KV_URL before it appears in an
 * error message or log line — a malformed DSN must never leak its credential.
 */
function redact(value: string): string {
  const at = value.lastIndexOf("@");
  if (at === -1) {
    return value;
  }
  const schemeEnd = value.indexOf("://");
  const schemePrefix = schemeEnd === -1 ? "" : value.slice(0, schemeEnd + 3);
  return `${schemePrefix}<redacted>@${value.slice(at + 1)}`;
}
