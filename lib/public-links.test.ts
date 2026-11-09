import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { db as Db } from "./db";
import type { links as LinksTable, organization as OrganizationTable } from "./schema";
import type {
  findPublicLinkBySlug as FindPublicLinkBySlug,
  incrementPublicLinkClicks as IncrementPublicLinkClicks,
} from "./public-links";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-public-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");
const orgId = "org-public";

describe("findPublicLinkBySlug", () => {
  let findPublicLinkBySlug: typeof FindPublicLinkBySlug;
  let incrementPublicLinkClicks: typeof IncrementPublicLinkClicks;
  let db: typeof Db;
  let links: typeof LinksTable;
  let organization: typeof OrganizationTable;

  beforeAll(async () => {
    process.env.SQLITE_PATH = dbPath;
    for (const suffix of ["", "-wal", "-shm"]) {
      const p = `${dbPath}${suffix}`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    execSync("npx drizzle-kit migrate", {
      stdio: "pipe",
      env: { ...process.env, SQLITE_PATH: dbPath },
      cwd: process.cwd(),
    });
    ({ db } = await import("./db"));
    ({ links, organization } = await import("./schema"));
    ({ findPublicLinkBySlug, incrementPublicLinkClicks } = await import(
      "./public-links"
    ));

    await db.insert(organization).values({
      id: orgId,
      name: "Public Org",
      slug: "public-org",
      createdAt: new Date(),
    });
  });

  beforeEach(async () => {
    await db.delete(links);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns only id, url, and slug — not clicks or organizationId", async () => {
    const now = new Date();
    await db.insert(links).values({
      id: "link-1",
      url: "https://example.com/secret",
      slug: "secret",
      clicks: 99,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    });

    const result = await findPublicLinkBySlug("secret");
    expect(result).toEqual({
      id: "link-1",
      url: "https://example.com/secret",
      slug: "secret",
    });
    expect(result).not.toHaveProperty("clicks");
    expect(result).not.toHaveProperty("organizationId");
  });

  it("counts every click when redirects happen concurrently", async () => {
    const now = new Date();
    await db.insert(links).values({
      id: "link-busy",
      url: "https://example.com/busy",
      slug: "busy",
      clicks: 0,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      Array.from({ length: 20 }, () => incrementPublicLinkClicks("link-busy")),
    );

    const rows = await db.select().from(links);
    expect(rows[0]?.clicks).toBe(20);
  });
});
