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
