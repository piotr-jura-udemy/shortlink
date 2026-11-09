"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Sign-in and sign-up intentionally go through the Better Auth HTTP client
 * (`authClient` → `/api/auth/...`) so built-in rate limits apply.
 * Do not sign in or sign up via `auth.api` from Server Actions — that path
 * bypasses `rateLimit`.
 */
export async function signOutAction(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}
