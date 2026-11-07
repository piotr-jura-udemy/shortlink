import { headers } from "next/headers";
import {
  auth,
  ensurePersonalOrganization,
  type Session,
} from "./auth";

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
 * If the session has no active organization (e.g. cleared via the org plugin),
 * restore the user's personal org and set it active on the session.
 */
export async function restoreActiveOrganization(
  session: Session,
): Promise<string | null> {
  if (session.session.activeOrganizationId) {
    return session.session.activeOrganizationId;
  }

  try {
    const organizationId = await ensurePersonalOrganization({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });

    await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: await headers(),
    });

    return organizationId;
  } catch {
    return null;
  }
}

export async function requireActiveOrganization(): Promise<{
  session: Session;
  organizationId: string;
}> {
  const session = await requireSession();
  let organizationId = session.session.activeOrganizationId ?? null;
  if (!organizationId) {
    organizationId = await restoreActiveOrganization(session);
  }
  if (!organizationId) {
    throw new AuthError("No active organization");
  }
  return { session, organizationId };
}
