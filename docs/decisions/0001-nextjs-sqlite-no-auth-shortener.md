# 0001. Next.js App Router shortener with local SQLite and no auth

- Status: Accepted
- Date: 2026-10-14
- Deciders: Project maintainers
- Commit: `ffbb6e3` (initial shortlink implementation)

## Context

We needed a small Dub-inspired URL shortener: create short links, redirect by slug, edit/delete links, and count clicks.

Goals for the first version:

- Fast local setup with minimal infrastructure
- One deployable TypeScript codebase for UI and server logic
- Typed persistence and validated writes
- A maintainable UI without inventing a design system from scratch

Non-goals for the first version:

- Multi-user accounts, roles, or SSO
- Teams, billing, or advanced analytics
- Horizontal scaling or multi-region deployment

## Decision

Build **shortlink** as a single Next.js 16 App Router application with this stack and shape:

| Concern | Choice |
|--------|--------|
| Runtime / UI | Next.js 16 (App Router) + React 19 |
| Mutations | Server Actions (`"use server"`), not a separate REST/GraphQL API |
| Redirects | Route Handler at `app/[slug]/route.ts` (302 + click increment) |
| Database | SQLite file via `@libsql/client`, accessed through Drizzle ORM |
| Schema / migrations | Drizzle schema in `lib/schema.ts`, SQL migrations in `drizzle/` |
| Validation | Zod schemas in `lib/link-schemas.ts` on the server |
| UI | Tailwind CSS + shadcn/ui (Base UI / owned components under `components/ui/`) |
| Auth | **None** — anyone who can reach the app can manage links |

Supporting conventions fixed by this decision:

- Keep domain logic in `lib/` (db, schema, actions, validation)
- Keep route entrypoints thin in `app/`
- Prefer Server Components for data loading; Client Components for interactive UI (dialogs, table actions, clipboard)
- Serialize DB dates before passing links into Client Components

## Consequences

### Positive

- One language and repo for full stack; low ceremony for CRUD
- Local `sqlite.db` + `npm run db:migrate` is enough to run
- Drizzle + Zod give a clear typed boundary for writes
- shadcn components are in-repo and adjustable without a UI vendor lock-in layer

### Negative / constraints

- **No auth is intentional.** Do not add accounts, middleware gates, or multi-tenant isolation without a superseding ADR.
- **Local SQLite assumes a single writable filesystem.** Serverless multi-instance hosts and ephemeral disks are a poor fit without changing the data store (new ADR).
- **Server Actions couple UI to Next.** A public HTTP API for third parties is out of scope until decided separately.
- **Open redirect risk is inherent** to a shortener: stored destinations are redirected from this origin. Treat abuse controls as a later product decision, not something to “quietly” redesign the stack around.
- Click increments and slug allocation use simple application-level logic; correctness under heavy concurrency is not a v1 requirement.

### Guidance for humans and agents

Treat the table in **Decision** as binding. Refactors that preserve these choices are fine. Replacing Next.js, introducing auth, swapping SQLite for another primary store, or adding a parallel public API **requires a new ADR** that supersedes this one (or a focused ADR for that slice) before implementation.

## Alternatives considered

- **Separate backend (Express/Fastify) + SPA** — more moving parts for a simple CRUD + redirect app; rejected for v1.
- **Postgres (or other server DB) from day one** — better for multi-instance deploy, but heavier locally; rejected until deployment needs demand it.
- **REST Route Handlers for CRUD** — workable, but Server Actions fit the dashboard-centric UI with less boilerplate; redirects still use a Route Handler where an HTTP redirect is the product.
- **Auth built in from the start (e.g. NextAuth / Clerk)** — correct for a public multi-user product; out of scope for the intentional no-auth v1.
- **Edge / serverless-first DB (Turso remote, PlanetScale, etc.)** — `@libsql/client` keeps a path open later; v1 stays on a local file URL for simplicity.
