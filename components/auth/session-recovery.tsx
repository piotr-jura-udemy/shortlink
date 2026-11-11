import { SignOutButton } from "@/components/auth/sign-out-button";

export function SessionRecovery({ email }: { email: string }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Workspace unavailable
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in as {email}, but no active workspace is available.
          Sign out and sign back in to continue.
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}
