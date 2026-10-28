import { describe, expect, it } from "vitest";
import { buildShortUrl } from "./short-url";

describe("buildShortUrl", () => {
  it("includes protocol and domain with the slug path", () => {
    expect(buildShortUrl("https://short.example", "launch")).toBe(
      "https://short.example/launch",
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildShortUrl("http://localhost:3000/", "abc")).toBe(
      "http://localhost:3000/abc",
    );
  });
});
