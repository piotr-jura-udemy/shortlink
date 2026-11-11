import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("auth-actions rate-limit path", () => {
  it("does not call auth.api sign-in/sign-up (those bypass Better Auth rate limits)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/auth-actions.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/auth\.api\.signInEmail/);
    expect(source).not.toMatch(/auth\.api\.signUpEmail/);
    expect(source).toMatch(/auth\.api\.signOut/);
  });

  it("documents that login/signup must use the HTTP auth client", () => {
    const signIn = readFileSync(
      path.join(process.cwd(), "components/auth/sign-in-form.tsx"),
      "utf8",
    );
    const signUp = readFileSync(
      path.join(process.cwd(), "components/auth/sign-up-form.tsx"),
      "utf8",
    );
    expect(signIn).toMatch(/authClient\.signIn\.email/);
    expect(signUp).toMatch(/authClient\.signUp\.email/);
    expect(signIn).not.toMatch(/signInAction/);
    expect(signUp).not.toMatch(/signUpAction/);
  });
});
