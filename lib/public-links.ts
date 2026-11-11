import { eq, sql } from "drizzle-orm";
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
  await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
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
