import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { auth as Auth } from "./auth";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shortlink-auth-http-"));
const dbPath = path.join(tmpDir, "test.sqlite.db");
const baseURL = "http://localhost:3000";
const password = "correct-horse-battery";

describe("Better Auth HTTP handler hardening", () => {
  let auth: typeof Auth;

  beforeAll(async () => {
    process.env.SQLITE_PATH = dbPath;
    process.env.BETTER_AUTH_SECRET =
      process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";
    process.env.BETTER_AUTH_URL = baseURL;
    execSync("npx drizzle-kit migrate", {
      stdio: "pipe",
      env: { ...process.env, SQLITE_PATH: dbPath },
      cwd: process.cwd(),
    });
    ({ auth } = await import("./auth"));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function post(
    pathname: string,
    body: unknown,
    headers: Record<string, string> = {},
  ) {
    return auth.handler(
      new Request(`${baseURL}/api/auth${pathname}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseURL,
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  }

  async function createUser(email: string) {
    await auth.api.signUpEmail({
      body: { name: "Victim", email, password },
    });
  }

  it("throttles sign-in per account even when X-Forwarded-For rotates", async () => {
    const email = "victim@example.com";
    await createUser(email);

    const statuses: number[] = [];
    for (let i = 1; i <= 15; i++) {
      const response = await post(
        "/sign-in/email",
        { email, password: `wrong-guess-${i}` },
        { "x-forwarded-for": `203.0.113.${i}` },
      );
      statuses.push(response.status);
    }

    expect(statuses).toContain(429);

    // Once throttled, even the right password from a fresh "IP" is refused.
    const blocked = await post(
      "/sign-in/email",
      { email, password },
      { "x-forwarded-for": "198.51.100.77" },
    );
    expect(blocked.status).toBe(429);
  });

  it("does not throttle a different account", async () => {
    const email = "bystander@example.com";
    await createUser(email);

    const response = await post(
      "/sign-in/email",
      { email, password },
      { "x-forwarded-for": "198.51.100.10" },
    );
    expect(response.status).toBe(200);
  });

  it("does not expose organization invitation or member-management endpoints", async () => {
    const email = "owner@example.com";
    await createUser(email);
    const signIn = await post(
      "/sign-in/email",
      { email, password },
      { "x-forwarded-for": "198.51.100.20" },
    );
    expect(signIn.status).toBe(200);
    const cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    const disabled: Array<[string, unknown]> = [
      ["/organization/invite-member", { email: "x@example.com", role: "member" }],
      ["/organization/accept-invitation", { invitationId: "abc" }],
      ["/organization/reject-invitation", { invitationId: "abc" }],
      ["/organization/cancel-invitation", { invitationId: "abc" }],
      ["/organization/remove-member", { memberIdOrEmail: "x@example.com" }],
      ["/organization/update-member-role", { memberId: "abc", role: "owner" }],
    ];
    for (const [pathname, body] of disabled) {
      const response = await post(pathname, body, {
        cookie,
        "x-forwarded-for": "198.51.100.20",
      });
      expect(response.status, pathname).toBe(404);
    }

    for (const pathname of [
      "/organization/get-invitation?id=abc",
      "/organization/list-invitations",
      "/organization/list-user-invitations",
    ]) {
      const response = await auth.handler(
        new Request(`${baseURL}/api/auth${pathname}`, {
          headers: { cookie, origin: baseURL },
        }),
      );
      expect(response.status, pathname).toBe(404);
    }
  });
});
