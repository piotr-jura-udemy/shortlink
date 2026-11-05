/**
 * Populate the configured SQLite database with sample users, orgs, and links.
 *
 * Honors SQLITE_PATH (same resolution as lib/db.ts / drizzle.config.ts).
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --force   # replace existing rows
 */
import { createClient } from "@libsql/client";
import { hashPassword } from "better-auth/crypto";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { nanoid } from "nanoid";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createLinkSchema } from "../lib/link-schemas";
import {
  account,
  invitation,
  links,
  member,
  organization,
  rateLimit,
  session,
  user,
  verification,
} from "../lib/schema";

export const SEED_USERS = [
  {
    name: "Alice Demo",
    email: "alice@example.com",
    password: "password123",
    orgName: "Alice's workspace",
    orgSlug: "alice-demo",
  },
  {
    name: "Bob Demo",
    email: "bob@example.com",
    password: "password123",
    orgName: "Bob's workspace",
    orgSlug: "bob-demo",
  },
] as const;

export const SEED_LINKS = [
  { slug: "docs", url: "https://nextjs.org/docs", clicks: 42, owner: 0 },
  { slug: "tailwind", url: "https://tailwindcss.com/docs", clicks: 18, owner: 0 },
  {
    slug: "drizzle",
    url: "https://orm.drizzle.team/docs/overview",
    clicks: 27,
    owner: 0,
  },
  { slug: "vitest", url: "https://vitest.dev/guide/", clicks: 9, owner: 0 },
  {
    slug: "playwright",
    url: "https://playwright.dev/docs/intro",
    clicks: 14,
    owner: 0,
  },
  { slug: "shadcn", url: "https://ui.shadcn.com/docs", clicks: 31, owner: 0 },
  { slug: "zod", url: "https://zod.dev/", clicks: 6, owner: 1 },
  { slug: "nanoid", url: "https://github.com/ai/nanoid", clicks: 3, owner: 1 },
  { slug: "libsql", url: "https://docs.turso.tech/libsql", clicks: 11, owner: 1 },
  {
    slug: "mdn-fetch",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
    clicks: 22,
    owner: 1,
  },
  {
    slug: "rfc3986",
    url: "https://www.rfc-editor.org/rfc/rfc3986",
    clicks: 1,
    owner: 1,
  },
  { slug: "example", url: "https://example.com/", clicks: 0, owner: 1 },
] as const;

function resolveDbPath(): string {
  if (process.env.SQLITE_PATH) {
    return path.isAbsolute(process.env.SQLITE_PATH)
      ? process.env.SQLITE_PATH
      : path.join(process.cwd(), process.env.SQLITE_PATH);
  }
  return path.join(process.cwd(), "sqlite.db");
}

async function clearAll(
  db: ReturnType<typeof drizzle>,
) {
  await db.delete(links);
  await db.delete(invitation);
  await db.delete(member);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(rateLimit);
  await db.delete(organization);
  await db.delete(user);
}

async function main() {
  const force = process.argv.includes("--force");
  const dbPath = resolveDbPath();
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(user);

  if (existingCount > 0 && !force) {
    console.log(
      `Skipping seed: ${existingCount} user(s) already in ${dbPath} (pass --force to replace).`,
    );
    return;
  }

  if (existingCount > 0 && force) {
    await clearAll(db);
    console.log(`Cleared existing auth and link rows.`);
  }

  const now = new Date();
  const orgIds: string[] = [];

  for (const seedUser of SEED_USERS) {
    const userId = nanoid();
    const orgId = nanoid();
    orgIds.push(orgId);
    const passwordHash = await hashPassword(seedUser.password);

    await db.insert(user).values({
      id: userId,
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(account).values({
      id: nanoid(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(organization).values({
      id: orgId,
      name: seedUser.orgName,
      slug: seedUser.orgSlug,
      createdAt: now,
    });
    await db.insert(member).values({
      id: nanoid(),
      organizationId: orgId,
      userId,
      role: "owner",
      createdAt: now,
    });
  }

  const linkNow = Date.now();
  const rows = SEED_LINKS.map((item, index) => {
    const parsed = createLinkSchema.safeParse({
      url: item.url,
      slug: item.slug,
    });
    if (!parsed.success) {
      throw new Error(
        `Invalid seed link "${item.slug}": ${parsed.error.issues[0]?.message}`,
      );
    }

    const organizationId = orgIds[item.owner];
    if (!organizationId) {
      throw new Error(`Missing org for seed owner index ${item.owner}`);
    }

    const createdAt = new Date(linkNow - (SEED_LINKS.length - index) * 60_000);
    return {
      id: nanoid(),
      url: parsed.data.url,
      slug: parsed.data.slug ?? item.slug,
      clicks: item.clicks,
      organizationId,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await db.insert(links).values(rows);
  console.log(
    `Seeded ${SEED_USERS.length} users, ${orgIds.length} orgs, and ${rows.length} links into ${dbPath}`,
  );
  for (const seedUser of SEED_USERS) {
    console.log(`  ${seedUser.email} / ${seedUser.password}`);
  }
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
