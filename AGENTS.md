# Architecture Decision Records

Before changing stack, auth, data storage, API style, or other cross-cutting architecture, read `docs/decisions/`.

- **Accepted** ADRs are binding. Do not reverse or bypass them in drive-by refactors.
- To change an Accepted decision: add a new numbered ADR that supersedes it, get agreement, then implement.
- Never reuse ADR numbers. Follow `docs/decisions/README.md`.
- Prefer implementing *within* existing ADRs over inventing a parallel approach.

# Product & UI design

When UI or UX needs to be changed or decided, read `DESIGN.md`.

- Follow whatever is recorded there. Do not invent parallel “house style” docs or drive-by conventions that imply new product decisions.
- Gaps mean **not decided yet** — implement the task at hand without pretending a convention exists, and do not backfill `DESIGN.md` without agreement.
- To record a new convention: propose it, get explicit agreement that it should become the current decision, update `DESIGN.md`, then implement.
- Stack, auth, and storage still go through ADRs. If a design change implies architecture, ADR first (or alongside).

# Feature sizing & slices

Before planning or building a feature, size it. Do **not** blindly accept a request and jump into an implementation plan or code.

## When is a change too big?

Treat the request as too big if **any** of these apply:

- It likely touches **more than ~10 files**
- It likely changes **more than ~500 lines**
- It **mixes multiple concerns** in one go (e.g. authentication + organizations + permissions)

## If the request is too big → roadmap only, then stop

- Do **not** plan the full implementation.
- Do **not** write any code.
- Output a **roadmap of slices**, then **stop**.

Each slice in the roadmap must include:

- **Goal** — what this slice delivers on its own
- **Rough file list** — expected touch points
- **Depends on** — which earlier slices (if any)
- **Status** — `done` or `not done` (mark every slice; new roadmaps start as all `not done`)

### Slice rules

- Max **~10–15 files** and **~500 lines** per slice
- Each slice is **merged on its own** (own PR / own merge)
- Each slice has **its own tests**
- Order slices **riskiest first** (unknowns, data model, auth boundaries before polish UI)

### Example — too big → roadmap (then stop)

Request: “Add auth, organizations, and role-based permissions.”

```text
Roadmap: Auth + orgs + permissions

1. [not done] Session/auth foundation
   Goal: Sign-in/out and a session the app can trust
   Files (rough): auth routes, session helper, middleware, auth tests
   Depends on: —

2. [not done] Organization model
   Goal: Create/list orgs; user belongs to an org
   Files (rough): org schema/migration, org API, org tests
   Depends on: 1

3. [not done] Permissions checks
   Goal: Enforce roles on one protected action end-to-end
   Files (rough): roles helper, one API gate, one UI gate, permission tests
   Depends on: 1, 2
```

Do not plan slice 2 or 3 implementation in the same chat. Do not write code.

## If the request is one slice → plan that slice only

- Write an implementation plan for **this slice only**.
- Do **not** write code until explicitly asked to implement.
- Do not expand into neighboring slices “while we’re here.”

### Example — one slice → plan only (no code)

Request: “Add click count to the shortlink redirect.”

Fits one slice → plan files, behavior, and tests for click counting only. Stop after the plan unless asked to implement.

## Never

- Never plan or implement **more than one slice in a chat**
- Never continue to the **next slice** without being asked
- Never start coding when the output should be a **roadmap** or a **single-slice plan**

# Testing

Stack and layering follow ADR 0002 (`docs/decisions/0002-vitest-playwright-testing.md`): **Vitest** + **React Testing Library** for logic and components; **Playwright** for important browser journeys.

- **Bug fixes:** Write a regression test first. Confirm it fails for the expected reason, then fix the code and verify the same test passes.
- **Features:** Cover the required behavior and meaningful edge or error cases.
- **Refactors:** Preserve existing behavioral expectations; do not change tests to match unintended new behavior.
- **Integrity:** Never bypass git hooks, and never delete, skip, or weaken tests just to make the suite pass.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
