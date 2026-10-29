import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { search as Search } from "./search";
import type { db as Db } from "./db";
import type { links as LinksTable } from "./schema";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-search-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");

describe("search", () => {
  let search: typeof Search;
  let db: typeof Db;
  let links: typeof LinksTable;

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
    ({ links } = await import("./schema"));
    ({ search } = await import("./search"));
  });

  beforeEach(async () => {
    await db.delete(links);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function seed(
    rows: Array<{ id: string; slug: string; url: string }>,
  ) {
    const now = new Date();
    await db.insert(links).values(
      rows.map((row) => ({
        ...row,
        clicks: 0,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  it("returns link SearchHits for matching rows", async () => {
    await seed([
      { id: "id-1", slug: "docs", url: "https://example.com/docs" },
      { id: "id-2", slug: "blog", url: "https://example.com/blog" },
    ]);

    const hits = await search("docs");
    expect(hits).toEqual([
      {
        type: "link",
        id: "id-1",
        title: "docs",
        subtitle: "https://example.com/docs",
        href: "/docs",
      },
    ]);
  });

  it("respects limit", async () => {
    await seed([
      { id: "1", slug: "one", url: "https://example.com/one" },
      { id: "2", slug: "two", url: "https://example.com/two" },
    ]);

    const hits = await search("example.com", { limit: 1 });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.type).toBe("link");
  });
});
