import { eq } from "drizzle-orm";
import { db } from "./db";
import { links } from "./schema";

/** Public redirect lookup — never exposes clicks or organizationId. */
export type PublicLink = {
  id: string;
  url: string;
  slug: string;
};

export async function findPublicLinkBySlug(
  slug: string,
): Promise<PublicLink | undefined> {
  const rows = await db
    .select({
      id: links.id,
      url: links.url,
      slug: links.slug,
    })
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);
  return rows[0];
}

export async function incrementPublicLinkClicks(id: string): Promise<void> {
  const rows = await db
    .select({ id: links.id, clicks: links.clicks })
    .from(links)
    .where(eq(links.id, id))
    .limit(1);
  const link = rows[0];
  if (!link) return;

  await db
    .update(links)
    .set({ clicks: link.clicks + 1 })
    .where(eq(links.id, id));
}

export async function slugIsTaken(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);
  return Boolean(rows[0]);
}
