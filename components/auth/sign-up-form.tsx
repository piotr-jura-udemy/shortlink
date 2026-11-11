"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/auth-schemas";
import { safeNextPath } from "@/lib/safe-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm({ next = "/app" }: { next?: string }) {
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
        const parsed = signUpSchema.safeParse({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid input");
          return;
        }

        startTransition(async () => {
          // HTTP client path so Better Auth rate limits on /sign-up/email apply.
          const { error: signUpError } = await authClient.signUp.email({
            name: parsed.data.name,
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signUpError) {
            setError(signUpError.message || "Could not create account");
            return;
          }
          router.push(destination);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={pending}
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
