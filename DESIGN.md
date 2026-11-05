# Design

Durable product and UX decisions for shortlink.

This is not a mood board of the current prototype. Prefer leaving gaps over inventing conventions.

## Change control

Do not add or revise entries unless humans and the agent explicitly agree that the text should become the **current decision**. Update this file first, then implement.

## Product

- Multi-user URL shortener SaaS: anyone can sign up; create, list, copy, edit, delete links; track click counts for their organization only.
- Surfaces:
  - Marketing landing at `/` (public)
  - Auth at `/login` and `/signup` (public)
  - Links dashboard at `/app` (authenticated; redirects to `/login` when logged out)
  - Short redirects at `/[slug]` (public; no public stats)
- After login or signup, land on `/app`.
- Each signup gets a default organization; links belong to that organization (invite UI is not part of the product yet).
- Stack, storage, auth library, and API shape live in [`docs/decisions/`](docs/decisions/), not here.

## Open

Prototype. UX conventions (visual direction, density, interactions, empty/loading/destructive patterns, etc.) will be recorded here as they are agreed.
