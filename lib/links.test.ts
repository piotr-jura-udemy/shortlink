import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { getLinks as GetLinks } from "./links";
import type { db as Db } from "./db";
import type { links as LinksTable } from "./schema";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-links-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");

describe("getLinks({ query })", () => {
  let getLinks: typeof GetLinks;
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
    ({ getLinks } = await import("./links"));
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

  it("returns all links when query is empty or omitted", async () => {
    await seed([
      { id: "1", slug: "alpha", url: "https://example.com/a" },
      { id: "2", slug: "beta", url: "https://example.com/b" },
    ]);

    expect(await getLinks()).toHaveLength(2);
    expect(await getLinks({ query: "   " })).toHaveLength(2);
  });

  it("matches slug substrings", async () => {
    await seed([
      { id: "1", slug: "docs-api", url: "https://example.com/docs" },
      { id: "2", slug: "blog", url: "https://example.com/blog" },
    ]);

    const results = await getLinks({ query: "docs" });
    expect(results.map((l) => l.slug)).toEqual(["docs-api"]);
  });

  it("matches url substrings", async () => {
    await seed([
      { id: "1", slug: "a", url: "https://example.com/pricing" },
      { id: "2", slug: "b", url: "https://other.test/home" },
    ]);

    const results = await getLinks({ query: "pricing" });
    expect(results.map((l) => l.slug)).toEqual(["a"]);
  });

  it("returns empty when nothing matches", async () => {
    await seed([
      { id: "1", slug: "alpha", url: "https://example.com/a" },
    ]);

    expect(await getLinks({ query: "zzzz" })).toEqual([]);
  });

  it("treats % and _ in the query as literals", async () => {
    await seed([
      { id: "1", slug: "a_b", url: "https://example.com/100%off" },
      { id: "2", slug: "ab", url: "https://example.com/plain" },
      { id: "3", slug: "axb", url: "https://example.com/x" },
    ]);

    expect((await getLinks({ query: "_" })).map((l) => l.slug)).toEqual([
      "a_b",
    ]);
    expect((await getLinks({ query: "%" })).map((l) => l.slug)).toEqual([
      "a_b",
    ]);
    expect((await getLinks({ query: "100%off" })).map((l) => l.slug)).toEqual([
      "a_b",
    ]);
  });
});
