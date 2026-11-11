import { describe, expect, it } from "vitest";
import {
  createLinkSchema,
  slugSchema,
  updateLinkSchema,
} from "./link-schemas";

describe("slugSchema", () => {
  it("accepts alphanumeric slugs with hyphens and underscores", () => {
    expect(slugSchema.parse("abc-123_XYZ")).toBe("abc-123_XYZ");
  });

  it("trims whitespace", () => {
    expect(slugSchema.parse("  hello  ")).toBe("hello");
  });

  it("rejects empty slugs", () => {
    const result = slugSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects reserved slugs", () => {
    for (const slug of ["api", "app", "APP", "login", "signup", "Login"]) {
      const result = slugSchema.safeParse(slug);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("This slug is reserved");
      }
    }
  });

  it("rejects favicon.ico (invalid characters and reserved)", () => {
    const result = slugSchema.safeParse("favicon.ico");
    expect(result.success).toBe(false);
  });

  it("rejects invalid characters", () => {
    const result = slugSchema.safeParse("hello world");
    expect(result.success).toBe(false);
  });
});

describe("createLinkSchema", () => {
  it("requires a valid URL", () => {
    const result = createLinkSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a URL without a custom slug", () => {
    const result = createLinkSchema.safeParse({
      url: "https://example.com/path",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.com/path");
      expect(result.data.slug).toBeUndefined();
    }
  });

  it("treats blank slug as undefined", () => {
    const result = createLinkSchema.safeParse({
      url: "https://example.com",
      slug: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBeUndefined();
    }
  });

  it("rejects non-http(s) URL schemes", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "vbscript:msgbox(1)",
      "ftp://example.com/file",
    ]) {
      expect(createLinkSchema.safeParse({ url }).success, url).toBe(false);
    }
  });

  it("accepts http and https URLs", () => {
    for (const url of ["http://example.com", "https://example.com/a?b=c"]) {
      expect(createLinkSchema.safeParse({ url }).success, url).toBe(true);
    }
  });

  it("accepts an optional custom slug", () => {
    const result = createLinkSchema.safeParse({
      url: "https://example.com",
      slug: "docs",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("docs");
    }
  });
});

describe("updateLinkSchema", () => {
  it("requires id, url, and slug", () => {
    const result = updateLinkSchema.safeParse({
      id: "abc",
      url: "https://example.com",
      slug: "docs",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-http(s) URL schemes", () => {
    const result = updateLinkSchema.safeParse({
      id: "abc",
      url: "javascript:alert(document.cookie)",
      slug: "docs",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = updateLinkSchema.safeParse({
      id: "",
      url: "https://example.com",
      slug: "docs",
    });
    expect(result.success).toBe(false);
  });
});
