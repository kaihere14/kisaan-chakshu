# Kisaan Chakshu

Kisaan Chakshu is a planned crop insurance claim verification MVP for Build for Bharat 2026. The project is scoped for a 24-hour hackathon with two developers.

## Current status

Only the folder structure and empty placeholder files have been created. Application code, dependencies, configuration, database schema, and integrations are not implemented yet. There are no working install, run, or test commands.

The application directories are named `client/` and `server/`.

## Planned stack

- **Client:** Next.js, TypeScript, and shadcn/ui.
- **Server:** Node.js, Express, and TypeScript.
- **Database:** Supabase, initially using synthetic insurance records.
- **Validation:** Zod schemas for request input.

These are the intended technologies; dependencies have not been installed.

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

## Planned application areas

The client has routes for farmer claim submission and claim details, plus an officer dashboard and claim review pages.

The server is divided into insurance, claim, verification, vision, weather, integrity, scoring, report, and officer modules. Their detailed behavior, external providers, API contracts, and data models will be designed and approved step by step.

## Server module convention

Request flow:

```text
Route → Controller → Service → Database / External API
```

- `*.route.ts`: Defines endpoints and maps them to controllers.
- `*.controller.ts`: Handles HTTP requests, responses, and validation errors.
- `*.service.ts`: Contains business logic and database or external API interactions.
- `*.schema.ts`: Contains Zod input schemas where needed; placeholders currently exist for insurance and claim.
- `*.types.ts`: Contains TypeScript interfaces and result types where needed; placeholders currently exist for insurance and claim.

For example, the insurance service is intended to look up synthetic policies in Supabase, match farmer details, and validate coverage.

## Development workflow

1. Select one step and propose its design, scope, affected files, and validation approach.
2. Wait for the user's explicit approval before implementing that step.
3. Implement only the approved scope, then verify it and report the result.
4. Update this README when an approved decision or completed step changes the project context.

The previously suggested implementation order is server foundation, database setup, insurance, claims and uploads, verification engines, scoring and orchestration, reporting and officer APIs, then the client. This is a proposal, not approval to implement any step.

## Context for coding agents

Read this README at the start of a session. See [AGENTS.md](AGENTS.md) for repository-wide working instructions. Keep confirmed decisions separate from proposals, and do not treat placeholder files or planned features as working functionality.
