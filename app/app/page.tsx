import Link from "next/link";
import { Suspense } from "react";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import { LinksDashboard } from "@/components/links-dashboard";

function DashboardFallback() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
      Loading links…
    </div>
  );
}

export default function AppPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
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
        </div>
        <div className="shrink-0 pt-1">
          <CreateLinkDialog />
        </div>
      </header>

      <Suspense fallback={<DashboardFallback />}>
        <LinksDashboard />
      </Suspense>
    </div>
  );
}
