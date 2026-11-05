import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth-schemas";

describe("signUpSchema", () => {
  it("accepts a valid signup payload", () => {
    expect(
      signUpSchema.parse({
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      }),
    ).toEqual({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
    });
  });

  it("rejects short passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts email and password", () => {
    expect(
      signInSchema.parse({
        email: "ada@example.com",
        password: "password123",
      }),
    ).toEqual({
      email: "ada@example.com",
      password: "password123",
    });
  });

  it("rejects empty password", () => {
    const result = signInSchema.safeParse({
      email: "ada@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
