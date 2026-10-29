/**
 * Populate the configured SQLite database with sample short links.
 *
 * Honors SQLITE_PATH (same resolution as lib/db.ts / drizzle.config.ts).
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --force   # replace existing rows
 */
import { createClient } from "@libsql/client";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createLinkSchema } from "../lib/link-schemas";
import { links } from "../lib/schema";

export const SEED_LINKS = [
  { slug: "docs", url: "https://nextjs.org/docs", clicks: 42 },
  { slug: "tailwind", url: "https://tailwindcss.com/docs", clicks: 18 },
  { slug: "drizzle", url: "https://orm.drizzle.team/docs/overview", clicks: 27 },
  { slug: "vitest", url: "https://vitest.dev/guide/", clicks: 9 },
  { slug: "playwright", url: "https://playwright.dev/docs/intro", clicks: 14 },
  { slug: "shadcn", url: "https://ui.shadcn.com/docs", clicks: 31 },
  { slug: "zod", url: "https://zod.dev/", clicks: 6 },
  { slug: "nanoid", url: "https://github.com/ai/nanoid", clicks: 3 },
  { slug: "libsql", url: "https://docs.turso.tech/libsql", clicks: 11 },
  { slug: "mdn-fetch", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", clicks: 22 },
  { slug: "rfc3986", url: "https://www.rfc-editor.org/rfc/rfc3986", clicks: 1 },
  { slug: "example", url: "https://example.com/", clicks: 0 },
] as const;

function resolveDbPath(): string {
  if (process.env.SQLITE_PATH) {
    return path.isAbsolute(process.env.SQLITE_PATH)
      ? process.env.SQLITE_PATH
      : path.join(process.cwd(), process.env.SQLITE_PATH);
  }
  return path.join(process.cwd(), "sqlite.db");
}

async function main() {
  const force = process.argv.includes("--force");
  const dbPath = resolveDbPath();
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client, { schema: { links } });

  const [{ value: existingCount }] = await db.select({ value: count() }).from(links);

  if (existingCount > 0 && !force) {
    console.log(
      `Skipping seed: ${existingCount} link(s) already in ${dbPath} (pass --force to replace).`,
    );
    return;
  }

  if (existingCount > 0 && force) {
    await db.delete(links);
    console.log(`Cleared ${existingCount} existing link(s).`);
  }

  const now = Date.now();
  const rows = SEED_LINKS.map((item, index) => {
    const parsed = createLinkSchema.safeParse({ url: item.url, slug: item.slug });
    if (!parsed.success) {
      throw new Error(
        `Invalid seed link "${item.slug}": ${parsed.error.issues[0]?.message}`,
      );
    }

    const createdAt = new Date(now - (SEED_LINKS.length - index) * 60_000);
    return {
      id: nanoid(),
      url: parsed.data.url,
      slug: parsed.data.slug ?? item.slug,
      clicks: item.clicks,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await db.insert(links).values(rows);
  console.log(`Seeded ${rows.length} links into ${dbPath}`);
}

function isExecutedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isExecutedDirectly()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
