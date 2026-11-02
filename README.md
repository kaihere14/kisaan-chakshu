# Kisaan Chakshu

Kisaan Chakshu is an AI-assisted crop insurance claim screening and prioritization MVP for **Team 4 UNKNOWNS — Build for Bharat 2026**. It helps government/insurance officers process claims faster by automating the work between farmer submission and human review: checking policy eligibility, gathering evidence, grading the assessment, and preparing a prioritized queue with an explainable report.

The target is a **24-hour build by two developers**, using public weather data and entirely synthetic farmer and insurance records. The approach is an end-to-end vertical slice: make one claim work from submission through officer review before expanding features.

## Planning context and current status

This README consolidates the [shared planning conversation](https://chatgpt.com/share/6ae8516e-4084-83ec-a9dd-f38ff19f867c) and subsequent repository decisions. The latest direction supersedes the earlier 48-hour React/Vite and Python/FastAPI proposals: use **Next.js in `client/` and Node.js/Express in `server/`**, with TypeScript throughout.

**Implemented:** the Next.js landing page; email/password signup and login; farmer claim history, photo submission, and claim detail/status screens; and role-aware farmer/officer workspace access. The farmer screens reuse the landing page's cream, forest green, gold, terracotta, and Instrument Serif theme. Officer access opens a clearly labeled placeholder; the officer review workflow is not implemented.
**Implemented locally:** an Express server with health checks, Prisma ORM 7/PostgreSQL, 150 synthetic policies, typed insurance verification, account/session persistence, and an account-owned claim API with ImageKit uploads, a PostgreSQL outbox, and a BullMQ worker. Applying migrations and seeding require a configured `DATABASE_URL`. The worker stops after insurance verification. Image/weather/integrity engines, scoring, reports, corrections, and officer review remain planned.

### Authentication and farmer portal

Start Express on port 4000 and Next.js on port 3000. Next.js proxies `/api/*` to Express using the server-only `API_SERVER_URL` setting (default `http://127.0.0.1:4000`; see `client/.env.example`). Set `APP_ORIGIN` in `server/.env.local` to the exact browser origin, default `http://localhost:3000`. Restart the processes after configuration changes. Use HTTPS and `NODE_ENV=production` when deployed so session cookies are marked Secure.

Apply the additive `20261102020000_add_accounts` migration with `bun run migration:deploy` from `server/` before using authentication. It adds users, hashed sessions, and an optional account foreign key on claims; it does not rewrite existing policy/claim data. Historical claims remain unassigned and cannot be acquired by entering a Demo Farmer ID. Any future assignment needs an explicitly reviewed account-to-claim mapping.

- `/signup`: creates a **farmer** account using name, email, and a 12–128 character password; emails are trimmed and lowercased. Public signup cannot set a role.
- `/login`: shared farmer/officer login; the stored role determines the workspace.
- `/farmer`: signed-in farmer's own claims, newest first, with 20 records per page and empty/error states.
- `/farmer/submit`: the existing insurance fields, optional paired coordinates and description, and 1–5 JPEG/PNG/WebP photos up to 5 MiB each. Crop remains free text as in the backend contract.
- `/farmer/claims/[id]`: saved details/photos, status, and policy-check reasons. Pending/queued/processing claims refresh every five seconds. A verified policy is displayed as awaiting future evidence analysis, never as insurance approval.
- `/officer/dashboard`: officer-only access confirmation; no claim review operations yet.

Passwords use Node's salted scrypt. Seven-day opaque sessions are stored only as SHA-256 token hashes; browser cookies are HttpOnly and SameSite=Lax, and logout revokes the current session. Password hashes and session tokens are never returned in response JSON. Authentication endpoints have an in-process 15-minute rate limit (10 attempts per email, 50 per direct API source IP, shared across login/signup); limits reset on server restart and are not shared across multiple API instances. With the Next.js proxy, source-IP limits conservatively group proxied clients together. Browser workspace guards are backed by server session/role/ownership checks on every claim endpoint.

Mutation requests require `X-Requested-With: KisaanChakshu`; browser `Origin`, when present, must match `APP_ORIGIN`. No cross-origin CORS access is enabled. Requests use the same-origin Next.js proxy and cookies, with no browser database/storage credentials. Email ownership verification, password reset, and sending email are not implemented; no email provider is required for this approved email/password MVP.

| Auth operation | Endpoint | Body / response |
|---|---|---|
| Signup | `POST /api/auth/signup` | `{ name, email, password }` → `201 { user }` and session cookie |
| Login | `POST /api/auth/login` | `{ email, password }` → `200 { user }` and session cookie |
| Current account | `GET /api/auth/me` | `200 { user: { id, name, email, role } }`, or `401` |
| Logout | `POST /api/auth/logout` | Revokes session, clears cookie, returns `204` |

Provision officers from the server rather than exposing officer signup. Put temporary `OFFICER_EMAIL`, `OFFICER_NAME`, and `OFFICER_PASSWORD` values in Git-ignored `server/.env.local`, then run `bun run create-officer` from `server/`. The command creates an officer only if the email is unused; it never promotes an existing account. Remove the temporary password afterward. No officer account is seeded or automatically created.

The signup identity is separate from the fictional policy owner. The farmer still enters the policy's `owner_name` and `owner_demo_id`; logging in does not establish real policy entitlement. Claim account ownership controls portal access, while the existing synthetic insurance gate checks submitted policy details.

### Server package commands

Use Bun 1.3.14 for package management and Node.js 24 or later for the server runtime:

```sh
cd server
bun install --frozen-lockfile
bun run dev        # Watch src/server.ts using tsx
bun run build      # Compile TypeScript using tsconfig.json
bun run start      # Run the compiled dist/server.js with Node.js
bun run typecheck  # Check TypeScript without emitting files
bun run test       # Insurance/claim unit tests; optional integration test requires disposable services
bun run generate   # Generate the typed Prisma Client
bun run create-officer  # Provision an officer from temporary local environment values
bun run seed:preview  # Preview all 150 synthetic policies; no database needed
```

Run `bun run generate` after installing dependencies or changing the Prisma schema. Build and typecheck also generate the client automatically. Run `bun run build` before `bun run start`; compiled JavaScript goes to `dist/`. Development uses `tsx watch`.

The server uses `PORT` when set, otherwise `4000`. To override it, run `PORT=5001 bun run dev`. The shared `dotenv` loader explicitly reads `server/.env.local` and `server/.env` for both server startup and database scripts, including direct Node/tsx launches from another working directory. Nonempty shell variables take precedence, then `.env.local`, then `.env`; blank placeholders are skipped. Put credentials in the Git-ignored `server/.env.local`. The original `.env` placeholder was tracked; use the ignored `.env.local` for your connection URL.

With the server running, check its health:

```sh
curl -i http://localhost:4000/api/health
```

Expected: HTTP `200` with JSON `{"status":"ok"}`. This endpoint confirms the HTTP server is responding; it does not check database or external-service connectivity. Health routing lives in `src/health/health.route.ts`, with the response in `src/health/health.controller.ts`.

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

Policies and claims are separate concepts: a policy is a seeded coverage record; a claim is a farmer's submission against it. The current seed generates **150 synthetic issued policies**, replacing the earlier 20-record proposal. Claims and duplicate-claim detection will be implemented separately.

The internal insurance check compares policy number, farmer ID/name, policy/premium status, crop, plot, season/year, claimed event date, and covered peril. Duplicate-claim checks against the same policy, plot, and incident are deferred until claims exist. Policy validity is distinct from incident eligibility: an active policy may still exclude the reported event.

| Situation | Planned outcome | Evidence pipeline |
|---|---|---|
| Matching farmer, crop, plot, active coverage, eligible event | Verified | Continue |
| Missing policy or mismatched farmer/plot details | Correction or manual verification | Stop |
| Wrong crop, season, coverage dates, or uncovered peril | Explain coverage exception | Stop |
| Same incident already submitted | Flag duplicate / identify existing claim | Stop pending resolution |

A missing or mismatched record produces a correction or review state rather than an irreversible automated insurance rejection. Seeded identities and policies must be visibly fictional; no real Aadhaar, bank details, or insurer/government access is required.

The implemented lookup uses **Policy Number + Demo Farmer ID**, followed by the approved field and coverage checks. Application-number lookup is not implemented.

### Internal insurance controller contract

Other server modules call `verifyInsurance(input)` from [`insurance.controller.ts`](server/src/insurance/insurance.controller.ts). This is an async server function, not an Express handler; no insurance HTTP route is registered. The caller passes claim details and awaits the result. Matching and Prisma access live in [`insurance.service.ts`](server/src/insurance/insurance.service.ts).

[`InsuranceVerificationInput`](server/src/insurance/insurance.types.ts) requires `policy_number`, `owner_demo_id`, `owner_name`, `plot_id`, `crop`, `season`, numeric `season_year`, `peril`, and a real calendar `event_date` in `YYYY-MM-DD` format. Season/peril values reuse Prisma's generated enums. The controller validates input with Zod before database access, trims required text, and ignores unrelated submission fields.

| Returned result | Meaning |
|---|---|
| `{ result: true, reason: "verified" }` | All fields match, policy is active, premium is paid, event date is inside coverage, and peril is covered |
| `{ result: "partial", reason: "details_mismatch", mismatchedFields: [...] }` | Policy/farmer IDs match and coverage is eligible, but name, plot, crop, season, or season year differs |
| `{ result: false, reason: "not_found" }` | No policy exists for that policy number |
| `{ result: false, reason: "owner_mismatch" }` | Policy exists but the farmer ID differs |
| `{ result: false, reason: "ineligible", issues: [...] }` | Policy inactive/expired/cancelled, premium unpaid/pending, event outside coverage, or uncovered peril |
| `{ result: false, reason: "invalid_input", invalidFields: [...] }` | Required fields, enum values, year, or event date fail validation |

Reason, field, and eligibility-issue values have exported TypeScript enums; `InsuranceVerificationResult` is a discriminated union. Eligibility issue codes are `policy_not_active`, `premium_not_paid`, `event_outside_coverage`, and `peril_not_covered`. Multiple issues/mismatches are returned together, without exposing stored policy values.

Policy/farmer/plot identifiers match exactly after surrounding whitespace is trimmed. Farmer names and crop names ignore case and repeated whitespace. Coverage start/end dates are inclusive. Identity failures are evaluated first, then hard eligibility failures, then correctable detail mismatches. An eligibility failure therefore returns `false` even when some fields also need correction. These are demo policy rules, not official insurance decisions.

Callers must check **`result === true`**, because the string `"partial"` is truthy:

```ts
const verification = await verifyInsurance(claimDetails);
if (verification.result === true) {
  // Eligible for the future evidence-processing pipeline.
} else if (verification.result === "partial") {
  // Request correction using verification.mismatchedFields.
} else {
  // Handle verification.reason and its typed issue/field details.
}
```

Database/connection errors reject the promise and must be handled by the calling module; they are never converted into an insurance mismatch or rejection. This function only reads policies and returns a result; claim persistence is handled by the claim service. Correction workflows, duplicate-incident detection, and evidence processing remain later steps.

## Claim submission and queue processing

The claim row in PostgreSQL is the source of truth for submitted data, workflow status, stage, attempt count, insurance result, errors, and timestamps. ImageKit holds photo files; `ClaimImage` holds their URLs/file IDs. BullMQ jobs contain only `{ claimId }` and load their inputs from the database.

### Configure and run

Fill the placeholders in `server/.env.local`:

```dotenv
DATABASE_URL="your-postgresql-connection-url"
REDIS_HOST="your-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"
REDIS_USERNAME=
REDIS_TLS=false
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-account"
```

Use the host and numeric port supplied by your Redis provider, with no URL protocol in `REDIS_HOST`. Set `REDIS_TLS=true` if the provider requires TLS, and set optional `REDIS_USERNAME` when it uses ACL authentication (often `default`). Leave `REDIS_PASSWORD` blank for a password-free local Redis. Both BullMQ producer and worker use the same validated connection options; producer calls fail fast while worker connections keep reconnecting. The private ImageKit key stays on the server; no public key is required for this upload flow. Then apply the new additive migration and run the API and worker in separate terminals, each from `server/`:

```sh
bun install --frozen-lockfile
bun run generate
bun run migration:deploy
bun run dev
```

```sh
bun run worker:dev
```

For compiled execution: `bun run build`, then run `bun run start` and `bun run worker:start` separately. Keep both processes running. The API can accept/store submissions while the worker or Redis is unavailable; they stay pending until dispatch resumes.

### Submit and retrieve a claim

All `/api/claims` endpoints require a signed-in **farmer** session. New records belong to that account; clients cannot choose or transfer account ownership. Another farmer's claim and an unassigned historical claim both return `404`; officers receive `403` on these farmer routes.

`GET /api/claims?page=1` returns `{ claims, page, hasMore }` for the signed-in account, ordered by creation date and UUID descending, 20 at a time. `page` must be an integer from 1 to 100,000. Unknown query parameters, including attempted owner filters, are rejected. Account IDs and internal processing/idempotency fields are omitted from claim JSON. Claim and auth responses use `Cache-Control: no-store`.

Idempotency keys are scoped to the authenticated account. The browser preserves the same fields, files, and key on ambiguous/network failures; validation failures allow edits. Keep the page open for those retries: refreshing/navigating away does not preserve the pending upload/key. For the curl example below, first log in through `/api/auth/login` with the mutation header and save the session cookie in a local cookie jar. Keep cookie jars outside version control; the example uses `/tmp/kc-cookies.txt` on a Unix-like shell. The portal handles cookies automatically.

`POST /api/claims` accepts **multipart/form-data** with the nine insurance fields shown in the demo example below, optional `latitude` + `longitude` (both or neither), optional `description` (up to 2,000 characters), and **1–5 photos** in the repeated `photos` field. JPEG, PNG and WebP are accepted; MIME declarations/signatures are checked and each file is limited to 5 MiB. Full image-content analysis belongs to the future vision/integrity stages.

Send an `Idempotency-Key` header containing 8–128 letters, numbers, hyphens or underscores. Reuse the key when retrying the same request; sending different fields/photos with that key returns `409`. This prevents duplicate records/uploads for HTTP retries; it does not detect separate claims for the same crop incident.

```sh
curl http://localhost:4000/api/claims \
  -b /tmp/kc-cookies.txt \
  -H 'X-Requested-With: KisaanChakshu' \
  -H 'Idempotency-Key: demo-claim-00000001' \
  -F 'policy_number=DEMO-KC-POL-0001' \
  -F 'owner_demo_id=DEMO-FARMER-0001' \
  -F 'owner_name=Demo Farmer 0001' \
  -F 'plot_id=DEMO-PLOT-0001' \
  -F 'crop=paddy' \
  -F 'season=kharif' \
  -F 'season_year=2026' \
  -F 'peril=flood' \
  -F 'event_date=2026-10-15' \
  -F 'photos=@/absolute/path/to/damage.jpg'
```

A new submission returns `202` and `{ claim, replayed: false }`, with a `Location` header pointing to `/api/claims/<id>`. An identical replay returns `200` and the same claim, without uploading again. Query `GET /api/claims/<id>` for `{ claim }`; it reads PostgreSQL and never derives status from Redis. Internal idempotency hashes, processing tokens, and ImageKit deletion IDs are not exposed in the response.

| Stored status | Meaning |
|---|---|
| `pending` | Claim saved; photos are uploading or an outbox entry is waiting for dispatch |
| `queued` | BullMQ accepted the claim job |
| `processing` | Worker is executing insurance verification |
| `awaiting_analysis` | Insurance returned `true`; stop until the evidence engines are implemented |
| `needs_correction` | Insurance returned `partial`; saved mismatched fields are available |
| `needs_review` | Insurance returned `false`; saved verification reasons are available |
| `failed` | Upload failed/expired, or queue processing exhausted retries |

Stages distinguish `upload`, `dispatch`, `insurance`, `awaiting_analysis`, and `finished`. `finished_at` records completion/failure of the current worker/upload stage, not insurance approval or payout. No correction/resubmission endpoint or officer review UI has been implemented yet. Authentication and farmer ownership checks are enforced on all claim HTTP routes; worker/internal service reads remain independent of browser sessions.

### Persistence, retries and recovery

1. Validate fields and photos before creating anything. Reserve the idempotency key in a `pending` claim row.
2. Upload photos into `/kisaan-chakshu/claims/<claimId>/` in ImageKit.
3. In one Prisma transaction, save image references, mark the images ready, and insert a `ClaimOutbox` row. A claim can retain an invalid/missing policy number, so it deliberately has no mandatory policy foreign key.
4. The worker process polls the outbox every two seconds, adds a BullMQ job whose ID is the claim UUID, and conditionally marks the claim queued. Enqueue failures retain an outbox entry with retry time/error; the HTTP server does not need a Redis connection.
5. The worker loads saved fields, writes processing/attempt metadata, invokes the internal insurance function, and saves the result/status. Operational failures retry up to three attempts with exponential backoff. Business outcomes (`partial`/`false`) are saved without being retried as operational errors.
6. Processing tokens fence stale worker writes; late dispatch acknowledgements cannot regress processing or terminal states. Retained BullMQ jobs deduplicate repeated delivery.
7. Recovery checks queued/processing records older than 30 seconds. Missing Redis jobs are re-created through the outbox; exhausted/stalled failures become visible in the claim. Upload reservations older than 15 minutes become failed. Known partial uploads have database deletion receipts and are cleaned up with retries.

Known boundary: ImageKit upload and PostgreSQL commit cannot be one transaction. Abrupt process death or an ambiguous commit can leave orphaned files in a claim's ImageKit folder before their IDs are persisted. Automatic folder reconciliation is not implemented; known recorded failures are cleaned up. Completed/failed BullMQ jobs are retained for deduplication and need an operational retention policy as usage grows.

### Verification

The authentication/farmer implementation passed client typecheck/production build, server typecheck/build, and Prisma schema validation. The Node test suite finished with **51 passes, 0 failures, and 1 skipped integration test**. It covers real HTTP auth middleware/controllers with an in-memory persistence boundary, password hashing, session expiry/revocation, role enforcement, mutation origin checks, rate limiting, ownership filtering, and account-scoped idempotency. Desktop (1440px) and mobile (390px) browser checks used simulated API responses to exercise signup, protected redirects, history/empty states, photo validation/preview, multipart retry, policy mismatch display, logout, and officer routing, with no runtime exceptions or page overflow. A real Next.js → compiled Express proxy smoke check returned `200` for health and `401` for unauthenticated account/history access. These checks do not verify live PostgreSQL, ImageKit, or Redis. This workspace has no server database URL or dedicated integration services, so the new migration was not applied and the opt-in database/queue test was skipped.

`bun run test` runs the unit tests. The integration test is opt-in: apply the migrations to a **disposable** PostgreSQL database, supply `CLAIM_TEST_DATABASE_URL`, `CLAIM_TEST_REDIS_HOST`, and `CLAIM_TEST_REDIS_PORT` for dedicated test services (plus `CLAIM_TEST_REDIS_PASSWORD`, `CLAIM_TEST_REDIS_USERNAME`, and `CLAIM_TEST_REDIS_TLS` when required), then run `bun run test`. It exercises the real Prisma/outbox/BullMQ path with simulated ImageKit uploads, and cleans up only its own records/jobs. Never point those test variables at a shared live queue. A live upload/deletion smoke check also passed with the configured ImageKit account; that test file was removed. New environments still need their own credentials and Redis configuration.

### Prisma database setup: generate → migrate → seed

Prisma is the only database access/migration layer. The previous SDK configuration and manually applied `database/schema.sql` path have been removed. Use an empty PostgreSQL application database and put its connection URL in the existing Git-ignored **`server/.env.local`**:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/kisaan_chakshu?sslmode=require"
```

[`server/.env.example`](server/.env.example) documents the variable. Use the database password in the URL and URL-encode special characters. Use a direct or session-mode PostgreSQL connection that supports migrations. No separate API URL or API key is required.

From `server/`, run:

```sh
bun install --frozen-lockfile
bun run db:setup
```

`db:setup` runs these commands in order and stops if any step fails:

```sh
bun run generate           # Generate Prisma Client from schema.prisma
bun run migration:deploy   # Apply checked-in SQL migrations, creating the policy table
bun run seed               # Run the configured Prisma seed and verify 150 records
```

The initial migration is already checked in, so first-time setup does not require a shadow database or an interactive migration prompt. Prisma records applied migrations in `_prisma_migrations`. Repeating setup skips applied migrations and preserves existing seed records.

Additional package scripts:

| Command | Purpose |
|---|---|
| `bun run migration --name describe_change` | Create and apply a development migration after changing the model; requires shadow-database access |
| `bun run migration:deploy` | Apply existing migrations to the configured database |
| `bun run migration:status` | Inspect migration state |
| `bun run generate` | Regenerate typed client code; no database connection needed |
| `bun run seed` | Insert the 150 demo policies after migrations |
| `bun run seed:preview` | Print demo records without connecting to a database |
| `bun run studio` | Browse records in Prisma Studio |

The source of truth is [`server/prisma/schema.prisma`](server/prisma/schema.prisma). [`server/prisma.config.ts`](server/prisma.config.ts) sets the connection, migration directory, and seed command. `src/config/prisma.ts` creates the PostgreSQL driver adapter and Prisma Client lazily, keeping health checks independent of database credentials. Generated code lives in `src/generated/prisma/` and is ignored by Git.

The initial migration uses a transaction so failed DDL rolls back. Subsequent changes belong in new migrations rather than editing applied SQL. There is no automatic reset/drop command. If the earlier manual SQL was already applied to a database, preserve its data and baseline/migrate that existing schema separately before applying this fresh-database migration; do not reset it to resolve migration errors.

The Prisma seed uses a transaction and `createMany({ skipDuplicates: true })`, then verifies the seed-batch count. Reruns preserve existing IDs and edits. Expected success on a new database: `Verified 150 synthetic policies (150 inserted). Existing policies were preserved.` A rerun reports zero inserted. A missing table produces an instruction to migrate first.

### Policy fields

Each policy currently includes the owner's details directly as the snapshot recorded when insurance was issued. A separate farmer account/owner table can be introduced when its workflow is designed.

| Field group | Columns |
|---|---|
| Identification and issuer | `id` (UUID), `policy_number` (unique), `application_number` (unique), `insurer_name`, `scheme_name` |
| Policy owner | `owner_demo_id`, `owner_name`, optional `owner_phone`, optional `owner_email`, `ownership_type` (owner/tenant/leaseholder) |
| Land and location | `village`, `district`, `state`, `plot_id`, `plot_latitude`, `plot_longitude`, `insured_area_hectares` |
| Crop and coverage | `crop`, `season`, `season_year`, `covered_perils`, `issued_on`, `coverage_start`, `coverage_end` |
| Financial and policy status | `sum_insured_inr`, `premium_amount_inr`, `premium_status`, `policy_status` |
| Provenance | `is_synthetic`, `seed_batch`, `created_at`, `updated_at` |

Prisma models the policy, premium, ownership, season, and peril values as PostgreSQL enums; money, area, and coordinates use decimal types. The initial migration adds SQL checks for dates, ranges, nonempty coverage, and positive amounts. Row Level Security is enabled; the backend connects as the database/table owner. No browser database credentials or public policy API are exposed.

### Reproducible demo records

All identifiers, owners, insurers, and village/plot labels are fictional. Phone numbers are null; email addresses use the reserved `.invalid` domain. Plot coordinates are illustrative points near Ludhiana, Karnal, Kakinada, Kota, and Nashik, not authenticated parcel boundaries. Seeded crops are paddy, soybean, and maize; these data examples do not enable or validate their vision/weather support.

| Policy suffix | Count | Status | Premium | Demo purpose |
|---|---|---|---|---|
| `0001`–`0090` | 90 | Active | Paid | Matching policy or deliberately mismatched input |
| `0091`–`0105` | 15 | Active | Unpaid | Premium exception |
| `0106`–`0125` | 20 | Expired | Paid | Historical coverage exception |
| `0126`–`0140` | 15 | Cancelled | Paid | Cancelled policy exception |
| `0141`–`0150` | 10 | Inactive | Pending | Inactive/pending exception |

Policy numbers use `DEMO-KC-POL-` before the suffix. Use this known matching input with the internal insurance controller after seeding:

```json
{
  "policy_number": "DEMO-KC-POL-0001",
  "owner_demo_id": "DEMO-FARMER-0001",
  "owner_name": "Demo Farmer 0001",
  "plot_id": "DEMO-PLOT-0001",
  "crop": "paddy",
  "season": "kharif",
  "season_year": 2026,
  "peril": "flood",
  "event_date": "2026-10-15"
}
```

That policy covers flood/lodging from `2026-06-01` to `2026-11-30`. The sample returns `true` against unchanged seed data. Changing the peril to drought returns `false/ineligible`; changing the crop to wheat returns `partial`. The seed has fixed dates and status snapshots: use the documented event date rather than assuming coverage matches today's date. The fictional premium rate and insured values are demonstration amounts, not official insurance pricing.

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
| Database / ORM | PostgreSQL + Prisma ORM 7 and PostgreSQL driver adapter |
| Photo storage | ImageKit server upload SDK |
| Queue | BullMQ + Redis; PostgreSQL outbox for recoverable dispatch |
| Image analysis | Hosted vision API; specific provider/model to be selected |
| Weather | Open-Meteo; endpoint/date-window selection to be designed |
| Image integrity | Sharp + perceptual hashing proposed |
| Scoring / reports | TypeScript rules + generated HTML |
| Deployment | Vercel for the client proposed; Node.js host to be selected |

The Express server owns orchestration and external integrations. BullMQ uses Redis for job delivery, with a separate worker process. A separate Python service, Celery, or distributed microservices are not needed for this MVP. Credentials, access controls, upload limits, processing/retry behavior, and deployment configuration must be designed before their respective implementation steps.

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
│   ├── prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.ts
│   │   └── seed-data.ts
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── health/
│       ├── insurance/
│       ├── claim/            # API, service, BullMQ transport and worker
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

The chat proposed six main entities: `farmers`, `insurance_policies`, `claims`, `claim_evidence`, `verification_results`, and `review_actions`. Prisma now implements `insurance_policies`, `claims`, `claim_images`, and `claim_outbox`. Owner details remain on each issued policy. Insurance results currently live on the claim as JSON; review/history tables and evidence-engine results will be designed later. Evidence is intended to include stored image references and available location/time information; results retain witness outcomes and reasons; review actions retain the action, reason, and time.

Candidate API operations discussed in planning:

| Operation | Proposed endpoint |
|---|---|
| Submit / retrieve claim | `POST /api/claims`, `GET /api/claims/:id` |
| Farmer status / correction | `GET /api/claims/:id/status`, `PATCH /api/claims/:id/correction` |
| Run or retry eligible analysis | `POST /api/claims/:id/analyze` |
| Retrieve evidence | `GET /api/claims/:id/evidence` |
| Officer queue / action | `GET /api/officer/claims`, `PATCH /api/officer/claims/:id` |

`POST /api/claims`, `GET /api/claims/:id`, and account-owned history at `GET /api/claims?page=1` are implemented as described above; the remaining routes in this table are proposals. Insurance verification remains an internal function called by the claim worker. Farmer authorization is enforced on all claim HTTP routes.

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
- Remaining database tables/relationships, photo-storage permissions, API contracts, and status transitions.
- Vision provider/model, structured result format, weather rules, and integrity checks.
- Provisional priority logic, missing-evidence behavior, and report/screen design.
- Processing/retry strategy, deployment host, and environment setup.

## Working agreement and agent context

Read this README at the start of a session and follow [AGENTS.md](AGENTS.md).

Before **each implementation step**, present the design, scope, affected files, and validation approach, then wait for explicit user approval. Implement only that approved step, verify it, and report the result. The roadmap is context, not blanket implementation permission.

Keep this README current as decisions are approved and work is completed. Separate planned features from working functionality, and never commit credentials or real sensitive farmer data.
