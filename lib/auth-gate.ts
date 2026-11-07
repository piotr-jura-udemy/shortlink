import { safeNextPath } from "./safe-next";

export type LoginGateSession = {
  email: string;
  activeOrganizationId: string | null | undefined;
};

export type LoginGateDecision =
  | { action: "show-sign-in"; next: string }
  | { action: "redirect"; next: string }
  | { action: "show-recovery"; email: string; next: string };

/**
 * Decide what /login (and /signup) should do for a given session + next param.
 *
 * A signed-in session without an active org must not redirect to /app — that
 * disagrees with the /app layout gate and creates an unescapable bounce.
 */
export function decideLoginGate(input: {
  session: LoginGateSession | null;
  nextParam: unknown;
  /** Result of attempting to restore/set an active organization. */
  restoredOrganizationId?: string | null;
}): LoginGateDecision {
  const next = safeNextPath(input.nextParam);

  if (!input.session) {
    return { action: "show-sign-in", next };
  }

  const hasActiveOrg = Boolean(input.session.activeOrganizationId);
  const restored = Boolean(input.restoredOrganizationId);
  if (hasActiveOrg || restored) {
    return { action: "redirect", next };
  }

  return {
    action: "show-recovery",
    email: input.session.email,
    next,
  };
}
