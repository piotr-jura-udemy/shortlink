# shortlink

A Dub-inspired URL shortener with email/password accounts. Each signup gets a default organization; links and click stats stay private to that workspace. Public short-link redirects stay public.

## Stack

- Next.js 16 (App Router)
- Better Auth (email/password + organization plugin)
- Tailwind CSS + shadcn/ui
- Drizzle ORM + SQLite (`@libsql/client`)
- Zod

## Setup

```bash
npm install
cp .env.example .env.local   # set BETTER_AUTH_SECRET and BETTER_AUTH_URL
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:seed` creates two demo users (see script output for passwords), default orgs, and sample links split across them. Pass `--force` to replace existing rows.

### Cursor worktrees

When Cursor creates a git worktree, [`.cursor/worktrees.json`](.cursor/worktrees.json) runs [`.cursor/setup-worktree-unix.sh`](.cursor/setup-worktree-unix.sh): `npm ci`, a worktree-local SQLite file (`sqlite.worktree.db` via `.env.local`), auth env vars, migrations, seed data, and Playwright Chromium. That keeps each agent checkout isolated from the primary `sqlite.db`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert sample users, orgs, and links (use `-- --force` to replace) |
| `npm run db:studio` | Open Drizzle Studio |
