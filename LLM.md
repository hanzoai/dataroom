# Hanzo Dataroom

## Overview
Hanzo dataroom service.

**Upstream**: [Papermark](https://github.com/mfts/papermark) (AGPL-3.0). LICENSE retains "Copyright (c) 2023-present Papermark, Inc." Open-source DocSend alternative. This fork is Hanzo Dataroom — single-license AGPL, no `ee/` commercial directory.

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

## Licensing

AGPLv3 only. The upstream Papermark commercial carve-out was removed from
`LICENSE`: it pointed at `papermark/tree/main/ee` and `app/(ee)`, neither of
which exists in this repository. The Papermark copyright line and the full
AGPLv3 body are upstream's and stay byte-for-byte unchanged; only the carve-out
clause and its dead pointers were deleted. `NOTICE` records the fork provenance
and states the exclusion explicitly.

There is no Enterprise Edition here and no upstream EE license-key check. Any
entitlement check must go through Hanzo's own licensing API (`/v1/licensing`) --
never an upstream EE gate.
