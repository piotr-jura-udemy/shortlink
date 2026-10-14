import { Suspense } from "react";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import { LinksDashboard } from "@/components/links-dashboard";

function DashboardFallback() {
  return (
    <div className="rounded-xl border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
      Loading links…
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">shortlink</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Short links with a simple dashboard.
          </p>
        </div>
        <CreateLinkDialog />
      </header>

      <Suspense fallback={<DashboardFallback />}>
        <LinksDashboard />
      </Suspense>
    </div>
  );
}
