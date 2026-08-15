// hanzoai/dataroom — Go embed module.
//
// This repo's PRIMARY artifact is the Hanzo Dataroom application (TypeScript/
// Next.js + Prisma). This tiny Go module exists ONLY so the unified hanzoai/cloud
// binary (HIP-0106, task #101) can embed the ESM-free goja bundle
// (goja/bundle.js) — the port of the dataroom domain (documents, data rooms,
// shareable links with access controls, viewers, per-page view analytics) — and
// run it in-process via dop251/goja, backed by Hanzo Base/SQLite. Cloud imports
// github.com/hanzoai/dataroom and gets Bundle().
//
// It is what makes the bundle a PINNED dependency rather than a hand-copied
// file: cloud requires this module at a version and records its checksum in
// go.sum, the same way it takes github.com/hanzoai/sign and
// github.com/hanzoai/captable. There is no second copy of the bundle to drift.
//
// std-lib only — no third-party Go deps. The object-storage seam and the bcrypt
// primitive live in cloud (Go host-functions); this module carries only the
// domain bundle.
module github.com/hanzoai/dataroom

go 1.26.4
