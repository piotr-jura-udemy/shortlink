import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession, restoreActiveOrganization } from "@/lib/session";

async function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/app");
  }

  const organizationId = await restoreActiveOrganization(session);
  if (!organizationId) {
    // Login shows sign-out recovery instead of bouncing back here.
    redirect("/login?next=/app");
  }

  return children;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
