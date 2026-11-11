import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { nanoid } from "nanoid";
import type { db as Db } from "./db";
import type { member as MemberTable, user as UserTable } from "./schema";
import type { ensurePersonalOrganization as EnsurePersonalOrganization } from "./auth";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-org-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");

describe("ensurePersonalOrganization concurrency", () => {
  let ensurePersonalOrganization: typeof EnsurePersonalOrganization;
  let db: typeof Db;
  let user: typeof UserTable;
  let member: typeof MemberTable;

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
    ({ user, member } = await import("./schema"));
    ({ ensurePersonalOrganization } = await import("./auth"));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates only one membership when called in parallel for the same user", async () => {
    const userId = nanoid();
    const now = new Date();
    await db.insert(user).values({
      id: userId,
      name: "Race User",
      email: `race-${userId}@example.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    const person = {
      id: userId,
      name: "Race User",
      email: `race-${userId}@example.com`,
    };

    const [a, b, c] = await Promise.all([
      ensurePersonalOrganization(person),
      ensurePersonalOrganization(person),
      ensurePersonalOrganization(person),
    ]);

    expect(a).toBe(b);
    expect(b).toBe(c);

    const memberships = await db
      .select()
      .from(member)
      .where(eq(member.userId, userId));
    expect(memberships).toHaveLength(1);
  });
});
