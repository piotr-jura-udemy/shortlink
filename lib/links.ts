"use server";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { createLinkSchema, updateLinkSchema } from "./link-schemas";
import { links, type Link } from "./schema";
import { AuthError, requireActiveOrganization } from "./session";

export type ActionResult =
  | { success: true; link: Link }
  | { success: false; error: string };

export type GetLinksOptions = {
  query?: string;
};

function generateSlug(): string {
  return nanoid(7);
}

/** Escape `\`, `%`, and `_` so user input is matched literally in LIKE patterns. */
function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function authFailure(error: unknown): ActionResult {
  if (error instanceof AuthError) {
    return { success: false, error: error.message };
  }
  throw error;
}

export async function getLinks(options?: GetLinksOptions): Promise<Link[]> {
  const { organizationId } = await requireActiveOrganization();
  const query = options?.query?.trim();

  if (!query) {
    return db
      .select()
      .from(links)
      .where(eq(links.organizationId, organizationId))
      .orderBy(desc(links.createdAt));
  }

  const pattern = `%${escapeLikePattern(query)}%`;
  return db
    .select()
    .from(links)
    .where(
      and(
        eq(links.organizationId, organizationId),
        or(
          sql`${links.slug} LIKE ${pattern} ESCAPE '\\'`,
          sql`${links.url} LIKE ${pattern} ESCAPE '\\'`,
        ),
      ),
    )
    .orderBy(desc(links.createdAt));
}

export async function getLinkBySlug(slug: string): Promise<Link | undefined> {
  const rows = await db.select().from(links).where(eq(links.slug, slug)).limit(1);
  return rows[0];
}

export async function createLink(input: unknown): Promise<ActionResult> {
  let organizationId: string;
  try {
    ({ organizationId } = await requireActiveOrganization());
  } catch (error) {
    return authFailure(error);
  }

  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { url } = parsed.data;
  let slug = parsed.data.slug ?? generateSlug();

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await getLinkBySlug(slug);
    if (!existing) break;
    if (parsed.data.slug) {
      return { success: false, error: "This slug is already taken" };
    }
    slug = generateSlug();
  }

  if (await getLinkBySlug(slug)) {
    return {
      success: false,
      error: "Could not generate a unique slug. Try again.",
    };
  }

  const id = nanoid();
  const now = new Date();

  await db.insert(links).values({
    id,
    url,
    slug,
    clicks: 0,
    organizationId,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(links).where(eq(links.id, id)).limit(1);
  revalidatePath("/");
  revalidatePath("/app");
  return { success: true, link: created[0]! };
}

export async function updateLink(input: unknown): Promise<ActionResult> {
  let organizationId: string;
  try {
    ({ organizationId } = await requireActiveOrganization());
  } catch (error) {
    return authFailure(error);
  }

  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { id, url, slug } = parsed.data;

  const existingRows = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.organizationId, organizationId)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    return { success: false, error: "Link not found" };
  }

  if (slug !== existing.slug) {
    const conflict = await getLinkBySlug(slug);
    if (conflict) {
      return { success: false, error: "This slug is already taken" };
    }
  }

  await db
    .update(links)
    .set({ url, slug, updatedAt: new Date() })
    .where(and(eq(links.id, id), eq(links.organizationId, organizationId)));

  const updated = await db.select().from(links).where(eq(links.id, id)).limit(1);
  revalidatePath("/");
  revalidatePath("/app");
  return { success: true, link: updated[0]! };
}

export async function deleteLink(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  let organizationId: string;
  try {
    ({ organizationId } = await requireActiveOrganization());
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  if (!id) {
    return { success: false, error: "Missing link id" };
  }

  const existingRows = await db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.id, id), eq(links.organizationId, organizationId)))
    .limit(1);
  if (!existingRows[0]) {
    return { success: false, error: "Link not found" };
  }

  await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.organizationId, organizationId)));
  revalidatePath("/");
  revalidatePath("/app");
  return { success: true };
}

export async function incrementClicks(id: string): Promise<void> {
  const rows = await db.select().from(links).where(eq(links.id, id)).limit(1);
  const link = rows[0];
  if (!link) return;

  await db
    .update(links)
    .set({ clicks: link.clicks + 1 })
    .where(eq(links.id, id));
}
