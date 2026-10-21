# 0002. Vitest and Playwright for automated testing

- Status: Accepted
- Date: 2026-10-20
- Deciders: Project maintainers

## Context

Shortlink had no automated tests. Domain logic lives in `lib/` (Zod validation, Drizzle/SQLite persistence, Server Actions); the product surface is a thin App Router UI plus a redirect Route Handler. We needed a durable choice for unit/integration and end-to-end testing that fits Next.js 16, TypeScript, and local SQLite without inventing a parallel API or auth layer (see ADR 0001).

## Decision

Use this testing stack:

| Layer | Choice | Role |
|--------|--------|------|
| Unit + lib integration | **Vitest** | Pure Zod/utils tests; Server Action / DB tests against an isolated SQLite file |
| DOM / component (optional) | **@testing-library/react** + **jsdom** | Light client-dialog interaction tests when needed; not the primary investment |
| End-to-end | **Playwright** (`@playwright/test`) | Browser smoke: create → list → redirect → edit/delete |

Conventions:

- Prefer testing `lib/` over page snapshots or async Server Components in Vitest
- Integration and E2E must use an isolated SQLite path (e.g. `SQLITE_PATH`), never the developer `sqlite.db`
- Keep the Playwright suite thin; push edge cases into Vitest where possible

## Consequences

### Positive

- Fast feedback on validation and CRUD correctness without a browser
- E2E covers redirect (302), navigation, and UI wiring that unit tests cannot
- No auth fixtures required under ADR 0001

### Negative / constraints

- Async Server Components are not a Vitest target; cover them via Playwright
- Server Actions that call `revalidatePath` need Next mocks or E2E when run outside the Next runtime
- Playwright needs browsers installed and a running app (`webServer`)

## Alternatives considered

- **Jest** — workable with Next’s official path, but heavier ESM/TS friction than Vitest for this greenfield setup
- **Cypress** — capable E2E, more ceremony than needed for a small no-auth CRUD + redirect app
- **MSW** — unnecessary; no third-party HTTP dependencies today
- **Visual regression tooling** — deferred until design conventions stabilize
