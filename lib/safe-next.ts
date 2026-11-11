const DEFAULT_NEXT = "/app";

/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Rejects protocol-relative URLs, backslash tricks, and absolute URLs.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || next.length === 0) {
    return DEFAULT_NEXT;
  }

  let value = next;
  try {
    // Decode once so encoded bypasses like /%5Cevil.com are caught.
    value = decodeURIComponent(next);
  } catch {
    return DEFAULT_NEXT;
  }

  if (!value.startsWith("/")) return DEFAULT_NEXT;
  if (value.startsWith("//")) return DEFAULT_NEXT;
  if (value.includes("\\")) return DEFAULT_NEXT;
  if (value.includes("://")) return DEFAULT_NEXT;
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return DEFAULT_NEXT;

  return value;
}
