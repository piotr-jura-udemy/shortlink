# Architecture Decision Records

ADRs in this directory capture **important, durable decisions** for shortlink.

They exist so humans and agents share the same rationale, and so those choices are **not casually reversed** during day-to-day coding.

## Rules

1. **Read before changing architecture.** Check this folder when touching stack, auth, data storage, API style, or similar cross-cutting concerns.
2. **Do not silently overturn an Accepted ADR.** Implement within the decision, or propose a new ADR that supersedes it.
3. **One decision per ADR.** Keep each record focused.
4. **Number sequentially.** Filenames are `NNNN-short-title.md` (`0001`, `0002`, …). Never reuse a number.
5. **Status matters.**
   - `Proposed` — under discussion; not binding yet
   - `Accepted` — current binding decision
   - `Superseded by NNNN` — replaced; keep the file for history
   - `Deprecated` — no longer applies; keep the file for history

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN | Deprecated
- Date: YYYY-MM-DD
- Deciders: …

## Context

What problem or forces led to a decision?

## Decision

What we chose, in concrete terms.

## Consequences

Gains, costs, and constraints. Call out what becomes harder.

## Alternatives considered

What we rejected and why (brief).
```
