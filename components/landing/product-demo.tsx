import { CopyIcon, MoreHorizontalIcon } from "lucide-react";

const SAMPLE_LINKS = [
  {
    slug: "docs",
    url: "https://example.com/getting-started/guide",
    clicks: "128",
    created: "Oct 12, 2026",
  },
  {
    slug: "launch",
    url: "https://example.com/blog/announcing-v1",
    clicks: "47",
    created: "Oct 14, 2026",
  },
  {
    slug: "demo",
    url: "https://example.com/product/walkthrough",
    clicks: "12",
    created: "Oct 18, 2026",
  },
] as const;

/** Static illustration of the dashboard — decorative only, no live actions. */
export function ProductDemo() {
  return (
    <div
      aria-hidden
      className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_80px_-24px_color-mix(in_srgb,var(--ink)_28%,transparent)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0 text-left">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            shortlink
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Compress a URL. Keep the path.
          </p>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Create link
        </span>
      </div>

      <div className="border-b border-border bg-muted/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 text-left">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Destination URL
            </p>
            <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 font-mono text-xs text-muted-foreground sm:text-sm">
              https://example.com/very/long/path…
            </div>
          </div>
          <div className="w-full text-left sm:w-40">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Short path
            </p>
            <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 font-mono text-xs text-foreground sm:text-sm">
              /go
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium sm:px-5">Short link</th>
              <th className="px-4 py-2.5 font-medium sm:px-5">Destination</th>
              <th className="px-4 py-2.5 font-medium sm:px-5">Clicks</th>
              <th className="px-4 py-2.5 font-medium sm:px-5">Created</th>
              <th className="w-12 px-4 py-2.5 sm:px-5" />
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LINKS.map((link) => (
              <tr
                key={link.slug}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 sm:px-5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
                    /{link.slug}
                    <CopyIcon className="size-3.5 text-muted-foreground" />
                  </span>
                </td>
                <td className="max-w-[14rem] truncate px-4 py-3 text-muted-foreground sm:px-5">
                  {link.url}
                </td>
                <td className="px-4 py-3 font-mono text-foreground sm:px-5">
                  {link.clicks}
                </td>
                <td className="px-4 py-3 text-muted-foreground sm:px-5">
                  {link.created}
                </td>
                <td className="px-4 py-3 text-muted-foreground sm:px-5">
                  <MoreHorizontalIcon className="size-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
