"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/auth-schemas";
import { safeNextPath } from "@/lib/safe-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ next = "/app" }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const destination = safeNextPath(next);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const parsed = signInSchema.safeParse({
          email: form.get("email"),
          password: form.get("password"),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid input");
          return;
        }

        startTransition(async () => {
          // HTTP client path so Better Auth rate limits on /sign-in/email apply.
          const { error: signInError } = await authClient.signIn.email({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) {
            setError(signInError.message || "Invalid email or password");
            return;
          }
          router.push(destination);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
