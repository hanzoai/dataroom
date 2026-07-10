# Hanzo Dataroom

## Overview
Hanzo dataroom service.

**Upstream**: [Papermark](https://github.com/mfts/papermark) (AGPL-3.0). LICENSE retains "Copyright (c) 2023-present Papermark, Inc." Open-source DocSend alternative. This fork is Hanzo Dataroom — single-license AGPL, no `ee/` commercial directory.

## In-process fold (HIP-0106, task #101)
The production runtime is the **goja bundle** in [`goja/`](goja/): the ESM-free
port of the API handlers, run in-process inside the unified `hanzoai/cloud` binary
over Hanzo Base/SQLite (per-tenant) + the cloud object-storage seam. The standalone
Next.js app + Postgres pod is **retired**; cloud serves `/v1/dataroom/*` itself.
See [`goja/README.md`](goja/README.md) for the host contract. The Next.js/TS
sources below remain the reference for the domain model that `goja/bundle.js`
implements.

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
  features/
  lib/
  middleware.ts
```

## Key Files
- `README.md` -- Project documentation
- `package.json` -- Dependencies and scripts
- `Dockerfile` -- Container build
