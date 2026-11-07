import { describe, expect, it } from "vitest";
import { decideLoginGate, type LoginGateDecision } from "./auth-gate";
import { safeNextPath } from "./safe-next";

/** Pre-fix buggy gate: any session redirected, even without an active org. */
function legacyDecideLoginGate(input: {
  session: { email: string; activeOrganizationId: string | null } | null;
  nextParam: unknown;
}): LoginGateDecision {
  const next = safeNextPath(input.nextParam);
  if (input.session) {
    return { action: "redirect", next };
  }
  return { action: "show-sign-in", next };
}

/** Pre-fix next sanitizer that still accepts `/\\evil.com`. */
function legacySafeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/app";
  return next;
}

describe("login gate / missing active organization", () => {
  const sessionWithoutOrg = {
    email: "alice@example.com",
    activeOrganizationId: null,
  };

  it("reproduces the Bugbot loop under the legacy gate", () => {
    // Signed in, no active org, next=/app → legacy always redirects to /app,
    // while /app layout sends the user back to /login.
    expect(
      legacyDecideLoginGate({
        session: sessionWithoutOrg,
        nextParam: "/app",
      }),
    ).toEqual({ action: "redirect", next: "/app" });
  });

  it("does not redirect when org is missing and cannot be restored", () => {
    expect(
      decideLoginGate({
        session: sessionWithoutOrg,
        nextParam: "/app",
        restoredOrganizationId: null,
      }),
    ).toEqual({
      action: "show-recovery",
      email: "alice@example.com",
      next: "/app",
    });
  });

  it("redirects after a successful org restore", () => {
    expect(
      decideLoginGate({
        session: sessionWithoutOrg,
        nextParam: "/app",
        restoredOrganizationId: "org_1",
      }),
    ).toEqual({ action: "redirect", next: "/app" });
  });

  it("redirects when the session already has an active org", () => {
    expect(
      decideLoginGate({
        session: {
          email: "alice@example.com",
          activeOrganizationId: "org_1",
        },
        nextParam: "/app",
      }),
    ).toEqual({ action: "redirect", next: "/app" });
  });

  it("shows the sign-in form when logged out", () => {
    expect(
      decideLoginGate({
        session: null,
        nextParam: "/app",
      }),
    ).toEqual({ action: "show-sign-in", next: "/app" });
  });
});

describe("open redirect on next param", () => {
  const bypasses = [
    "/\\evil.com",
    "/\\\\evil.com",
    "/%5Cevil.com",
    "/%2F%2Fevil.com",
    "//evil.com",
  ];

  it("reproduces the Bugbot bypass under the legacy sanitizer", () => {
    expect(legacySafeNextPath("/\\evil.com")).toBe("/\\evil.com");
    expect(legacySafeNextPath("/%5Cevil.com")).toBe("/%5Cevil.com");
  });

  it("rejects the Bugbot bypass payloads", () => {
    for (const payload of bypasses) {
      expect(safeNextPath(payload), payload).toBe("/app");
    }
  });
});
