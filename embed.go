// Package dataroom embeds the Hanzo Dataroom goja bundle so the unified
// hanzoai/cloud binary can serve /v1/dataroom/* in-process via the dop251/goja
// engine, without a Next.js runtime or Prisma/Postgres (HIP-0106, task #101).
//
// The TypeScript/Next.js app remains the primary artifact and reference for the
// domain. This Go file is a read-only embed:
//
//   - Bundle() returns goja/bundle.js — the self-contained, ESM-free port of the
//     dataroom surface (documents, data rooms, shareable links with access
//     controls, viewers, per-page view analytics) exposing globalThis.handle(req).
//
// The bundle carries LOGIC only. Its host capabilities — a per-tenant
// Base/SQLite store (globalThis.__db), the bcrypt primitive link passwords are
// hashed with (globalThis.__bcrypt), and the object storage the document bytes
// live in — are injected by the Go host in github.com/hanzoai/cloud/apps/dataroom.
// See goja/README.md for the contract.
package dataroom

import "embed"

//go:embed goja/bundle.js
var assets embed.FS

// Bundle returns the goja bundle source (goja/bundle.js). The host compiles this
// once and runs it on each pooled goja runtime.
func Bundle() ([]byte, error) {
	return assets.ReadFile("goja/bundle.js")
}
