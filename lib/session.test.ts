import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { db as Db } from "./db";
import type * as SchemaModule from "./schema";
import type * as SessionModule from "./session";

const { getSessionMock, setActiveOrganizationMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  setActiveOrganizationMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("./auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./auth")>();
  return {
    ...actual,
    auth: {
      api: {
        getSession: getSessionMock,
        setActiveOrganization: setActiveOrganizationMock,
      },
    },
  };
});

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-session-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");

describe("active organization membership", () => {
  let db: typeof Db;
  let schema: typeof SchemaModule;
  let session: typeof SessionModule;

  const userId = "user-member";
  const personalOrgId = "org-personal";
  const foreignOrgId = "org-foreign";

  function sessionWithActiveOrg(activeOrganizationId: string | null) {
    return {
      user: { id: userId, name: "Member", email: "member@example.com" },
      session: { id: "sess-1", userId, activeOrganizationId },
    };
  }

  beforeAll(async () => {
    process.env.SQLITE_PATH = dbPath;
    process.env.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";
    process.env.BETTER_AUTH_URL =
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    execSync("npx drizzle-kit migrate", {
      stdio: "pipe",
      env: { ...process.env, SQLITE_PATH: dbPath },
      cwd: process.cwd(),
    });
    ({ db } = await import("./db"));
    schema = await import("./schema");
    session = await import("./session");

    const now = new Date();
    await db.insert(schema.user).values({
      id: userId,
      name: "Member",
      email: "member@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(schema.organization).values([
      { id: personalOrgId, name: "Personal", slug: "personal", createdAt: now },
      { id: foreignOrgId, name: "Foreign", slug: "foreign", createdAt: now },
    ]);
    await db.insert(schema.member).values({
      id: nanoid(),
      organizationId: personalOrgId,
      userId,
      role: "owner",
      createdAt: now,
    });
  });

  beforeEach(() => {
    getSessionMock.mockReset();
    setActiveOrganizationMock.mockReset();
    setActiveOrganizationMock.mockResolvedValue(null);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("keeps the active organization when the user is a member", async () => {
    getSessionMock.mockResolvedValue(sessionWithActiveOrg(personalOrgId));

    const { organizationId } = await session.requireActiveOrganization();

    expect(organizationId).toBe(personalOrgId);
    expect(setActiveOrganizationMock).not.toHaveBeenCalled();
  });

  it("does not authorize an active organization the user is not a member of", async () => {
    // e.g. the user was removed from the org but their session still points at it.
    getSessionMock.mockResolvedValue(sessionWithActiveOrg(foreignOrgId));

    const { organizationId } = await session.requireActiveOrganization();

    expect(organizationId).not.toBe(foreignOrgId);
    expect(organizationId).toBe(personalOrgId);
    expect(setActiveOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({ body: { organizationId: personalOrgId } }),
    );
  });

  it("restoreActiveOrganization replaces a stale non-member org", async () => {
    const restored = await session.restoreActiveOrganization(
      sessionWithActiveOrg(foreignOrgId) as never,
    );

    expect(restored).toBe(personalOrgId);
  });
});
