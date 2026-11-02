# Kisaan Chakshu

Kisaan Chakshu is an AI-assisted crop insurance claim screening and prioritization MVP for **Team 4 UNKNOWNS — Build for Bharat 2026**. It helps government/insurance officers process claims faster by automating the work between farmer submission and human review: checking policy eligibility, gathering evidence, grading the assessment, and preparing a prioritized queue with an explainable report.

The target is a **24-hour build by two developers**, using public weather data and entirely synthetic farmer and insurance records. The approach is an end-to-end vertical slice: make one claim work from submission through officer review before expanding features.

## Planning context and current status

This README consolidates the [shared planning conversation](https://chatgpt.com/share/6ae8516e-4084-83ec-a9dd-f38ff19f867c) and subsequent repository decisions. The latest direction supersedes the earlier 48-hour React/Vite and Python/FastAPI proposals: use **Next.js in `client/` and Node.js/Express in `server/`**, with TypeScript throughout.

**Implemented:** the directory structure, empty placeholder files, and project/agent documentation. Application code, package manifests, configuration, database schema, seeds, and integrations are still unimplemented. There are no working install, run, or test commands yet.

The six-stage workflow, synthetic insurance gate, team size, timeline, and application architecture are established direction. Detailed schemas, API payloads, scoring rules, providers, and screen designs remain subject to step-by-step approval. Recommendations below are planning baselines, not completed features or authorization to implement them.

## What we are building

Two interfaces share a separate Express REST API:

- **Farmer portal:** submit crop damage details and photo evidence, track a claim, see policy mismatches, and provide corrections.
- **Officer dashboard:** inspect policy exceptions, review a prioritized claim queue, examine supporting evidence and warnings, record a review, request more evidence, or request a field survey/escalation.

The output is a provisional grade, priority recommendation, and assessment report. Actual insurance approval, compensation calculations, and payouts are outside the MVP. The planning chat interpreted “reward” as a generated report/grade; a financial reward or payout module was not agreed.

## End-to-end workflow

```text
Farmer submits claim and photo
              ↓
Store claim → Insurance eligibility gate against synthetic policies
              ├── Not verified → Explain mismatch → Farmer correction / officer review
              └── Verified
                     ↓
           Independent evidence checks
           Ground: image observations
           Sky: weather corroboration
           Device: integrity checks
                     ↓
           Grading and priority ranking
                     ↓
           Automated assessment report
                     ↓
           Officer queue and manual review
                     ↓
           Saved action and updated farmer status
```

1. **Submission:** collect farmer/policy identifiers, crop, plot/land details, claimed peril, event date, damage photo, and location. Store the submission and return a claim ID.
2. **Insurance verification:** compare the submission with seeded policies. Only eligible, matching submissions may enter evidence processing. Return specific correction/review reasons when verification fails.
3. **Evidence processing:** run Ground, Sky, and Device checks independently and consolidate their results. Preserve missing, unavailable, and contradictory evidence explicitly.
4. **Grading:** create an explainable provisional priority that determines which claims officers should examine first.
5. **Report:** assemble claim details, policy results, evidence findings, priority reasons, and warnings. Policy exceptions can receive a mismatch summary without running the evidence engines.
6. **Human review:** show the sorted queue and evidence. Record officer actions and reflect them in farmer tracking. Final insurer decisions remain outside the system's automated scope.

**The server must enforce the insurance gate before invoking vision, weather, or integrity processing, including on retries. A failed or incomplete gate must not trigger those services.**

## Insurance verification and synthetic data

Policies and claims are separate concepts: a policy is a seeded coverage record; a claim is a farmer's submission against it. The latest 24-hour plan recommends **20 synthetic policies**, plus sample prior claims for duplicate detection.

Proposed checks compare policy ID, farmer identity, policy/premium status, crop, plot, season, coverage dates, claimed event date, and covered peril. Duplicate submissions are checked against the same policy, plot, and incident. Keep policy validity distinct from incident eligibility: an active policy may still exclude the reported event.

| Situation | Planned outcome | Evidence pipeline |
|---|---|---|
| Matching farmer, crop, plot, active coverage, eligible event | Verified | Continue |
| Missing policy or mismatched farmer/plot details | Correction or manual verification | Stop |
| Wrong crop, season, coverage dates, or uncovered peril | Explain coverage exception | Stop |
| Same incident already submitted | Flag duplicate / identify existing claim | Stop pending resolution |

A missing or mismatched record produces a correction or review state rather than an irreversible automated insurance rejection. Seeded identities and policies must be visibly fictional; no real Aadhaar, bank details, or insurer/government access is required.

The proposed lookup method is **Policy/Application ID + Demo Farmer ID**, with further field matching. The exact matching and correction rules still need design approval.

## Ground, Sky, and Device evidence

| Witness | Planned MVP behavior | Limits to preserve |
|---|---|---|
| Ground — `vision` | Hosted pretrained vision model describes visible crop damage, image suitability, and consistency with the claimed damage | Qualitative, provisional findings; no invented plot-loss percentage or claim of a trained segmentation model |
| Sky — `weather` | Query Open-Meteo for the claimed location/date; retain measurements, rule outcomes, source, and reasons | Weather corroborates a claim; it does not establish policy entitlement or prove plot-level damage |
| Device — `integrity` | Check available GPS, timestamps/event plausibility, and duplicate images using perceptual hashing | Device evidence is supporting information, not tamperproof proof; approximate plot checks are not official cadastral validation |

The initial recommendation is **paddy, flooding and lodging, and one demonstration region**. Crop/region selection and supported peril rules are not finalized. The chat proposed rainfall over a 72-hour window for flooding and wind/rain evidence for lodging. Any thresholds require explicit design and validation before being treated as reliable.

Record evidence provenance: source, assessment time, engine/model version, reasons, and whether results are measured, model-generated, or simulated. An unavailable API or unassessable image must leave the claim reviewable with incomplete evidence; do not manufacture substitute scores.

## Grading, reports, and review

The planning conversation separates two gates: the **insurance eligibility gate** controls entry to analysis, while an experimental **evidence authenticity gate** assesses the resulting evidence before priority ranking.

The presentation formulas discussed in the chat are retained as experimental reference:

```text
Authenticity: A = 0.70W + 0.30M
Priority:     P = 100 × (0.50V + 0.35W + 0.15M)
V = visual loss, W = weather consistency, M = device integrity
```

These are not approved production rules. Input normalization, thresholds, missing-data behavior, and calibration still need design. An uncalibrated vision observation cannot supply a validated visual-loss value. The 24-hour recommendation is an explainable provisional High/Medium/Low assessment when evidence supports it; otherwise route to review. Unknown inputs must not silently become zero.

The report should include policy-check outcomes, image observations, weather evidence, integrity flags, available priority reasoning, and missing-data warnings. HTML is the proposed initial report format; PDF export is optional.

The proposed officer views are policy exceptions, prioritized claims, and manual reviews/escalations. Candidate states include Submitted, Correction Required, Analyzing, Ready for Review, Needs Verification, Survey Requested, and Reviewed. These branch with outcomes; exact status names and transitions remain to be designed. Satellite escalation initially means a recorded workflow action, not completed satellite analysis.

## Technology direction

| Area | Direction |
|---|---|
| Client | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Server | Node.js + Express + TypeScript; feature-based modular monolith |
| Validation | Zod |
| Database / photo storage | Supabase PostgreSQL / Supabase Storage |
| Image analysis | Hosted vision API; specific provider/model to be selected |
| Weather | Open-Meteo; endpoint/date-window selection to be designed |
| Image integrity | Sharp + perceptual hashing proposed |
| Scoring / reports | TypeScript rules + generated HTML |
| Deployment | Vercel for the client proposed; Node.js host to be selected |

The Express server owns orchestration and external integrations. A separate Python service, Redis, Celery, or distributed microservices are not needed for the planned MVP. Credentials, access controls, upload limits, processing/retry behavior, and deployment configuration must be designed before their respective implementation steps.

## Project structure

```text
kisaan-chakshu/
├── client/
│   ├── public/
│   │   ├── images/
│   │   └── icons/
│   └── src/
│       ├── app/
│       │   ├── farmer/
│       │   │   ├── submit/
│       │   │   └── claims/[id]/
│       │   └── officer/
│       │       ├── dashboard/
│       │       └── claims/[id]/
│       ├── components/       # ui, farmer, officer, shared
│       ├── services/
│       ├── hooks/
│       ├── lib/
│       └── types/
├── server/
│   ├── database/             # schema.sql and synthetic-policy seed.ts
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── insurance/
│       ├── claim/
│       ├── verification/
│       ├── vision/
│       ├── weather/
│       ├── integrity/
│       ├── scoring/
│       ├── report/
│       ├── officer/
│       ├── config/
│       ├── middleware/
│       ├── utils/
│       └── types/
├── AGENTS.md
└── README.md
```


## Server responsibilities and module convention

```text
Route → Controller → Service → Database / External API
```

- `*.route.ts`: endpoints and controller mapping.
- `*.controller.ts`: HTTP request/response handling and validation errors.
- `*.service.ts`: business logic and database/external integrations.
- `*.schema.ts`: Zod input validation where needed.
- `*.types.ts`: feature interfaces and result types where needed.

`app.ts` configures Express, middleware, and public routes; `server.ts` starts the server. `insurance` owns policy checks; `claim` owns intake and stored claims; `verification` orchestrates `vision`, `weather`, and `integrity`; `scoring` produces priority/reasons; `report` assembles assessments; `officer` serves queues and saved reviews.

Internal service calls connect these modules; they do not need to call each other through HTTP. Vision, weather, and integrity route/controller placeholders are reserved for possible future use and need not be exposed publicly in the MVP.

## Data and API planning baseline

The chat proposed six main entities: `farmers`, `insurance_policies`, `claims`, `claim_evidence`, `verification_results`, and `review_actions`. Evidence includes stored image references and available location/time information. Results retain policy and witness outcomes, reasons, and provisional priority. Review actions retain the officer action, reason, and time. Exact columns, relationships, access policies, and migration/seed behavior require approval before SQL is written.

Candidate API operations discussed in planning:

| Operation | Proposed endpoint |
|---|---|
| Submit / retrieve claim | `POST /api/claims`, `GET /api/claims/:id` |
| Policy verification | `POST /api/claims/:id/verify-policy` |
| Farmer status / correction | `GET /api/claims/:id/status`, `PATCH /api/claims/:id/correction` |
| Run or retry eligible analysis | `POST /api/claims/:id/analyze` |
| Retrieve evidence | `GET /api/claims/:id/evidence` |
| Officer queue / action | `GET /api/officer/claims`, `PATCH /api/officer/claims/:id` |

These are proposed contracts, not implemented endpoints. Public routes, payloads, authorization, and whether verification runs automatically during intake must be settled in the relevant design step.

## Proposed 24-hour delivery plan

Use the latest Next.js/Node.js schedule from the chat as a planning target. The two developers should agree on data contracts early and integrate throughout the build.

| Time | Developer 1 — Client and UX | Developer 2 — Server and verification |
|---|---|---|
| 0–4h | Next.js/UI foundation and farmer form | Express foundation, database, synthetic seeds |
| 4–8h | Submission and status/correction screens | Claim intake, upload, policy gate |
| 8–13h | Evidence/result display | Vision, weather, integrity checks |
| 13–18h | Officer queue, claim detail, review actions | Priority rules, report, review persistence |
| 18–21h | End-to-end integration and responsive fixes | Validation, failure cases, integration fixes |
| 21–24h | Demo preparation and final polish | Deployment, smoke tests, repeatable demo data |

**First milestone, by Hour 8:** submit a claim with a photo, match it against a synthetic policy, show verified/correction status, and display the stored claim to an officer. Build evidence processing and scoring on that working flow.

The implementation sequence is foundation and data contracts → database/seeds → claim intake and insurance gate → witness engines/orchestration → scoring/report → officer review → integration/deployment. Client work proceeds alongside the agreed server contracts. Each step still needs its own design approval.

## MVP acceptance and demo cases

| Case | Expected behavior |
|---|---|
| Valid synthetic policy and matching submission | Persist claim, pass gate, run evidence checks |
| Wrong farmer, policy, crop, plot, season, or event coverage | Explain exception; do not invoke witness services |
| Repeated claim for the same incident | Flag duplicate for resolution |
| Eligible claim with corroborating weather | Show sourced supporting evidence and explainable assessment |
| Eligible claim with contradictory weather | Flag inconsistency for officer review |
| Duplicate photo, missing GPS, or unsuitable image | Preserve warning and incomplete evidence |
| Vision/weather service unavailable | Keep claim reviewable; do not fabricate results |
| Officer records review or requests a survey | Persist action/history and update farmer tracking |

Demonstrate a weather-consistent claim, a conflicting-weather claim, a policy mismatch, and missing/suspicious evidence using stored records. Label synthetic policies, illustrative photos, and any simulated values clearly. No claim of a real insured event or verified payout should follow from demo data.

## Deferred scope

Custom YOLO training and validated quantitative crop-loss estimates; full multi-crop/six-peril support; large-scale anomaly backtesting; Sentinel-1/SAR processing; official plot-boundary and government/insurer integrations; offline synchronization; multilingual voice assistance; real approval and payout processing. Basic escalation statuses may be demonstrated without implementing those integrations.

## Decisions still needed before implementation

- Initial crop, supported perils, demonstration region, and sample event/photo data.
- Farmer/policy lookup, correction rules, role access, and authentication approach.
- Final database schema, storage permissions, API contracts, and status transitions.
- Vision provider/model, structured result format, weather rules, and integrity checks.
- Provisional priority logic, missing-evidence behavior, and report/screen design.
- Processing/retry strategy, deployment host, and environment setup.

## Working agreement and agent context

Read this README at the start of a session and follow [AGENTS.md](AGENTS.md).

Before **each implementation step**, present the design, scope, affected files, and validation approach, then wait for explicit user approval. Implement only that approved step, verify it, and report the result. The roadmap is context, not blanket implementation permission.

Keep this README current as decisions are approved and work is completed. Separate planned features from working functionality, and never commit credentials or real sensitive farmer data.
