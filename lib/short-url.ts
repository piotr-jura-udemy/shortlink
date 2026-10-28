/** Full shortened URL including protocol and domain. */
export function buildShortUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/${slug}`;
}
