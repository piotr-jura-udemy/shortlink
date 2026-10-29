# shortlink

A simple Dub-inspired URL shortener. No auth — create, edit, delete short links and track clicks.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS + shadcn/ui
- Drizzle ORM + SQLite (`@libsql/client`)
- Zod

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:seed` loads a dozen sample links. Pass `--force` to replace existing rows.

### Cursor worktrees

When Cursor creates a git worktree, [`.cursor/worktrees.json`](.cursor/worktrees.json) runs [`.cursor/setup-worktree-unix.sh`](.cursor/setup-worktree-unix.sh): `npm ci`, a worktree-local SQLite file (`sqlite.worktree.db` via `.env.local`), migrations, seed data, and Playwright Chromium. That keeps each agent checkout isolated from the primary `sqlite.db`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert sample links (use `-- --force` to replace) |
| `npm run db:studio` | Open Drizzle Studio |
