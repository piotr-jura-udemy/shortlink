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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |
