import { lt, sql } from "drizzle-orm";
import { db } from "./db";
import { signInAttempt } from "./schema";

export const SIGN_IN_THROTTLE = {
  windowMs: 15 * 60_000,
  max: 10,
} as const;

/**
 * Record a sign-in attempt for `email` and report whether it is allowed.
 *
 * Keyed by account rather than client IP, so rotating `X-Forwarded-For`
 * cannot reset the budget. The upsert is a single statement, so concurrent
 * attempts cannot all read a stale count.
 */
export async function consumeSignInAttempt(
  email: string,
  now = Date.now(),
): Promise<boolean> {
  const key = email.trim().toLowerCase();
  const cutoff = now - SIGN_IN_THROTTLE.windowMs;
  const expired = sql`${signInAttempt.windowStart} <= ${cutoff}`;

  const rows = await db
    .insert(signInAttempt)
    .values({ key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: signInAttempt.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${signInAttempt.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${now} ELSE ${signInAttempt.windowStart} END`,
      },
    })
    .returning({ count: signInAttempt.count });

  await db.delete(signInAttempt).where(lt(signInAttempt.windowStart, cutoff));

  return (rows[0]?.count ?? 1) <= SIGN_IN_THROTTLE.max;
}
