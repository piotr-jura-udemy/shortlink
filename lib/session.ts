import { headers } from "next/headers";
import { auth, type Session } from "./auth";

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

export async function requireActiveOrganization(): Promise<{
  session: Session;
  organizationId: string;
}> {
  const session = await requireSession();
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    throw new AuthError("No active organization");
  }
  return { session, organizationId };
}
