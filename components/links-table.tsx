"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { deleteLink } from "@/lib/links";
import type { SerializedLink } from "@/lib/serialize";
import { CopyShortLinkButton } from "@/components/copy-short-link-button";
import { EditLinkDialog } from "@/components/edit-link-dialog";
import { QrCodeButton } from "@/components/qr-code-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function LinksTable({ links }: { links: SerializedLink[] }) {
  const [editLink, setEditLink] = useState<SerializedLink | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedLink | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteLink(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Short link</TableHead>
              <TableHead className="hidden md:table-cell">Destination</TableHead>
              <TableHead className="w-24">Clicks</TableHead>
              <TableHead className="hidden w-36 sm:table-cell">Created</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => {
              const shortPath = `/${link.slug}`;

              return (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <a
                        href={shortPath}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortPath}
                      </a>
                      <CopyShortLinkButton slug={link.slug} />
                      <QrCodeButton slug={link.slug} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    <a
                      href={link.url}
                      className="hover:text-foreground hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.url}
                    </a>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {link.clicks}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(link.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Open actions"
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditLink(link)}>
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(link)}
                        >
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditLinkDialog
        link={editLink}
        open={editLink !== null}
        onOpenChange={(open) => {
          if (!open) setEditLink(null);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-mono font-medium text-foreground">
                /{deleteTarget?.slug}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
