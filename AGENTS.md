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
