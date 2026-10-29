"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 250;

export function LinksSearch({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultQuery);
  const [prevDefaultQuery, setPrevDefaultQuery] = useState(defaultQuery);

  if (defaultQuery !== prevDefaultQuery) {
    setPrevDefaultQuery(defaultQuery);
    setValue(defaultQuery);
  }

  useEffect(() => {
    const trimmed = value.trim();
    const current = defaultQuery.trim();
    if (trimmed === current) return;

    const id = window.setTimeout(() => {
      const href = trimmed
        ? `${pathname}?q=${encodeURIComponent(trimmed)}`
        : pathname;
      router.replace(href);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [value, defaultQuery, pathname, router]);

  return (
    <div className="mb-4">
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by slug or URL…"
        aria-label="Search links"
        className="max-w-sm"
      />
    </div>
  );
}
