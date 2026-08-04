# Tenant-authored custom plugins — implementation spec

Queued, not started (hit the 20-concurrent-agent cap). Launch with this brief.
Security is the design, not a feature: a tenant plugin is UNTRUSTED CODE in a
multi-tenant cloud. Get isolation right first; everything else follows.

## Already exists — build on it, do not reinvent

- `zip.Plugin{URL, Sum}` (zap-proto/zip v1.17.2, load.go): REFUSES a URL without
  a Sum, verifies SHA-256 **before** the file is made executable or given its
  final name, and uses the digest as the cache key. zip's own docs call this the
  one place a host becomes an ACE vector — exactly the property a tenant lane needs.
- **goja is already vendored inside zip** (esbuild+goja ≈38 packages).
- **`clients/connectorruntime` already runs untrusted JS in-process via goja** —
  HIP-0126, ActivePieces connector actions, no Node engine, mounted at
  `/v1/automations/connectors/:id/run`. This is the working precedent. Read it first.
- zip survives a plugin panic (TestPlugins_SurvivesPanic, passing under `-race`)
  and restarts with capped backoff.
- Tenancy is structural: a tenant is a SQLite file (hanzoai/orm, per-org CEK).
  Per-org S3 via hanzos3.

## 1. Tiered runtime model — pick ONE default, justify it

**Sandboxed (default for shared cloud):** JS via goja, Python via gpython, and/or
WASM. For each, enumerate what the sandbox *actually* guarantees — memory ceiling,
CPU/time budget, no ambient filesystem, no ambient network — and how it is
enforced. If goja/gpython cannot enforce CPU or memory limits unaided, say so and
name what does (watchdog, wasm runtime with fuel metering). Claim no isolation
that has not been verified.

**Native Go child process:** full OS access. Acceptable ONLY for
dedicated/sovereign/self-hosted, or behind real isolation (dedicated node pool +
seccomp/gVisor/Firecracker). Enforce in code — a tenant must not be able to select
the native tier in shared infra by setting a field.

## 2. Capability model

A tenant plugin reaches its own data, its own KMS secrets, and the AI gateway —
nothing else. No other org's data, no host credentials, no arbitrary egress.
Scope derives from the **org identity**, never from anything the plugin declares
about itself. Align with the host→plugin KMS credential flow rather than adding a
second secret path.

## 3. Tenant artifact lane

Org publishes to its own S3; cloud loads by URL+Sum. **Sum is mandatory** — zip
already refuses otherwise; do not weaken it. Define: who may register a plugin
for an org, how versions pin and roll back, behaviour on digest mismatch, and how
a malicious or crashing tenant plugin is contained.

## 4. Route namespace

Tenant plugins must not claim or shadow first-party prefixes. `manifest/apps.go`
is authoritative for first-party app→prefixes; tenants get a namespaced mount
(e.g. `/v1/orgs/{org}/apps/{name}/*`) and collisions are refused **loudly** at
registration. The manifest call-graph walk already caught four real first-party
shadowing bugs — do not reintroduce that class for tenants.

## 5. Ship the smallest real slice

One org, one sandboxed plugin loaded from an S3 URL+Sum, serving a namespaced
route, with a scoped capability call succeeding and an out-of-scope one REFUSED.
Paste the proof. If a tier cannot be made genuinely safe in the time available,
ship the one that can and report the other as designed-not-shipped. **A sandbox
that leaks is worse than a missing feature.**

## Constraints

Never `go build ./...` or `go test ./...` in cloud (OOMs the box — 90+ binaries at
~4.5GiB each); named targets max 3, `GOFLAGS=-p=2`, `export TMPDIR=/home/z/.cache/go-tmp`.
No local container images. Secrets from KMS only; passwords always hashed.
Coordinate with in-flight agents: cmd/host + manifest/ + apps/apps.go +
cmd/gen-app-cmds + Makefile (core-split → `cloud/app` contract + multi-call
`--app=X`), KMS credential flow, fleet control plane, clients/{admin,git,marketing}.
Stage explicit paths, rebase, never force-push.

## Report

Tiered model with per-tier enforcement · capability/scope derivation · shipped vs
designed · pasted proof (namespaced route served, scoped call OK, out-of-scope
REFUSED) · **and the honest list of attacks not closed.**
