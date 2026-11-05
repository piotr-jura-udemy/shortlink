import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { getLinks as GetLinks } from "./links";
import type { createLink as CreateLink } from "./links";
import type { updateLink as UpdateLink } from "./links";
import type { deleteLink as DeleteLink } from "./links";
import type { db as Db } from "./db";
import type { links as LinksTable } from "./schema";
import type { organization as OrganizationTable } from "./schema";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-links-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");

const orgA = "org-a";
const orgB = "org-b";
let activeOrg = orgA;

vi.mock("./session", () => ({
  AuthError: class AuthError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "AuthError";
    }
  },
  requireActiveOrganization: vi.fn(async () => ({
    organizationId: activeOrg,
    session: {
      user: { id: "user-a", email: "a@example.com", name: "A" },
      session: { id: "sess", activeOrganizationId: activeOrg },
    },
  })),
  requireSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("getLinks({ query })", () => {
  let getLinks: typeof GetLinks;
  let createLink: typeof CreateLink;
  let updateLink: typeof UpdateLink;
  let deleteLink: typeof DeleteLink;
  let db: typeof Db;
  let links: typeof LinksTable;
  let organization: typeof OrganizationTable;

  beforeAll(async () => {
    process.env.SQLITE_PATH = dbPath;
    process.env.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";
    process.env.BETTER_AUTH_URL =
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
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
    ({ getLinks, createLink, updateLink, deleteLink } = await import("./links"));

    const now = new Date();
    await db.insert(organization).values([
      { id: orgA, name: "Org A", slug: "org-a", createdAt: now },
      { id: orgB, name: "Org B", slug: "org-b", createdAt: now },
    ]);
  });

  beforeEach(async () => {
    activeOrg = orgA;
    await db.delete(links);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function seed(
    rows: Array<{
      id: string;
      slug: string;
      url: string;
      organizationId?: string;
    }>,
  ) {
    const now = new Date();
    await db.insert(links).values(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        url: row.url,
        organizationId: row.organizationId ?? orgA,
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
      { id: "2", slug: "b", url: "https://example.com/home" },
    ]);

    const results = await getLinks({ query: "pricing" });
    expect(results.map((l) => l.slug)).toEqual(["a"]);
  });

  it("returns empty when nothing matches", async () => {
    await seed([{ id: "1", slug: "alpha", url: "https://example.com/a" }]);

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

  it("scopes list results to the active organization", async () => {
    await seed([
      { id: "1", slug: "mine", url: "https://example.com/a", organizationId: orgA },
      { id: "2", slug: "theirs", url: "https://example.com/b", organizationId: orgB },
    ]);

    expect((await getLinks()).map((l) => l.slug)).toEqual(["mine"]);

    activeOrg = orgB;
    expect((await getLinks()).map((l) => l.slug)).toEqual(["theirs"]);
  });

  it("rejects cross-org update and delete", async () => {
    await seed([
      {
        id: "foreign",
        slug: "foreign",
        url: "https://example.com/x",
        organizationId: orgB,
      },
    ]);

    const updated = await updateLink({
      id: "foreign",
      url: "https://example.com/y",
      slug: "foreign",
    });
    expect(updated).toEqual({ success: false, error: "Link not found" });

    const deleted = await deleteLink("foreign");
    expect(deleted).toEqual({ success: false, error: "Link not found" });
  });

  it("creates links under the active organization", async () => {
    const created = await createLink({
      url: "https://example.com/new",
      slug: "brand-new",
    });
    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.link.organizationId).toBe(orgA);
    }
  });
});
