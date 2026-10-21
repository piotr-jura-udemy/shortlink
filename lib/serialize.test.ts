import { describe, expect, it } from "vitest";
import { serializeLink } from "./serialize";
import type { Link } from "./schema";

describe("serializeLink", () => {
  it("converts Date fields to ISO strings", () => {
    const createdAt = new Date("2026-01-15T12:00:00.000Z");
    const updatedAt = new Date("2026-01-16T08:30:00.000Z");
    const link: Link = {
      id: "id_1",
      url: "https://example.com",
      slug: "ex",
      clicks: 3,
      createdAt,
      updatedAt,
    };

    expect(serializeLink(link)).toEqual({
      id: "id_1",
      url: "https://example.com",
      slug: "ex",
      clicks: 3,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-16T08:30:00.000Z",
    });
  });
});
