# 0003. Better Auth with email/password and default organization ownership

- Status: Accepted
- Date: 2026-11-04
- Deciders: Project maintainers

## Context

ADR 0001 shipped shortlink with **no auth**: anyone who could reach `/app` could manage every link. That matched a single-operator prototype.

We now need multi-user SaaS accounts: open signup, private link management and click stats per account, while keeping public short-link redirects. We also want a **default organization (team) per signup** so ownership is org-scoped from day one, leaving a door open for future invites—without building invite UI yet.

Constraints from the product discussion:

- Same local SQLite file (no hosted IdP / Clerk)
- Email + password only (no OAuth, magic link, or outbound email)
- No email verification or password-reset email in this phase
- No “logout everywhere” UI in this phase
- Global slug uniqueness (short URLs remain `/{slug}`)
- Wipe/reseed is acceptable; still ship real migrations

## Decision

| Concern | Choice |
|--------|--------|
| Auth library | **Better Auth** with Drizzle adapter (`provider: "sqlite"`) on the existing `@libsql/client` DB |
| Credentials | Email + password; `requireEmailVerification: false` |
| Sessions | Database sessions (Better Auth default) |
| Multi-tenant unit | Better Auth **organization** plugin; one personal org created on signup; user is **owner** |
| Active org | Set `activeOrganizationId` on session create to that personal org |
| Link ownership | Required `links.organizationId` FK; list/mutate scoped to the active org |
| Slugs | Remain **globally unique** |
| Public surfaces | `/` (marketing), `/[slug]` (redirect + click increment) |
| Private surfaces | `/app` (dashboard), create/edit/delete, click counts |
| Auth UI routes | `/login`, `/signup`; Better Auth handler at `/api/auth/[...all]` |
| Gate | Optimistic session-cookie check in Next.js 16 `proxy.ts` for `/app`; **authoritative** checks via `auth.api.getSession` + org membership in layouts / Server Actions / DAL |
| Validation | Zod for signup/login inputs (aligned with Better Auth password rules) and existing link schemas |
| Abuse (sign-in) | Better Auth built-in **rate limit**, with stricter limits on sign-in paths; prefer database storage so limits survive process restarts |
| Env | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |

This ADR **supersedes the Auth: None decision** (and the related “no multi-user accounts” non-goal) from [ADR 0001](./0001-nextjs-sqlite-no-auth-shortener.md). Runtime (Next.js App Router), Server Actions for link CRUD, Drizzle + local SQLite, and Zod for link validation remain as in 0001.

### Non-goals (this phase)

- OAuth, magic links, email verification, password-reset email, MFA, passkeys
- Invite UI, org switcher, custom roles UI, agent API tokens
- “Logout everywhere” product feature (DB sessions make it feasible later)
- Leaving SQLite / multi-instance deploy
- Per-user slug namespaces or public analytics URLs

## Consequences

### Positive

- Users own data through org membership; future invites can reuse the same `organizationId` ACL
- Auth tables live beside links in one SQLite file; no vendor lock-in for identity
- Server Action authorization is mandatory, not UI-only
- Rate limiting on auth endpoints reduces casual password guessing without a separate service

### Negative / constraints

- Organization plugin adds tables (`organization`, `member`, `invitation`, …) even though invites are unused for now
- Single-node SQLite remains unsuitable for horizontally scaled deploys (unchanged from 0001)
- Without outbound email, account recovery is out of band until a later ADR
- `cacheComponents` requires care: session reads must stay out of static shells

### Guidance for humans and agents

- Do not authorize only in `proxy.ts` / middleware—always check session + org in the DAL for mutations and private reads
- Do not add OAuth, email sending, or invite UX without a new ADR (or an explicit product decision recorded here / in `DESIGN.md`)
- Keep `/[slug]` redirects public and unscoped by org

## Alternatives considered

- **Auth.js (NextAuth v5)** — viable; more config surface for this Drizzle/SQLite app; rejected in favor of Better Auth
- **Clerk / hosted IdP** — fastest UI; rejected because we want user rows in SQLite and simple self-host
- **Custom iron-session / Lucia-style only** — fine for a single admin gate; too little for open signup + orgs
- **`links.userId` without orgs** — simpler now; forces a painful migration when teams arrive; rejected
- **Per-user slug namespaces** — would change public URL shape; deferred
