import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ipAddressOptionsFromEnv } from "./auth-ip";
import { db } from "./db";
import * as schema from "./schema";
import { consumeSignInAttempt } from "./sign-in-throttle";

/**
 * Invites are out of scope (ADR 0003) and there is no email verification, so
 * anyone could register an invited address and accept. Keep these off the
 * HTTP surface until an invite flow is designed.
 */
const DISABLED_ORGANIZATION_PATHS = [
  "/organization/invite-member",
  "/organization/accept-invitation",
  "/organization/reject-invitation",
  "/organization/cancel-invitation",
  "/organization/get-invitation",
  "/organization/list-invitations",
  "/organization/list-user-invitations",
  "/organization/remove-member",
  "/organization/update-member-role",
];

function slugifyOrg(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "org";
}

export async function getPersonalOrganizationId(userId: string) {
  const rows = await db
    .select({ organizationId: schema.member.organizationId })
    .from(schema.member)
    .where(eq(schema.member.userId, userId))
    .limit(1);
  return rows[0]?.organizationId ?? null;
}

/** Deduplicate concurrent ensure calls for the same user (layout + page race). */
const personalOrgInflight = new Map<string, Promise<string>>();

/**
 * Ensure the user has a personal organization.
 *
 * Better Auth queues `user.create.after` until after the surrounding
 * transaction, but the signup session is created inside that transaction —
 * so org creation must be available from `session.create.before`.
 *
 * Concurrent callers (e.g. /app layout + getLinks) share one in-flight promise
 * per userId, and creation re-checks membership after slug conflicts.
 */
export async function ensurePersonalOrganization(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  const existing = await getPersonalOrganizationId(user.id);
  if (existing) return existing;

  const inflight = personalOrgInflight.get(user.id);
  if (inflight) return inflight;

  const createPromise = createPersonalOrganization(user).finally(() => {
    personalOrgInflight.delete(user.id);
  });
  personalOrgInflight.set(user.id, createPromise);
  return createPromise;
}

async function createPersonalOrganization(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  const existing = await getPersonalOrganizationId(user.id);
  if (existing) return existing;

  const baseSlug = slugifyOrg(
    user.name || user.email?.split("@")[0] || "org",
  );
  const displayName = user.name?.trim() || "Personal";

  for (let attempt = 0; attempt < 8; attempt++) {
    const again = await getPersonalOrganizationId(user.id);
    if (again) return again;

    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${nanoid(6)}`;
    const orgId = nanoid();
    const now = new Date();

    try {
      await db.insert(schema.organization).values({
        id: orgId,
        name: `${displayName}'s workspace`,
        slug,
        createdAt: now,
      });
      await db.insert(schema.member).values({
        id: nanoid(),
        organizationId: orgId,
        userId: user.id,
        role: "owner",
        createdAt: now,
      });
      return orgId;
    } catch {
      const recovered = await getPersonalOrganizationId(user.id);
      if (recovered) return recovered;
      // Slug collision or transient conflict — retry with a new slug.
    }
  }

  const fallback = await getPersonalOrganizationId(user.id);
  if (fallback) return fallback;
  throw new Error("Could not create personal organization");
}

export const auth = betterAuth({
  appName: "shortlink",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  disabledPaths: DISABLED_ORGANIZATION_PATHS,
  advanced: {
    ipAddress: ipAddressOptionsFromEnv(),
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email: unknown = ctx.body?.email;
      if (typeof email !== "string") return;
      if (!(await consumeSignInAttempt(email))) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Too many sign-in attempts. Try again later.",
        });
      }
    }),
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Idempotent backup if a session was never created.
          await ensurePersonalOrganization(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const existingOrg = await getPersonalOrganizationId(session.userId);
          if (existingOrg) {
            return { data: { activeOrganizationId: existingOrg } };
          }

          const users = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);
          const organizationId = await ensurePersonalOrganization(
            users[0] ?? { id: session.userId },
          );
          return {
            data: {
              activeOrganizationId: organizationId,
            },
          };
        },
      },
    },
  },
  plugins: [organization(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
