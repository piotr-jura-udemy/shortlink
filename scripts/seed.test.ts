import { describe, expect, it } from "vitest";
import { createLinkSchema } from "../lib/link-schemas";
import { SEED_LINKS } from "./seed";

describe("SEED_LINKS", () => {
  it("includes at least ten sample links", () => {
    expect(SEED_LINKS.length).toBeGreaterThanOrEqual(10);
  });

  it("uses unique slugs", () => {
    const slugs = SEED_LINKS.map((link) => link.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
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
