# Hanzo Dataroom

## Overview
Hanzo dataroom service.

**Upstream**: [Papermark](https://github.com/mfts/papermark) (AGPL-3.0). LICENSE
retains "Copyright (c) 2023-present Papermark, Inc." Open-source DocSend
alternative. This fork is Hanzo Dataroom — single-license AGPL, no commercial
carve-out anywhere in the tree.

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
  context/
  lib/
  pages/
  prisma/
  middleware.ts
```

## Key Files
- `README.md` -- Project documentation
- `package.json` -- Dependencies and scripts
- `Dockerfile` -- Container build

---

## Why there is no `ee/`, no `features/`, and no paywall

Papermark ships two licences in one repository: AGPL-3.0 for the bulk of the
tree, and a separate commercial licence for everything under `ee/`. We hold the
AGPL grant. We do not hold the commercial one — we cannot sell that code, cannot
sublicense it, and cannot ship it to a customer. It is pure liability with zero
upside, so none of it lives here.

The subtle part, and the reason this needed a deliberate cleanup rather than a
one-line `git rm`: **the `ee/` directory disappearing from the tree was not the
same as the code being removed.** A commit titled "ci: amd64-only build"
(`48eecb248`) *renamed* 150 files out of `ee/` — byte-identical — into
`features/`, `lib/billing/legacy/` (upstream `ee/stripe`), `lib/billing/limits/`
(upstream `ee/limits`), and flattened the `app/(ee)/` route group into `app/`.
The commercially-licensed code was then sitting under our AGPL root LICENSE,
which is a worse posture than having it in a clearly-labelled `ee/` directory.
A rename is not a deletion; `git log --follow` is the only honest way to ask
where a file came from.

So the rule applied throughout: **relocation is not laundering.** Every path that
`48eecb248` renamed out of `ee/` has been deleted, whether or not it was later
edited. Where a route genuinely needed a capability, the capability was rewritten
as original Hanzo code in the normal tree — never by copying upstream's file to a
new path.

### What went, and what replaced it

Everything under `features/` was upstream `ee/`, so `features/` is gone entirely:

| Cluster | Disposition |
|---|---|
| `features/ai` + `app/api/ai/*` | Deleted. OpenAI/Google vector-store chat over documents. |
| `features/workflows` + `app/api/workflows`, `app/api/workflow-entry` | Deleted. `WORKFLOW_LINK` now 404s in the viewer. |
| `features/conversations` + Q&A/FAQ routes and pages | Deleted. |
| `features/security/sso` + `app/api/auth/saml`, `app/api/scim`, `lib/jackson.ts` | Deleted. This was BoxyHQ SAML/SCIM; we authenticate against Hanzo IAM (hanzo.id) over OIDC natively. |
| `features/dataroom-invitations` | Deleted, with its modal and API routes. |
| `features/templates` | Deleted. AI-generated dataroom scaffolding. |
| `features/access-notifications` | Deleted. It emailed the owner when an allow/deny list blocked a visitor — the *enforcement* is untouched in `app/api/views*`, only the courtesy email is gone. |
| `features/conversions/python/docx-sanitizer.py` | Deleted. It was a sanitize-and-retry fallback after a failed DOCX conversion; the primary conversion path is unchanged and a failure now reports the failure. |
| `features/permissions` | **Rewritten.** See below. |
| `features/storage` | Already replaced by original `lib/storage/*` in the preceding commit. |

Five of those clusters (`ai`, `workflows`, `conversations`, `sso`,
`dataroomInvitations`) were gated by `lib/featureFlags`, which reads
`@vercel/edge-config`. When `EDGE_CONFIG` is unset — which is every non-Vercel
deployment we run — `getFeatureFlags` returns every flag `false`. That code
never executed for us. Those five flags have been removed from `BetaFeatures`
along with the code they gated; the remaining flags are untouched.

### The paywall

`lib/billing/legacy/` was upstream `ee/stripe` and `lib/billing/limits/` was
upstream `ee/limits` — Papermark's Stripe integration and plan-quota matrix.
Both are deleted, and with them the entire commercial surface they fed: the
upgrade modals and banners, `UpgradeButton`, `FeaturePreview`, the trial and
blocking modals, `PlanBadge`, `/settings/upgrade`, `/settings/billing`, and the
`/api/teams/[teamId]/billing/*` checkout, seat, pause and cancellation routes.

**Deleting a paywall we cannot sell is not a regression, it is the point.** So
these were removed rather than reimplemented. Every feature that used to sit
behind a tier — custom domains, watermarking, granular permissions, analytics
retention, webhooks, agreements, presets, data rooms themselves — is now
unconditionally available.

That cascaded through two hooks:

- `usePlan()` (`lib/swr/use-billing.ts`) used to return a dozen capability
  booleans (`isFree`, `isBusiness`, `isDataroomsPlus`, `isTrial`, `isPaused`, …).
  Those braided together two unrelated things: *which tier a team was
  provisioned on* and *what the team is allowed to do*. Without a paywall the
  second half does not exist, so the hook now returns only the plan tag itself.
  The tag is still real — it drives background-job concurrency in
  `lib/utils/trigger-utils` — but it is never a permission.
- `useLimits()` is gone outright, along with `/api/teams/[teamId]/limits`. Every
  `canAddDocuments` / `canAddLinks` / `canAddUsers` / `limits.datarooms` quota
  check went with it, client and server.

Subscription *pause* went the same way: it only existed to soft-lock a lapsed
subscriber, so the guards and the paused-variant email templates are gone.

### What was rewritten as original Hanzo code

Three things were load-bearing enough that deleting them would have broken the
product, so they were rewritten — not preserved, not copied:

- **Upload constraints** (`lib/utils/get-file-size-limits.ts`). The old version
  took `{ limits, isFree, isTrial }` and returned different ceilings per tier.
  It now exports a single `UPLOAD_LIMITS` object and
  `getFileSizeLimit(contentType)`, with env overrides. These are *operational*
  limits — what the conversion and storage pipeline can chew through — not
  commercial ones, so everyone gets the same ceiling. `pages/api/file/tus/` and
  `pages/api/file/tus-viewer/` still enforce a real per-type size cap; they just
  no longer consult a plan matrix. **Uploads must keep working, and do.**
- **Link permissions** (`components/links/link-sheet/permissions-sheet.tsx`).
  Upstream shipped 1,111 lines gating a permission tree behind `PlanEnum`. The
  replacement is a flat depth-annotated list with view/download switches and two
  honest states: either the link sees the whole data room (`onSave(null)`, the
  caller drops the permission group) or it sees exactly what is ticked. It talks
  to the same `/permission-groups` API, which was always in the normal tree.
  `ItemPermission` now has one definition, in `lib/types.ts`.
- **Visitor uploads** (`app/api/links/[id]/upload/route.ts`). Rewritten around a
  single `authorize()` helper so the dataroom-session check is stated once for
  both verbs. The notification debounce is simpler than upstream's: one
  idempotency key per (link, viewer) with a delayed trigger, instead of listing
  and cancelling already-scheduled runs.

There was also a duplicate link sheet — a `DataroomLinkSheet` in `ee/` beside the
AGPL `LinkSheet`. There is now exactly one, `components/links/link-sheet`, which
already handled `DATAROOM_LINK`.

### Rules for anyone extending this fork

1. Never reintroduce a directory or module that carries a licence other than the
   root AGPL-3.0. If upstream adds a feature under `ee/`, we do not take it.
2. Never gate a capability on `team.plan`. There is no paywall; the plan tag is
   descriptive, not authoritative.
3. When checking whether upstream code is present, follow renames
   (`git log --follow`, or join `git ls-tree -r` output by blob hash). Absence of
   a path is not absence of the code.
4. Do not touch `LICENSE`. Papermark's copyright line and the AGPL-3.0 body are
   upstream's and must stay byte-identical; the only edit is the removal of the
   `ee/` carve-out clause, which referenced directories that no longer exist.
