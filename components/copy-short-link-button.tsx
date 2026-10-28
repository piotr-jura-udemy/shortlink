"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { buildShortUrl } from "@/lib/short-url";
import { Button } from "@/components/ui/button";

export function CopyShortLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [flashing, setFlashing] = useState(false);

  async function handleCopy() {
    const value = buildShortUrl(window.location.origin, slug);
    await navigator.clipboard.writeText(value);
    setFlashing(true);
    window.setTimeout(() => {
      setCopied(true);
      setFlashing(false);
    }, 80);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy short link"}
      className="text-muted-foreground"
    >
      <span
        className={`inline-flex transition-[opacity,filter] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          flashing ? "opacity-70 blur-[2px]" : "opacity-100 blur-0"
        }`}
      >
        {copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
      </span>
    </Button>
  );
}
