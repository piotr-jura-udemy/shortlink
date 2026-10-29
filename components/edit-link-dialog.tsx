"use client";

import { useState, useTransition } from "react";
import { updateLink } from "@/lib/links";
import type { SerializedLink } from "@/lib/serialize";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditLinkDialog({
  link,
  open,
  onOpenChange,
}: {
  link: SerializedLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {link ? (
          <EditLinkForm
            key={link.id}
            link={link}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditLinkForm({
  link,
  onOpenChange,
}: {
  link: SerializedLink;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState(link.url);
  const [slug, setSlug] = useState(link.slug);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateLink({
        id: link.id,
        url,
        slug,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="font-display">Edit link</DialogTitle>
        <DialogDescription>
          Update the destination URL or short slug.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-url">Destination URL</Label>
          <Input
            id="edit-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-slug">Short link slug</Label>
          <Input
            id="edit-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="font-mono"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
