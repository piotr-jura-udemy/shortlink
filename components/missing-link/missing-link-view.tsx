import Link from "next/link";
import { BrokenPathVisual } from "@/components/missing-link/broken-path-visual";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type MissingLinkViewProps = {
  /** Attempted short path without a leading slash, when known. */
  slug?: string;
};

export function MissingLinkView({ slug }: MissingLinkViewProps) {
  const pathLabel = slug ? `/${slug}` : null;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-16 size-72 rounded-full bg-[color-mix(in_srgb,var(--signal)_14%,transparent)] blur-3xl motion-safe:animate-[missing-glow_5s_ease-in-out_infinite]" />
        <div className="absolute -right-16 bottom-24 size-80 rounded-full bg-[color-mix(in_srgb,#3d5a80_12%,transparent)] blur-3xl motion-safe:animate-[missing-glow_6.5s_ease-in-out_1s_infinite_reverse]" />
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-foreground transition-opacity duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-70"
        >
          shortlink
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-16 pt-4 text-center sm:px-6 sm:pb-20">
        <div
          className="w-full max-w-sm motion-safe:animate-[missing-fade-up_0.8s_cubic-bezier(0.23,1,0.32,1)_both] sm:max-w-md"
          style={{ animationDelay: "40ms" }}
        >
          <BrokenPathVisual />
        </div>

        <h1
          className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:mt-8 sm:text-5xl"
          style={{ animationDelay: "120ms" }}
        >
          Path not found
        </h1>

        <p
          className="mt-3 max-w-sm text-base text-muted-foreground motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:mt-4 sm:text-lg"
          style={{ animationDelay: "180ms" }}
        >
          This short link has nowhere to go. It may be mistyped, expired, or
          removed.
        </p>

        {pathLabel ? (
          <p
            className="mt-6 font-mono text-sm text-muted-foreground motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:mt-8"
            style={{ animationDelay: "240ms" }}
          >
            <span className="sr-only">Requested path: </span>
            <span className="inline-block rounded-md border border-border bg-card/90 px-3 py-2 text-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,white_40%,transparent)]">
              {pathLabel}
            </span>
          </p>
        ) : null}

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both] sm:mt-10"
          style={{ animationDelay: pathLabel ? "300ms" : "240ms" }}
        >
          <Link
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "px-5")}
          >
            Back to shortlink
          </Link>
        </div>
      </main>
    </div>
  );
}
