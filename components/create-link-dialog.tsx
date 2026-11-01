"use client";

import { useState, useTransition } from "react";
import { PlusIcon, QrCodeIcon } from "lucide-react";
import { createLink } from "@/lib/links";
import { buildShortUrl } from "@/lib/short-url";
import { CopyShortLinkButton } from "@/components/copy-short-link-button";
import { QrCodeDialog } from "@/components/qr-code-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateLinkDialog({
  open: controlledOpen,
  onOpenChange,
  label = "Create link",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
} = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setUrl("");
    setSlug("");
    setError(null);
    setCreatedSlug(null);
    setQrOpen(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createLink({
        url,
        slug: slug.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setUrl("");
      setSlug("");
      setCreatedSlug(result.link.slug);
    });
  }

  const shortUrlPreview =
    createdSlug && typeof window !== "undefined"
      ? buildShortUrl(window.location.origin, createdSlug)
      : createdSlug
        ? `/${createdSlug}`
        : null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogTrigger
          render={
            <Button>
              <PlusIcon data-icon="inline-start" />
              {label}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          {createdSlug ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Link created</DialogTitle>
                <DialogDescription>
                  Copy the short URL or share it as a QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-primary">
                  {shortUrlPreview}
                </span>
                <CopyShortLinkButton slug={createdSlug} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Show QR code"
                  className="text-muted-foreground"
                  onClick={() => setQrOpen(true)}
                >
                  <QrCodeIcon />
                </Button>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Create another
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Create a short link
                </DialogTitle>
                <DialogDescription>
                  Paste a destination URL. Optionally set a custom slug.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-url">Destination URL</Label>
                  <Input
                    id="create-url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-slug">Short link slug</Label>
                  <Input
                    id="create-slug"
                    placeholder="auto-generate"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="font-mono"
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create link"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {createdSlug ? (
        <QrCodeDialog
          slug={createdSlug}
          open={qrOpen}
          onOpenChange={setQrOpen}
        />
      ) : null}
    </>
  );
}
