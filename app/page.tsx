import Link from "next/link";
import { Link2Icon } from "lucide-react";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ProductDemo } from "@/components/landing/product-demo";
import { SiteFooter } from "@/components/landing/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-foreground transition-opacity duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-70"
        >
          shortlink
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            Sign up
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both]"
            style={{ animationDelay: "0ms" }}
          >
            <Link2Icon className="size-3.5 text-primary" />
            URL shortener
          </div>

          <p
            className="mt-6 font-display text-5xl font-semibold tracking-tight text-foreground motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            shortlink
          </p>

          <h1
            className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-foreground motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:text-4xl sm:leading-tight"
            style={{ animationDelay: "120ms" }}
          >
            Short paths for long URLs.
          </h1>

          <p
            className="mt-4 max-w-lg text-base text-muted-foreground motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Create short links, copy them in one click, and track how often they
            get used — from your private dashboard.
          </p>

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3 motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both]"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "px-5")}
            >
              Get started
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-5",
              )}
            >
              How it works
            </a>
          </div>

          <div
            className="mt-14 w-full max-w-4xl motion-safe:animate-[landing-fade-up_0.85s_cubic-bezier(0.23,1,0.32,1)_both] sm:mt-16"
            style={{ animationDelay: "320ms" }}
          >
            <ProductDemo />
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-border bg-card/40"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">What you get</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Everything the dashboard already does.
              </h2>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                shortlink stays small on purpose: create, list, copy, edit,
                delete, and count clicks — for your workspace only.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card">
              <FeatureGrid />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ready to shorten something?
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Create an account, jump into the app, and ship your first short
              link. Redirects stay public; your stats stay private.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "mt-8 px-5")}
            >
              Create account
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
