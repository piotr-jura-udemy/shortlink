import {
  CopyIcon,
  Link2Icon,
  MousePointerClickIcon,
  PencilIcon,
} from "lucide-react";

const FEATURES = [
  {
    title: "Turn long URLs into short paths",
    description:
      "Paste a destination, pick a slug or let shortlink generate one. The path on your origin is what you share.",
    visual: (
      <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-background p-3 font-mono text-xs sm:text-sm">
        <div className="truncate text-muted-foreground">
          https://example.com/articles/2026/launch-notes…
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <Link2Icon className="size-3.5 shrink-0 text-primary" />
          <span>/launch</span>
        </div>
      </div>
    ),
  },
  {
    title: "See what gets clicked",
    description:
      "Every redirect bumps a click count on the link. Scan the table to see which paths are doing the work.",
    visual: (
      <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3">
        <span className="font-mono text-sm text-foreground">/docs</span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
          <MousePointerClickIcon className="size-3.5 text-primary" />
          128 clicks
        </span>
      </div>
    ),
  },
  {
    title: "Copy, edit, or remove",
    description:
      "Copy the short URL in one click. Change the destination or slug later, or delete links you no longer need.",
    visual: (
      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-3">
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground">
          <CopyIcon className="size-3.5" />
        </span>
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground">
          <PencilIcon className="size-3.5" />
        </span>
        <span className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground">
          Edit link
        </span>
      </div>
    ),
  },
  {
    title: "Redirects that stay out of the way",
    description:
      "Visitors hit your short path and land on the destination with a normal redirect. You manage links; they just follow them.",
    visual: (
      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-4 font-mono text-xs sm:text-sm">
        <span className="text-primary">/go</span>
        <span className="text-muted-foreground">→</span>
        <span className="truncate text-muted-foreground">destination</span>
      </div>
    ),
  },
] as const;

export function FeatureGrid() {
  return (
    <div className="grid border-t border-border sm:grid-cols-2">
      {FEATURES.map((feature) => (
        <article
          key={feature.title}
          className="flex flex-col border-b border-border p-6 sm:p-8 sm:odd:border-r"
        >
          <div className="mb-6 flex min-h-[5.5rem] items-center">{feature.visual}</div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {feature.description}
          </p>
        </article>
      ))}
    </div>
  );
}
