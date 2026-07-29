# True Savings v2 — implementation spec (analyst-reviewed, CTO-approved)

Rebuild assembly-tax.html to this spec before deploying to hanzo.ai/calculator.
Keep the existing visual system (tokens, mono numerals, light/dark). All copy
below is approved; keep fact/attested labels exactly as written.

## Hero
Title: "Hanzo True Savings" · sub: "Price the assembly tax."
Banner facts: **100+ capabilities · 400+ models · one identity plane · one API · one operating platform.**
Line: "This is not a TAM calculator. It models operating expenses a company can
eliminate, reduce, or reclaim. Every assumption is visible and editable."

## Reference deployment (case study zero)
"Hanzo runs on Hanzo": fully off GCP · Hanzo-managed infra · AI/cloud/identity/
o11y/deploy/storage/business-ops native · operates its ATS, broker-dealer,
transfer-agent stack natively · eligible AI routed through Enso + self-hosted Zen ·
**107 vendor/managed-service dependencies consolidated into one plane** ·
~90% lower compute + eligible-inference costs in selected workloads.
Label: **founder-attested; measured evidence pack in progress.**

## Two-axis grading (replaces single coverage chip)
Coverage (weight): Full 100% · Partial 50% · Experimental 25% · Roadmap 0%.
Evidence (separate chip, no weight effect): Verified · Internal production ·
Management-attested · Repository-verified · Unverified.
Copy: "A service can have full coverage while still management-attested.
Separating the axes prevents an attestation from being presented as verification."

## Inputs (add to existing sliders)
Retained vendor spending ($/yr) · Hanzo managed/support fee ($/yr) ·
One-time migration cost ($, amortized over editable years, default 3) ·
all default 0 = "not included until entered."

## Four result tiers (replace single hero number)
1. **Gross addressable savings** (software + infra + glue, before deductions)
2. **Annual run-rate savings** (gross − Hanzo operating labor) — headline
3. **Fully adjusted annual savings** (run-rate − retained vendors − Hanzo fees − amortized migration) — shows "customer input required" until entered
4. **Three-year economic value** (fully adjusted × 3 w/ ramp)
Defaults at E=100/30%/$15k: software $613k · infra $108k · glue $330k · ops −$110k
→ gross $1.051M · **run-rate $941k** · per-employee $9,410 · 3-yr $2.82M · 4.3 engineers.
Formula printed on page. Note: "Do not present $941k as fully net until the
final three deductions are entered."

## Category table — 42 rows, defaults per analyst (annual)
SSO $10k · Customer identity $14k · Secrets/KMS $11k · Observability $54k ·
Errors $9k · Flags $7k · Product analytics $15k · CDP $22k · Git $8k · CI/CD $18k ·
Registry $4k · PaaS $13k · BaaS $15k · Queues $10k · AI gateway $12k ·
Automation $12k · Billing $18k · Commerce $24k · E-sign $2k · Cap table $5k ·
Data rooms $6k · Referrals $9k · Experiments $12k · Zero-trust $7k · Search $12k ·
**Vector $8k ×50% (measured defect — evidence chip: Verified-gap)** ·
Compliance $18k · CRM $27k · Marketing $10k · Projects $14k · Knowledge $12k ·
Support $11k · Notify $7k · Incident $11k · Finance ops $6k · Design $16k
(Hanzo Studio) · Video/calendar $18k (Hanzo Team) · Office/drive $14k ·
HR/payroll $48k · Payment orchestration $12k (markup only, never interchange) ·
ERP/CMS $20k · **LLM inference $36k — with sub-calculator.**
Keep vendor wall (~106 chips) driving rows; counter counts vendors.

## AI sub-calculator (expandable under the LLM row)
Inputs: current monthly AI spend · % routable · % self-hostable · Enso routing
saving % · Zen inference cost · frontier retained % · eval/fallback overhead ·
GPU utilization · batch/interactive mix.
Approved wording: "Hanzo's current deployment reports reductions approaching 90%
for selected workloads routed to lower-cost or self-hosted models. Enter your own
eligible workload percentage rather than applying 90% to the entire AI bill."
"400+ models, but model count is not the economic claim — the control plane is."

## Infrastructure delta
Keep 60% slider as simplified default, labeled "user-controlled assumption, not
a universal benchmark." Optional detailed inputs: provider · compute · GPU ·
DB · storage · egress · o11y · support · commitments · target Hanzo cost ·
migration overlap. Egress anchor: DO $0.01/GiB vs AWS example $0.09/GB —
"supports egress comparison; does not prove 60% for every workload."

## Glue section copy
List the 15 seam types (auth bridges, webhooks, sync, reconciliation,
entitlements, audit exports, pipelines, vendor o11y, incident routing, schema
transforms, secret rotation, API migrations, identity lifecycle, model fallbacks,
security reviews). Keep 1.5 FTE default × $220k − 0.5 FTE ops.
Approved line: "Do not say Hanzo eliminates engineering. Hanzo redirects it from
vendor seams to product."

## "Not just the bill — the build"
Anchors: Auth0 acquired ~$6.5B · Datadog ~$1.55B 2025 R&D · Zapier 800+ people,
9,000+ integrations. "These are not additive valuations; they show each category
is a substantial engineering domain." Replacement-cost report: **"under analysis"**
(never a number until the report lands). REMOVE "adoption cost $0" — replace with
migration-cost inputs above.

## Exclusions (keep)
Interchange/network fees · frontier pass-through (unless routed/distilled/hosted) ·
deep verticals (clinical, CAD, EDA, airline ops, industrial control, scientific
instruments, jurisdiction-specific record systems) · migration coexistence ·
retained vendors (every row independently deselectable — already true).

## Market context (updated citations — use these, retire old ones)
Okta 2026: avg 98 apps · 259 @2k+ employees · 72 below.
Zylo 2026 SMI: median $9,455 SaaS spend/employee · 36% licenses unused.
Positioning: "The $613k default = $6,130/employee — below Zylo's enterprise-skewed
median. The model is conservative relative to benchmark." Never imply all SaaS
spend is recoverable.

## Second-order benefits — list, unpriced
SSO premiums · per-vendor security reviews · DPAs · procurement cycles · duplicate
o11y · license reclamation · credential sprawl · integration attack surface ·
onboarding speed · unified policy · common metering · model portability · lock-in ·
air-gapped deploys · incident speed · fewer failure domains.
"Material, but outside the headline until a defensible measurement exists."

## Trust statement (verbatim, near results)
"Hanzo True Savings is an interactive operating-cost model, not a quote,
guarantee, audit, or promise of results. Default prices are editable estimates
based on representative technology stacks. Actual savings depend on existing
contracts, usage, architecture, migration requirements, retained vendors,
staffing, workload eligibility, and Hanzo deployment choices. Hanzo's internal
case-study figures are management-attested unless explicitly marked
independently verified."

## Closing block
"Replace the stack, not the capability." · 100+ capabilities · 400+ models ·
one identity · one API · one platform · self-host or managed.
CTA: "Select your current stack and price the assembly tax."
