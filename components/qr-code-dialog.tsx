"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCodeIcon } from "lucide-react";
import { downloadCanvasPng } from "@/lib/download-canvas-png";
import { buildShortUrl } from "@/lib/short-url";
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

export function QrCodeDialog({
  slug,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: {
  slug: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When set, renders as the dialog trigger. */
  trigger?: React.ReactElement;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shortUrl =
    typeof window !== "undefined"
      ? buildShortUrl(window.location.origin, slug)
      : `/${slug}`;

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvasPng(canvas, `${slug}-qr.png`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">QR code</DialogTitle>
          <DialogDescription>
            Scan to open{" "}
            <span className="font-mono text-foreground">{shortUrl}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <QRCodeCanvas
            ref={canvasRef}
            value={shortUrl}
            size={200}
            marginSize={2}
            title={`QR code for ${shortUrl}`}
          />
        </div>
        <DialogFooter className="mt-2">
          <Button type="button" onClick={handleDownload}>
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QrCodeButton({ slug }: { slug: string }) {
  return (
    <QrCodeDialog
      slug={slug}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Show QR code"
          className="text-muted-foreground"
        >
          <QrCodeIcon />
        </Button>
      }
    />
  );
}
