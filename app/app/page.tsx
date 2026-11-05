import Link from "next/link";
import { Suspense } from "react";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import { LinksDashboard } from "@/components/links-dashboard";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSession } from "@/lib/session";

function DashboardFallback() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
      Loading links…
    </div>
  );
}

async function AppHeader() {
  const session = await getSession();

  return (
    <header className="mb-10 flex items-start justify-between gap-6">
      <div className="min-w-0">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          <Link
            href="/"
            className="transition-opacity duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-70"
          >
            shortlink
          </Link>
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
          Compress a URL. Keep the path.
        </p>
        {session ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Signed in as {session.user.email}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        <SignOutButton />
        <CreateLinkDialog />
      </div>
    </header>
  );
}

export default function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
      <Suspense
        fallback={
          <header className="mb-10 h-24 animate-pulse rounded-lg bg-muted/40" />
        }
      >
        <AppHeader />
      </Suspense>

      <Suspense fallback={<DashboardFallback />}>
        <LinksDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
