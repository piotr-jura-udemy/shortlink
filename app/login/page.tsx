import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SessionRecovery } from "@/components/auth/session-recovery";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNextPath } from "@/lib/safe-next";
import { getSession, restoreActiveOrganization } from "@/lib/session";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));

  if (session) {
    if (session.session.activeOrganizationId) {
      redirect(next);
    }

    const organizationId = await restoreActiveOrganization(session);
    if (organizationId) {
      redirect(next);
    }

    return (
      <>
        <div className="mb-8">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
          >
            shortlink
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
        </div>
        <SessionRecovery email={session.user.email} />
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          shortlink
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your short links and click stats.
        </p>
      </div>

      <SignInForm next={next} />

      <p className="mt-6 text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
