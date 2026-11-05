import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";

async function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/app");
  }
  if (!session.session.activeOrganizationId) {
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
