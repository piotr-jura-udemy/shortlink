import { describe, expect, it } from "vitest";
import { createLinkSchema } from "../lib/link-schemas";
import { SEED_LINKS, SEED_USERS } from "./seed";

describe("SEED_USERS", () => {
  it("includes two demo users for isolation", () => {
    expect(SEED_USERS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(SEED_USERS.map((u) => u.email)).size).toBe(SEED_USERS.length);
  });
});

describe("SEED_LINKS", () => {
  it("includes at least ten sample links", () => {
    expect(SEED_LINKS.length).toBeGreaterThanOrEqual(10);
  });

  it("uses unique slugs", () => {
    const slugs = SEED_LINKS.map((link) => link.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("assigns links across both seed owners", () => {
    const owners = new Set(SEED_LINKS.map((link) => link.owner));
    expect(owners.has(0)).toBe(true);
    expect(owners.has(1)).toBe(true);
  });

  it("passes createLinkSchema validation", () => {
    for (const link of SEED_LINKS) {
      const parsed = createLinkSchema.safeParse({
        url: link.url,
        slug: link.slug,
      });
      expect(parsed.success, link.slug).toBe(true);
    }
  });
});
