# dataroom — goja bundle (HIP-0106 fold, task #101)

This directory holds the **canonical, self-contained business-logic bundle** for
Hanzo Dataroom. It is the ESM-free port of the Next.js/Prisma API handlers,
authored to run verbatim inside the `dop251/goja` engine embedded in the unified
`hanzoai/cloud` binary — the same in-process pattern `@hanzo/plans` and
`@hanzo/pricing` use.

The standalone Next.js app + Postgres is **retired**: cloud serves the whole
dataroom surface (`/v1/dataroom/*`) itself, backed by Hanzo Base/SQLite
(one file per org) and the cloud object-storage seam. No Postgres, no Next.js.

It runs on the **reusable `clients/gojabase` binding** — the RW-Base goja host
`captable` pilots and `esign` reuses — so the bundle carries only domain logic;
persistence, per-tenant file selection, and per-request transactions are the
binding's job.

## What the bundle does

The complete dataroom flow, re-expressed as a route table over injected host
functions:

- **documents** — metadata rows; the file **bytes** live in object storage (the
  cloud VFS/S3 data plane), handled by the Go leaf. The bundle only ever
  stores/reads the opaque storage **key**.
- **data rooms** + **dataroom_document** — rooms and their document membership.
- **shareable links** — access controls: email gate + allow-list, bcrypt
  password, expiry, download toggle, archive.
- **viewers** + **views** — a viewer authenticates against a link's controls; a
  View (analytics session) is recorded.
- **per-page view analytics** — page-by-page tracking rows, aggregated per page
  (`views`, `totalDuration`, `avgDuration`).

The Prisma models (`Document`, `Dataroom`, `DataroomDocument`, `Link`, `Viewer`,
`View`, per-page tracking) become the `CREATE TABLE` statements in the bundle's
`migrate` route — the one source of truth for the Base schema.

## Host contract

`clients/gojabase` injects these globals per dispatch (each dispatch runs inside
ONE per-tenant SQLite transaction that commits iff `status < 400`) and calls
`handle` once per request:

```
globalThis.__db.query(sql, args)   -> [ {col: val, ...}, ... ]   // tenant-scoped
globalThis.__db.exec(sql, args)    -> { changes, lastId }
globalThis.__newId()               -> collision-resistant id (crypto/rand)
globalThis.__now()                 -> unix milliseconds
globalThis.__bcrypt.hash(pw)       -> bcrypt hash   (leaf HostFn, vetted Go)
globalThis.__bcrypt.verify(pw, h)  -> bool
globalThis.handle({ route, params, query, orgId, body }) -> { status, body }
```

- `__db` is bound **per dispatch** to exactly one tenant's SQLite file (selected
  from the caller's validated org), so a route can only ever touch its own org's
  rows.
- `__bcrypt` is a leaf-injected HostFn (bcrypt in vetted Go) — link passwords are
  **hashed, never plaintext**.
- The per-tenant **schema** (DDL) lives in the Go leaf (`clients/dataroom/
  schema.go`), run by gojabase on first open; this bundle only issues SQL.
- Admin routes run under the caller's validated cloud principal (org); public
  viewer routes resolve their org from the link index the leaf maintains.

## Constraints (goja target)

Same as `@hanzo/plans`: ES2020, **no ESM** `import`/`export`, **no Node
builtins**, no `console` dependency. Authored directly as the artifact goja runs
— there is exactly one bundle, one way to build it.

## Vendoring

`hanzoai/cloud/clients/dataroom/bundle.js` is a **byte-identical vendored copy**
that cloud `go:embed`s (the task mandates `go:embed` here rather than importing a
Go module, since this repo is a TS app, not a Go module). Edit **this** file, then
re-vendor the copy into cloud.
