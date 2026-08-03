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
Retitling a license document does not transfer copyright in the code beneath it.
This is recorded in `NOTICE` section 3 rather than silently reverted, because
unwinding it is a legal determination, not an engineering one. Do not "fix" it
unilaterally.

The fact that settles how weak our position is: **`ee/` is 100% upstream code.**
All 160 file-additions under `ee/` were authored upstream (151 by Marc Seitz);
zero by Hanzo. Not "substantially upstream" — entirely.

    git log --format='%H %ae' --name-status --diff-filter=A -- ee

### Deleting `ee/` was evaluated (2026-08-03) and is NOT a small change

Removing `ee/` outright was proposed as a way to dissolve the ownership
question. Do not attempt it as a quick fix. `ee/` is not a severable
commercial add-on here — **141 files outside `ee/` import from it**:

    grep -rIE "@/ee/" . --include='*.ts' --include='*.tsx' \
      --exclude-dir=node_modules | grep -vE '^\./(ee|app/\(ee\))/'

Of those, 63 import only plan gating (`@/ee/stripe/constants`, `@/ee/limits`)
and would fall out cleanly if paywalls were dropped — the same move already
made in `hanzoai/sign`. The other 78 import real features. The blocker is
`ee/features/storage/config.ts`, imported 9× from outside `ee/`: it builds the
S3 `StorageConfig` used by `lib/files/aws-client.ts`,
`lib/files/bulk-download-presign.ts`, `app/api/views/route.ts` and every
download route. It is the storage layer of a document-sharing product, and it
happens to live under `ee/`.

Deleting `ee/` therefore removes document storage, AI document chat,
conversations, granular permissions, dataroom invitations, workflows and
templates, and does not build. If the decision is still to remove it, it is a
scoped feature-removal project — migrate `features/storage` out of `ee/` first
— not a `git rm`.

Note the root LICENSE points at `ee/LICENSE` but the file is `ee/LICENSE.md`,
and it identifies the carve-out directories by their upstream
github.com/mfts/papermark URLs. Fixing that pointer was authorised *conditional
on `ee/` being deleted*; since `ee/` remains, the pointer still resolves to a
directory that exists and the root LICENSE stays untouched.

**AGPL §13 gap (open):** we serve this over the network at dataroom.hanzo.ai, so
users interacting with it remotely must be offered the Corresponding Source. The
running UI currently has **no source link** — `components/view/powered-by.tsx`
links to the product site (dataroom.hanzo.ai), not to source. Adding a visible
source link is the outstanding fix.
