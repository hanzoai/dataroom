# LLM.md - Hanzo Dataroom

## Overview
Hanzo dataroom service

## Tech Stack
- **Language**: TypeScript/JavaScript

## Build & Run
```bash
npm install && npm run build
npm test
```

## Structure
```
dataroom/
  CLA.md
  Dockerfile
  LICENSE
  LLM.md
  Pipfile
  Pipfile.lock
  README.md
  SECURITY.md
  app/
  components/
  components.json
  context/
  ee/
  lib/
  middleware.ts
```

## Key Files
- `README.md` -- Project documentation
- `package.json` -- Dependencies and scripts
- `Dockerfile` -- Container build
- `LICENSE` -- upstream Papermark split license (AGPL-3.0 + commercial `ee/`). Do not edit.
- `NOTICE` -- upstream attribution, the `ee/` licensing split, Hanzo's modifications.

## Licensing — this is an AGPL fork with a commercial carve-out
Upstream is **Papermark** (https://github.com/mfts/papermark),
Copyright (c) 2023-present Papermark, Inc. We keep this license deliberately —
this is one of only two repos in the estate that stays AGPL (the other is
`hanzoai/sign`). Everything original at Hanzo is Apache-2.0 or BSD-3-Clause.

The root `LICENSE` defines a three-way split, inherited from upstream:
- `ee/` and `app/(ee)/` → commercial license (`ee/LICENSE.md`), **not** AGPL
- third-party components → their own owners' licenses
- everything else → AGPL-3.0

Rules for anyone touching this repo:
- **Never edit `LICENSE`.** It is pristine upstream (last touched by Marc Seitz,
  bf2cb41ca, 2025-12-08). The `Copyright (c) 2023-present Papermark, Inc.` line
  at its head stays — attribution is the obligation.
- Record new modification categories in `NOTICE`, not in a new markdown file.
- Upstream git history is preserved on purpose as attribution evidence. Never
  squash or rewrite it.

**Open issue — `ee/LICENSE.md` needs counsel.** The rebrand commit eb2273543
(2026-03-01) ran a repo-wide branding pass that also rewrote `ee/LICENSE.md`,
retitling "The Papermark Commercial License" to "The Hanzo Dataroom Commercial
License" and swapping its copyright line from Papermark, Inc. to Hanzo AI, Inc.
The code under `ee/` is substantially upstream Papermark code, and retitling a
license document does not transfer copyright in it. This is recorded in `NOTICE`
section 3 rather than silently reverted, because unwinding it is a legal
determination, not an engineering one. Do not "fix" it unilaterally.

Minor, same area: the root LICENSE points at `ee/LICENSE` but the file is
`ee/LICENSE.md`, and it identifies the carve-out directories by their upstream
github.com/mfts/papermark URLs.

**AGPL §13 gap (open):** we serve this over the network at dataroom.hanzo.ai, so
users interacting with it remotely must be offered the Corresponding Source. The
running UI currently has **no source link** — `components/view/powered-by.tsx`
links to the product site (dataroom.hanzo.ai), not to source. Adding a visible
source link is the outstanding fix.
