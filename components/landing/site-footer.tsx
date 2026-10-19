import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-xl font-semibold tracking-tight text-foreground">
              shortlink
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A single-operator URL shortener. Create short paths, track clicks,
              and keep destinations editable.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <div>
              <p className="text-sm font-medium text-foreground">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/app"
                    className="transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground"
                  >
                    Open app
                  </Link>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground"
                  >
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div className="sm:pt-0">
              <Link
                href="/app"
                className={cn(buttonVariants({ size: "lg" }), "px-4")}
              >
                Open app
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Compress a URL. Keep the path.</p>
          <p>No account required.</p>
        </div>
      </div>
    </footer>
  );
}
