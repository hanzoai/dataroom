# Hanzo AI — Regulation Crowdfunding Investor Memo

> ## ⚠ DRAFT — REQUIRES SECURITIES COUNSEL REVIEW
>
> **This document is a working draft prepared for internal review. It is not an offer to sell
> or a solicitation of an offer to buy securities. No offering has commenced. Any Regulation
> Crowdfunding offering may be made only through a registered funding portal or broker-dealer,
> pursuant to a filed Form C, and only on the terms of that Form C — which control over
> anything written here. Forward-looking statements in Section 6 are projections, not
> promises, and are unlikely to be achieved as stated. Nothing here has been reviewed by
> counsel, an auditor, or the SEC. Do not distribute externally in this form.**

---

## Evidence labels

Every figure in this memo carries one of four tags. The discipline is the point: a reader
should be able to sort the checkable from the attested from the modeled in one pass.

| Tag | Meaning |
|---|---|
| **[F] FACT** | Measured directly this session against the working tree or live systems. Reproduction command given where one exists. |
| **[A] ATTESTED** | Supplied by the founder. Not independently verified in this document. Substantiation required before external use. |
| **[E] ESTIMATE** | A modeling assumption. The driver and the arithmetic are shown so the reader can re-run it with their own inputs. |
| **[CITE]** | A citation is required here and is **not** present. Do not publish this line until it is filled. |

An unlabeled number in this memo is a bug. Report it.

---

## 1. Thesis

Hanzo AI is an **open-source AI cloud and Business OS**: one binary that supplies the
identity, billing, commerce, observability, inference, agents, and back-office surface a
company otherwise assembles from two hundred vendors. The wager is that the marginal cost of
*running a company* is collapsing toward the cost of running software, and that whoever owns
the substrate — open, self-hostable, one protocol end to end — becomes the layer on which the
next generation of very small, very large companies is built. The founder is the existence
proof, not a metaphor for one: **4,973 repositories across 186 GitHub organizations, ~104
services in a single Go binary, operated by one engineer** [F], serving ~2M visitors per month
with zero paid marketing [A]. The company runs entirely on its own stack [F]. We are not
asking investors to believe a one-person billion-dollar company is possible; we are asking
them to fund the productization of the one that already exists.

---

## 2. Traction

### 2.1 Verified this session [F]

Each of these was measured against the working tree or the authenticated GitHub API during
the preparation of this memo.

| Metric | Value | How to reproduce |
|---:|---|---|
| Repositories | **4,973** | `gh api user/orgs --paginate`, then per-org `public_repos + total_private_repos`; excludes the self-hosted forge at git.hanzo.ai |
| GitHub organizations | **186** | same |
| Engineers | **1** | founder/CTO |
| Services in one binary | **~104** | composition root enumeration |
| Plugin host package links | **316** (vs 3,105 monolithic) | `go list -deps` |
| Host binary size | **19 MB** | `ls -l` on the built host |
| RSS, all apps mounted | **14 MB** | `/proc/<pid>/status` |
| Cold plugin start | **123 ms** | benchmark |
| Warm plugin start | **4–7 ms** | benchmark |
| gRPC packages | **65 → 0** | `go list -deps ./cmd/cloud \| grep -c google.golang.org/grpc` |
| Per-service binary packages | **3,253 → 652** | `go list -deps ./cmd/wallets \| wc -l` |
| ZAP wire decode | **0 allocs/op**, 3.2× faster than the JSON path it replaced (82 ns/1 alloc → 26 ns/0 alloc) | published benchmark, `zip` repo |
| Generated OpenAPI paths | **959**, emitted from the live registry, drift-gated in CI | `GET /.well-known/openapi.json` |
| Projections from one registry | **5** — REST, OpenAPI, MCP, CLI, SDK | one typed handler, five outputs |
| Business-app repos present locally | `team` 10,644 tracked files · `erp` 4,378 · `studio` 876 | `git ls-files \| wc -l` |

**Correction of record, disclosed deliberately.** The repository count was published wrong
three times before it was right — 548 (one personal account), then 973 (a guessed list of
twelve orgs), before the authenticated measurement produced 4,973. Both earlier figures used
unauthenticated endpoints that return only *public* org membership. We disclose the error
because the correction is the credential: the number is now reproducible by a stranger with
the right token, and the method is published. [F]

> **Note on one figure that drifted.** Prior material describes the `studio` repo as
> "813-file." Measured this session it is **876 git-tracked files** [F]. The discrepancy is
> almost certainly a different counting method (working tree vs index, or a different commit).
> It is flagged rather than silently corrected. Any external material should use 876 with the
> command shown.

### 2.2 Founder-attested [A]

These are stronger than anything in §2.1 and are, today, entirely unciteable by a third party.
Converting each into a document is the highest-leverage pre-offering work available. **None of
these may appear in an offering document until substantiated.**

| Claim | Substantiation required |
|---|---|
| **$8M topline revenue in 2022** | Historical, agency-era. Tax returns / financial statements. Note: Form C requires financial statements per SEC rules — those govern and will supersede this line. [CITE: 17 CFR 227.201(t) financial statement tier by offering size] |
| **Multiple unicorns built on Hanzo**; case studies exist on hanzo.agency and in Drive | Named logos with written permission, or the claim reduces to "100+ funded companies" with the same problem. Three named case studies + one quotable customer. |
| **~2M visitors/month, zero paid marketing** | Cloudflare analytics export, ideally a read-only shared dashboard. This is the single most important number to make verifiable — it is the entire self-serve driver in §6. |
| **Largest Claude token consumer last year; hanzo.ai synthetic dev ranked #2** | **Written attestation from Anthropic.** This is the strongest AI-native proof available and the only one a third party can confirm outright. Recommend pursuing it before anything else. Until obtained, it is a claim about another company's internal data and must not be published. |
| **enso router saves ~90% on LLM spend** | A published benchmark with a fixed workload, both cost paths shown. Currently a ratio with no denominator. |
| **~90% compute reduction running Hanzo on Hanzo** | Before/after cloud invoices, redacted. Sits at the center of §4 and is worth the effort to document. |
| **1B+ end users touched across career; Triller ($4.5B peak, 100M+ users; Trillerfest ~100M weekend reach)** | Founder biography, not company traction. Belongs in the Form C bio with dates and roles, sourced to public record. [CITE: Triller valuation and user figures — public filings or reputable press] |
| **hanzo.team / studio / erp / HR / payroll run natively** | `team`, `studio`, `erp` verified present locally [F]. **`hr` and `payroll` do not exist as standalone repos on this machine** — they are presumably modules inside `erp` or `base`, but that was not confirmed. Do not claim them as separate products until located. |
| **Techstars '17** | Public record; easily citable. Use it. |

### 2.3 What this memo does **not** assert

Current ARR, current cash, current customer count, and current burn are **not stated in this
document** because no verified figure was available when it was written. The 2022 $8M is
historical and agency-era. A reader should assume revenue today is de minimis until the Form C
financials say otherwise. The proforma in §6 therefore starts from **zero backlog and zero
signed contracts** — every dollar in it must be won.

---

## 3. Market — the assembly tax

### 3.1 The observation

The average company no longer buys software; it *assembles* a company out of software, and
pays a recurring tax on the seams. Widely reported portfolio sizes:

| Source | Figure |
|---|---|
| Okta, *Businesses at Work* | ~93 apps average; **211 average at 2,000+ employees** |
| Productiv, *State of SaaS* | **254 average** |
| Zylo, *SaaS Management Index* | **~270 average** (enterprise-skewed base); **~$4,800 SaaS spend per employee per year**; **~44% of licenses unused** |
| Gartner | waste ~25% of SaaS spend |

**[CITE] — all four rows.** These are the figures as commonly cited; web verification tooling
was unavailable when this memo was written. **Verify against the current published editions,
with edition year and page, before any external use.** Do not publish this table with the
citation placeholders intact.

### 3.2 Sizing it bottom-up

Rather than assert a top-down TAM, we price the replaceable surface directly. The Hanzo True
Savings model enumerates **42 categories** with public list prices parameterized on headcount.
Recomputed from the model's own coefficients this session [F]:

**Auditor mode — 100 employees, 30% engineers, $15k/mo cloud, 1.5 glue FTEs, 0.5 ops FTEs:**

```
Replaced SaaS (42 categories, weighted)      $614,600/yr    = $6,146/employee/yr
Infra delta (DO-class vs hyperscaler, 60%)   $108,000/yr
Glue engineering reclaimed (1.5 × $220k)     $330,000/yr
Cost of operating Hanzo (0.5 × $220k)       −$110,000/yr
                                            ─────────────
Net annual savings                           $942,600/yr    = $9,426/employee/yr
```

The per-employee SaaS figure of **$6,146** lands ~28% above the Zylo **~$4,800** benchmark —
a useful cross-check: the model is in the right order of magnitude and errs slightly rich
relative to the published anchor. [E]

**Auditor vs Founder mode.** Regrading every category to "full" moves the total from
**$614,600 to $618,800** — a **$4,200** gap, because only one of 42 rows (vector store) is
still graded partial. Stated plainly: *the parity roadmap is one row wide, by founder
grading.* The grading itself is **[A]**, not measured; a skeptical buyer should re-grade the
table themselves, which the interactive model permits.

### 3.3 A weakness in the model, disclosed

**The model's absolute price floors dominate at small headcount and overstate seed-stage
spend.** Recomputed [F]:

| Company size | Model SaaS/yr | Implied $/employee | vs $4,800 benchmark |
|---:|---:|---:|---:|
| 15 employees | $301,118 | **$20,075** | 4.2× — *not credible* |
| 25 employees | $329,000 | $13,160 | 2.7× — *rich* |
| 60 employees | $458,740 | $7,646 | 1.6× — *plausible* |
| 100 employees | $614,600 | $6,146 | 1.3× — *plausible* |

Roughly fifteen of the 42 categories carry minimums that do not scale down, so the model is
sound for the 60+ cohort and unusable below ~40 employees. **We therefore do not use it to
derive the Techstars ACV in §6** — that is derived from the per-employee benchmark instead.
This is disclosed because the seed-stage cohort is precisely the one the proforma targets, and
a diligence reader would find it.

### 3.4 The build, not just the bill

Everything above prices what a company stops *paying*. It ignores what it would cost to
*build* this surface — and the market has priced fragments of that: identity (Auth0, acquired
for $6.5B [CITE]), observability (Datadog R&D >$1B/yr [CITE]), flags (LaunchDarkly, ~$200M
raised [CITE]), workflow (Zapier, 800+ people [CITE]). A rigorous COCOMO-based replacement-cost
study of the full 4,973-repository estate is **in progress and not yet complete** — no headline
figure from it is quoted here, and none should be quoted until the report lands. Expectation,
labeled as expectation: engineer-centuries. [E]

---

## 4. Product — one binary, one protocol, five projections

**One binary.** ~104 services compose into a single Go host. The new lazy-plugin architecture
links **316 packages against 3,105** for the monolithic build, ships a **19 MB** binary, holds
**14 MB RSS** with every app mounted, and starts a plugin cold in **123 ms** / warm in
**4–7 ms**. A plugin can panic without taking a route down; a failed build cannot. Each of
these is pinned by a test passing under `-race`, not asserted in a README. [F]

**One protocol.** ZAP is the wire format: length-prefixed name/value header pairs, every name
and value a subslice of the frame, decoding in **0 allocations/op** — **3.2× faster** than the
JSON path it replaced. gRPC was taken from **65 packages to 0**; the two roots were the Gemini
SDK (sole importer of `cloud.google.com/go/auth`, which dragged gax-go and all 13 s2a-go
packages) and an OTLP exporter whose *HTTP* variant imported gRPC internally — a finding many
Go teams share and few have noticed. [F]

**Five projections.** One typed handler emits the REST route, the OpenAPI path, the MCP tool,
the CLI command, and the SDK client. Doc comments are lifted into the spec at build time, so
the reference cannot drift from the code. The live registry currently generates **959 OpenAPI
paths**, and CI fails on drift. For an AI-native buyer this is the load-bearing feature: every
service is an agent tool the day it ships, with no hand-written tool definitions to rot. [F]

**Case study zero — Hanzo runs on Hanzo.** The company operates fully on its own stack, off
GCP, on DigitalOcean [F]. The ATS/BD/TA and business-ops suite were replaced natively;
compute costs were cut **~90%** and vendor headcount to zero [A]. The deployment being sold is
the deployment that exists. This is the only case study in the memo, and it is the founder's
own — which is a limitation, and is stated as one.

---

## 5. Business model

Four revenue mechanics, in order of expected contribution:

1. **Cloud usage.** Metered compute, inference, and storage on Hanzo-operated infrastructure.
   Margin structure benefits from the same ~90% compute reduction the company runs on itself
   [A] and from DO-class rather than hyperscaler pricing [F].
2. **Seats.** Per-user pricing on the Business OS surface — team, studio, erp, and the
   back-office apps. Bundled with usage in the proforma as a single ARPU per paid account.
3. **Marketplace revenue share.** Third-party connectors, models, templates, and agents
   transacted through the platform's billing rails, at a take rate.
4. **Dependency dividends — the kingmaker mechanic.** The platform knows, from the dependency
   graph, which open-source projects its revenue actually rests on. A defined share of the
   marketplace take is routed back to those maintainers through the same billing rails. This
   is the strategic core, not a CSR line: it converts the OSS commons from a cost center into
   a distribution channel, makes Hanzo the party that *pays* the ecosystem it depends on, and
   gives every maintainer a direct commercial reason to keep Hanzo working. Hattori Hanzō did
   not win the battle; he got the man who did out of Iga alive.

> ### ⚠ Counsel flag — the word "dividends"
> "Dependency dividends" describes a **commercial revenue-share paid to software maintainers
> for goods and services**. It is *not* a distribution on equity and *not* a payment to
> security holders. In a Regulation Crowdfunding document the term is capable of being read
> as an implied return to investors, which would be a material problem. **Counsel must either
> approve the term with a definition attached or rename the program.** Flagged, not resolved.

**Pricing posture.** Hanzo is priced at roughly **30–40% of the assembled alternative** [E].
The savings *are* the pitch; capturing more than that inverts the value proposition. This
ratio is what converts §3's assembled-cost figures into the ACVs used in §6.

---

## 6. Proforma, FY2026–FY2030

### 6.0 How to read this

- **Y1 = the first twelve months after offering close.** The "2026" label is nominal; the
  offering has not closed, and this memo is written mid-2026. Do not read Y1 as a
  calendar-year forecast.
- Only **three drivers** produce revenue: Techstars network capture, visitor conversion, and
  marketplace take. **No enterprise motion outside the Techstars network is modeled at all**,
  in any scenario. That omission is deliberate and it is conservative in all three cases.
- Every line shows its arithmetic. There is no line in this model whose growth is not the
  product of a named, adjustable input.
- **Rounding convention:** each intermediate is rounded to a whole unit (accounts, people) or
  to $0.01M before feeding the next line, so a reader reproducing the model with a calculator
  from the displayed figures gets the displayed answers. Visitor counts are shown to three
  decimals for the same reason. Occasional $0.01M residuals are rounding, not error.
- **All three scenarios are [E].** The scenario labels describe assumption aggressiveness,
  not likelihood. No probability weighting is offered, because we have none to offer.

### 6.1 Driver definitions

**Driver A — Techstars network capture.**

- Serviceable population: **~2,500 active Techstars portfolio companies** [E] — [CITE:
  Techstars publishes cumulative companies accelerated; the *active* subset is an estimate and
  must be sourced or replaced with the cumulative figure and a stated survival rate].
- Access: founder is a **Techstars '17 alum** [A, easily verifiable] — warm intro path, not
  cold outbound. This is why the model uses a named network rather than a generic TAM slice.
- **ACV derivation** (not taken from the §3 model, per §3.3):
  - Seed cohort (~15 people): 15 × $6,146/employee + ~$22k infra ≈ **$114k assembled**;
    at 40% → **~$46k**.
  - Growth cohort (~60 people): $458,740 SaaS + $72k infra ≈ **$531k assembled**;
    at 30% → **~$159k**.
  - Band used: **$50k (conservative) / $90k (base) / $150k (founder)**. The smallest cohort
    sits slightly *below* the $50k floor, which is one reason capture rates stay low in Y1–Y2.

**Driver B — Visitor conversion.**

`monthly visitors × signup% × signup→paid% × 12 = gross paid adds/yr`, then a cumulative base
with annual churn, revenue on the **average** base (opening + closing ÷ 2).

**Driver C — Marketplace take.**

`(network accounts + average self-serve base) × GMV per account × take rate = gross take`,
then **50% of the gross take is paid out as dependency dividends** in every scenario. The
proforma books only the **net**.

### 6.2 Assumption table

| Input | Conservative | Base | Founder |
|---|---:|---:|---:|
| Techstars population | 2,500 | 2,500 | 2,500 |
| Capture % Y1→Y5 | 0.4 / 1.2 / 2.4 / 4.0 / 6.0 | 0.8 / 2.4 / 5.0 / 8.0 / 12.0 | 1.6 / 4.8 / 9.6 / 16.0 / 24.0 |
| ACV per captured company | $50,000 | $90,000 | $150,000 |
| Monthly visitors Y1 | 2,000,000 | 2,000,000 | 2,000,000 |
| Visitor growth / yr | 0% | 10% | 25% |
| Visitor → signup | 0.05% | 0.15% | 0.30% |
| Signup → paid | 2% | 3% | 5% |
| Annual churn | 30% | 25% | 20% |
| ARPU / paid account / yr | $1,800 ($150/mo) | $2,400 ($200/mo) | $3,600 ($300/mo) |
| Marketplace GMV / account / yr | $1,200 | $3,600 | $9,600 |
| Take rate | 10% | 15% | 20% |
| Dependency dividend (of take) | 50% | 50% | 50% |
| Fully loaded cost / head | $220,000 | $220,000 | $220,000 |
| COGS (% revenue) | 20% | 20% | 20% |
| S&M (% revenue) | 10% | 10% | 10% |

### 6.3 Conservative — $8.69M revenue in Y5

*Flat traffic. Bottom-of-band ACV. 6% of the network after five years.*

| $M | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---:|---:|---:|---:|---:|
| Network companies (count) | 10 | 30 | 60 | 100 | 150 |
| **Network revenue** (count × $50k) | 0.50 | 1.50 | 3.00 | 5.00 | 7.50 |
| Paid adds/yr (2.0M × 0.05% × 2% × 12) | 240 | 240 | 240 | 240 | 240 |
| Paid base, closing | 240 | 408 | 526 | 608 | 666 |
| Paid base, average | 120 | 324 | 467 | 567 | 637 |
| **Self-serve revenue** (avg × $1,800) | 0.22 | 0.58 | 0.84 | 1.02 | 1.15 |
| Marketplace GMV | 0.16 | 0.43 | 0.63 | 0.80 | 0.94 |
| Gross take (10%) | 0.02 | 0.04 | 0.06 | 0.08 | 0.09 |
| *Dependency dividends paid out* | *0.01* | *0.02* | *0.03* | *0.04* | *0.05* |
| **Marketplace revenue, net** | 0.01 | 0.02 | 0.03 | 0.04 | 0.05 |
| **TOTAL REVENUE** | **0.72** | **2.10** | **3.87** | **6.06** | **8.69** |
| Headcount | 3 | 6 | 10 | 14 | 18 |
| People ($220k each) | 0.66 | 1.32 | 2.20 | 3.08 | 3.96 |
| COGS (20%) | 0.14 | 0.42 | 0.77 | 1.21 | 1.74 |
| S&M (10%) | 0.07 | 0.21 | 0.39 | 0.61 | 0.87 |
| G&A incl. SOC 2 + audit + legal | 0.35 | 0.55 | 0.65 | 0.70 | 0.80 |
| **Total opex** | **1.22** | **2.50** | **4.01** | **5.60** | **7.37** |
| **EBITDA** | −0.50 | −0.40 | −0.14 | +0.46 | **+1.32** |

**5-yr cumulative revenue $21.46M. Peak cumulative burn ~$1.04M, crossing to profit in Y4.**
A $5M raise covers this scenario roughly **5×** — which is the single most useful fact in the
proforma. The downside case is *funded*, not merely survivable.

### 6.4 Base — $37.47M revenue in Y5

*10%/yr traffic growth. Mid-band ACV. 12% of the network by Y5.*

| $M | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---:|---:|---:|---:|---:|
| Network companies (count) | 20 | 60 | 125 | 200 | 300 |
| **Network revenue** (count × $90k) | 1.80 | 5.40 | 11.25 | 18.00 | 27.00 |
| Monthly visitors (M) | 2.000 | 2.200 | 2.420 | 2.662 | 2.928 |
| Paid adds/yr (visitors × 0.15% × 3% × 12) | 1,080 | 1,188 | 1,307 | 1,437 | 1,581 |
| Paid base, closing | 1,080 | 1,998 | 2,806 | 3,542 | 4,238 |
| Paid base, average | 540 | 1,539 | 2,402 | 3,174 | 3,890 |
| **Self-serve revenue** (avg × $2,400) | 1.30 | 3.69 | 5.76 | 7.62 | 9.34 |
| Marketplace GMV | 2.02 | 5.76 | 9.10 | 12.15 | 15.08 |
| Gross take (15%) | 0.30 | 0.86 | 1.37 | 1.82 | 2.26 |
| *Dependency dividends paid out* | *0.15* | *0.43* | *0.68* | *0.91* | *1.13* |
| **Marketplace revenue, net** | 0.15 | 0.43 | 0.68 | 0.91 | 1.13 |
| **TOTAL REVENUE** | **3.25** | **9.53** | **17.70** | **26.53** | **37.47** |
| Headcount | 4 | 10 | 20 | 32 | 45 |
| People ($220k each) | 0.88 | 2.20 | 4.40 | 7.04 | 9.90 |
| COGS (20%) | 0.65 | 1.91 | 3.54 | 5.31 | 7.49 |
| S&M (10%) | 0.32 | 0.95 | 1.77 | 2.65 | 3.75 |
| G&A incl. SOC 2 + audit + legal | 0.35 | 0.60 | 0.75 | 0.90 | 1.10 |
| **Total opex** | **2.20** | **5.66** | **10.46** | **15.90** | **22.24** |
| **EBITDA** | +1.04 | +3.87 | +7.24 | +10.63 | **+15.23** |

**5-yr cumulative revenue $94.47M. EBITDA-positive from Y1.** The base case does not require
the raise to reach profitability — the raise buys the *speed* and the compliance surface
described in §7, not survival. State that plainly to investors; it is unusual and it is true
of the model as built.

### 6.5 Founder — $177.32M revenue in Y5

*25%/yr traffic growth. Top-of-band ACV. 24% of the Techstars network by Y5.*

| $M | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---:|---:|---:|---:|---:|
| Network companies (count) | 40 | 120 | 240 | 400 | 600 |
| **Network revenue** (count × $150k) | 6.00 | 18.00 | 36.00 | 60.00 | 90.00 |
| Monthly visitors (M) | 2.000 | 2.500 | 3.125 | 3.906 | 4.883 |
| Paid adds/yr (visitors × 0.30% × 5% × 12) | 3,600 | 4,500 | 5,625 | 7,031 | 8,789 |
| Paid base, closing | 3,600 | 7,380 | 11,529 | 16,254 | 21,792 |
| Paid base, average | 1,800 | 5,490 | 9,455 | 13,892 | 19,023 |
| **Self-serve revenue** (avg × $3,600) | 6.48 | 19.76 | 34.04 | 50.01 | 68.48 |
| Marketplace GMV | 17.66 | 53.86 | 93.07 | 137.20 | 188.38 |
| Gross take (20%) | 3.53 | 10.77 | 18.61 | 27.44 | 37.68 |
| *Dependency dividends paid out* | *1.77* | *5.39* | *9.31* | *13.72* | *18.84* |
| **Marketplace revenue, net** | 1.77 | 5.39 | 9.31 | 13.72 | 18.84 |
| **TOTAL REVENUE** | **14.25** | **43.15** | **79.35** | **123.73** | **177.32** |
| Headcount | 6 | 18 | 40 | 70 | 100 |
| People ($220k each) | 1.32 | 3.96 | 8.80 | 15.40 | 22.00 |
| COGS (20%) | 2.85 | 8.63 | 15.87 | 24.75 | 35.46 |
| S&M (10%) | 1.43 | 4.32 | 7.94 | 12.37 | 17.73 |
| G&A incl. SOC 2 + audit + legal | 0.40 | 0.90 | 1.50 | 2.20 | 3.00 |
| **Total opex** | **5.99** | **17.81** | **34.10** | **54.72** | **78.20** |
| **EBITDA** | +8.25 | +25.35 | +45.24 | +69.01 | **+99.13** |

**5-yr cumulative revenue $437.79M.**

**Read this case skeptically, and here is the specific place to push.** It requires capturing
**24% of the entire Techstars active portfolio** — 600 companies — on a warm-intro motion with
a headcount of 100. It also requires the self-serve funnel to convert at **6× the conservative
rate** (0.30% × 5% vs 0.05% × 2%), on a signup flow that **does not currently work at scale**
(§8.2). It is included because the drivers are stated and a reader can dial them; it is not a
plan of record.

### 6.6 Scenario summary

| | Conservative | Base | Founder |
|---|---:|---:|---:|
| **Y5 revenue** | **$8.69M** | **$37.47M** | **$177.32M** |
| Y5 EBITDA | $1.32M | $15.23M | $99.13M |
| 5-yr cumulative revenue | $21.46M | $94.47M | $437.79M |
| Y5 network companies | 150 (6%) | 300 (12%) | 600 (24%) |
| Y5 paid self-serve accounts | 666 | 4,238 | 21,792 |
| Y5 headcount | 18 | 45 | 100 |
| Peak cumulative burn | $1.04M | none (Y1+) | none (Y1+) |
| **5-yr dependency dividends to OSS maintainers** | **$0.15M** | **$3.31M** | **$49.02M** |

That last row is the one to lead with in the community round. In the base case the company
routes **$3.3M to open-source maintainers over five years** as a contractual consequence of
its own revenue — not a grant program, a billing rail.

---

## 7. Use of funds — $5,000,000

$5,000,000 is the Regulation Crowdfunding maximum for a 12-month period. **[CITE: 17 CFR
227.100(a)(1); the cap is periodically inflation-adjusted — counsel must confirm the figure in
effect at filing.]**

| Use | Amount | % | Rationale |
|---|---:|---:|---|
| **Auth & self-service completion** | $900,000 | 18% | The gating item. Driver B in §6 produces **zero** revenue until signup → provision → bill works unattended. Nothing else in this memo matters if this does not ship first. |
| **GPU fleet** | $1,400,000 | 28% | Owned inference capacity. Converts the largest COGS line into a capex-amortized one and is what makes the ~90% cost posture durable rather than a routing trick. |
| **First devrel + support hires** | $1,300,000 | 26% | 4 people over ~18 months. 2M monthly visitors with no one to answer them is the clearest waste in the business today. |
| **SOC 2 Type II + HIPAA readiness** | $650,000 | 13% | Audit fees, tooling, and remediation. Unlocks the regulated-startup buyer, for whom compliance is the largest pre-revenue cost — and turns a §2.2 aspiration into an auditor letter. |
| **Reg CF offering costs** | $350,000 | 7% | Portal fees, escrow, securities counsel, audited/reviewed financials for Form C. Disclosed as a line rather than buried. |
| **Working capital / reserve** | $400,000 | 8% | ~4 months of conservative-case opex at Y2 run rate. |
| **Total** | **$5,000,000** | **100%** | |

Against the conservative case, this raise is **~5× peak cumulative burn** ($1.04M). The
company is not raising to reach breakeven; it is raising to compress the years in which it is
small.

---

## 8. Risks

Stated at the level of detail a diligence reader would reach on their own, because they will.

**8.1 Key-person risk is the dominant risk, and it is severe.** One engineer operates 4,973
repositories and ~104 services [F]. There is no bus factor. If the founder is unavailable, the
company's ability to ship, support, and secure the platform degrades immediately and
materially. *Partial* mitigations: the architecture is deliberately survivable at this
headcount — one wire protocol, one registry with five projections, one plugin model, agentic
maintenance running against the estate — and the discipline is why the surface exists at all,
not a stylistic preference. But an architecture is not a person. **Recommended and not yet in
place: key-person insurance, a documented successor/escrow arrangement, and at least one
additional engineer with commit rights across the core.** Investors should treat the first
devrel/support hires in §7 as partially a bus-factor purchase. This risk is not eliminated by
this raise.

**8.2 Auth and self-service are currently being repaired.** The self-serve funnel — Driver B,
which is 13% of conservative Y5 revenue and 39% of founder Y5 revenue — **does not work
unattended today**. Until it does, ~2M monthly visitors [A] convert at approximately zero. It
is the first line in the use of funds for that reason. Any scenario's self-serve column should
be read as contingent on that work landing.

**8.3 Competition from model labs adding platform features.** The frontier labs ship platform
surface — agents, tools, storage, evaluation — steadily, and they have unbounded capital.
Hanzo's defensible position is what they will not build: self-hostable, open-source, identity
+ billing + commerce + compliance + settlement, running on *any* model including theirs. That
framing is durable, but it is a bet that labs stay in the model business. If a lab ships a
credible open self-hostable Business OS, the thesis weakens sharply. **Related discipline: do
not position Hanzo as competing with frontier training. It invites an immediate, losing
comparison and discounts everything said after it.**

**8.4 Private-repository verification is pending.** Of 4,973 repositories, **2,172 are
private** [F]. A third party cannot today verify the private portion of the estate, nor the
~104-service composition, without read access or an independent attestation. Any investor
relying on the scale claim should ask for a scoped audit. The public portion (2,253 org +
548 personal) is verifiable now.

**8.5 The strongest claims are the least verified.** §2.2 is the persuasive material and none
of it is citable today. If the Anthropic token-ranking attestation cannot be obtained, or the
unicorn case studies cannot be published with permission, the story reverts to §2.1 —
excellent engineering evidence with no commercial proof attached. Investors should weight
accordingly and ask which of §2.2 has been documented since this draft.

**8.6 The proforma has no backlog.** Zero signed contracts, zero committed pipeline, no
current ARR asserted (§2.3). Every dollar in §6 is un-won. Customer concentration is
undefined because there is no customer set to concentrate.

**8.7 The Techstars driver is a single channel.** All of Driver A rests on one network and one
alumni relationship. No contractual arrangement with Techstars exists or is implied. The
network has no obligation to Hanzo, and the ~2,500 active-company figure is itself unsourced
(§6.1 [CITE]).

**8.8 Regulation Crowdfunding risks, non-exhaustive.** Illiquidity — no public market, and
resale is restricted for twelve months subject to exceptions. Dilution by future rounds. The
possibility of total loss. Reliance on the founder. Investment limits per investor based on
income and net worth. Ongoing annual reporting obligations on the company. **Counsel must
draft the definitive risk factors; this list is not sufficient for a Form C.**

---

## 9. The offer frame — users become owners

Regulation Crowdfunding is not a second-choice financing here; it is the structurally correct
one. Hanzo's users are self-hosting developers and founders who already run the software for
free. A community round makes the people who *depend* on the platform into the people who
*own* it — which is the same alignment the dependency-dividend mechanic creates one layer
down, where the maintainers Hanzo depends on are paid by Hanzo's own revenue. Owners above,
maintainers below, one billing rail through the middle. A user who becomes a shareholder and a
maintainer who becomes a payee are the two halves of the same idea: **the platform's success
should be indistinguishable from the ecosystem's.**

That is the frame. It is also exactly the kind of language that requires counsel, because it
runs close to describing an economic return.

> ### ⚠ Counsel flag — the offer frame
> Do not deploy any part of §9 externally before review. Specific exposures: (a)
> "dependency dividends" as a term (§5); (b) any implication that platform usage confers or
> influences ownership; (c) any implication of a return, yield, or distribution to investors;
> (d) general-solicitation and testing-the-waters rules — communications before the Form C is
> filed are constrained, and this memo, the derived HTML page, and any social content built
> from them are all communications. **[CITE: 17 CFR 227.204 advertising limits; 17 CFR
> 227.206 promoter compensation disclosure.]**

---

## Open items before this leaves the building

1. **Securities counsel review of the entire document** — nothing here has had it.
2. Fill every **[CITE]**: Okta / Productiv / Zylo / Gartner current editions; Techstars active
   portfolio count; Reg CF cap and advertising rules; Auth0, Datadog, LaunchDarkly, Zapier
   anchors; Triller public figures.
3. Obtain the **Anthropic written attestation** (§2.2). Highest single-item leverage in this memo.
4. Make **Cloudflare analytics** independently viewable — it is the whole of Driver B.
5. Publish the **enso ~90%** and **Hanzo-on-Hanzo ~90%** figures as benchmarks with denominators.
6. Land three **named case studies** with written permission.
7. Locate **`hr` / `payroll`** or stop claiming them as discrete products.
8. Finish the **COCOMO replacement-cost study**; quote no figure from it before it lands.
9. Put **key-person mitigations** in place (§8.1) — insurance, successor plan, second committer.
10. Reconcile the **studio 813 vs 876** file count and reissue any external material.

---

*Prepared as a working draft. Every figure carries a label; where a citation is required and
absent it is marked [CITE] rather than filled with something plausible. That is the house
style, and it is the only reason the labeled-fact column deserves any credence.*
