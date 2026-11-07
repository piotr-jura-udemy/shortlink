import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";
import * as schema from "./schema";

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

/**
 * Ensure the user has a personal organization.
 *
 * Better Auth queues `user.create.after` until after the surrounding
 * transaction, but the signup session is created inside that transaction —
 * so org creation must be available from `session.create.before`.
 */
export async function ensurePersonalOrganization(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const existing = await getPersonalOrganizationId(user.id);
  if (existing) return existing;

  const baseSlug = slugifyOrg(
    user.name || user.email?.split("@")[0] || "org",
  );
  let slug = baseSlug;
  for (let attempt = 0; attempt < 8; attempt++) {
    const conflict = await db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.slug, slug))
      .limit(1);
    if (!conflict[0]) break;
    slug = `${baseSlug}-${nanoid(6)}`;
  }

  const orgId = nanoid();
  const now = new Date();
  const displayName = user.name?.trim() || "Personal";
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
