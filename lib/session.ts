import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  auth,
  ensurePersonalOrganization,
  type Session,
} from "./auth";
import { db } from "./db";
import { member } from "./schema";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("You must be signed in");
  }
  return session;
}

/**
 * Per-request dedupe: layout and page data loaders share one restore.
 * Keyed by userId so distinct Session object identities still coalesce.
 */
const restoreByUserId = cache(
  async (
    userId: string,
    name: string,
    email: string,
  ): Promise<string | null> => {
    try {
      const organizationId = await ensurePersonalOrganization({
        id: userId,
        name,
        email,
      });

      await auth.api.setActiveOrganization({
        body: { organizationId },
        headers: await headers(),
      });

      return organizationId;
    } catch {
      return null;
    }
  },
);

async function isMember(userId: string, organizationId: string) {
  const rows = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);
  return Boolean(rows[0]);
}

/**
 * Return the session's active organization only if the user is still a
 * member of it. Otherwise (missing, or membership revoked while the session
 * lived on) restore the user's personal org and set it active on the session.
 */
export async function restoreActiveOrganization(
  session: Session,
): Promise<string | null> {
  const active = session.session.activeOrganizationId;
  if (active && (await isMember(session.user.id, active))) {
    return active;
  }

  return restoreByUserId(
    session.user.id,
    session.user.name,
    session.user.email,
  );
}

export async function requireActiveOrganization(): Promise<{
  session: Session;
  organizationId: string;
}> {
  const session = await requireSession();
  const organizationId = await restoreActiveOrganization(session);
  if (!organizationId) {
    throw new AuthError("No active organization");
  }
  return { session, organizationId };
}
