import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("defaults to /app for missing or empty values", () => {
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath(123)).toBe("/app");
  });

  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app?q=docs")).toBe("/app?q=docs");
    expect(safeNextPath("/login")).toBe("/login");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("http://evil.com/path")).toBe("/app");
  });

  it("rejects backslash open-redirect bypasses", () => {
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath("/\\\\evil.com")).toBe("/app");
    expect(safeNextPath("/%5Cevil.com")).toBe("/app");
    expect(safeNextPath("/%5c%5cevil.com")).toBe("/app");
  });

  it("rejects encoded protocol-relative paths", () => {
    expect(safeNextPath("/%2F%2Fevil.com")).toBe("/app");
  });

  it("rejects whitespace and control characters", () => {
    expect(safeNextPath("/app\n")).toBe("/app");
    expect(safeNextPath("/ app")).toBe("/app");
  });
});
