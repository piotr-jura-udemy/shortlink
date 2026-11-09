import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("links server-action surface", () => {
  it("does not export getLinkBySlug or incrementClicks as server actions", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/links.ts"),
      "utf8",
    );
    expect(source).toMatch(/^"use server";/m);
    expect(source).not.toMatch(/export async function getLinkBySlug/);
    expect(source).not.toMatch(/export async function incrementClicks/);
  });

  it("keeps public redirect lookups outside the server-action module", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/public-links.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/"use server"/);
    expect(source).toMatch(/findPublicLinkBySlug/);

    const lookupSelect = source.slice(
      source.indexOf("export async function findPublicLinkBySlug"),
      source.indexOf("export async function incrementPublicLinkClicks"),
    );
    expect(lookupSelect).toMatch(/id: links\.id/);
    expect(lookupSelect).toMatch(/url: links\.url/);
    expect(lookupSelect).toMatch(/slug: links\.slug/);
    expect(lookupSelect).not.toMatch(/clicks:/);
    expect(lookupSelect).not.toMatch(/organizationId:/);
  });
});

