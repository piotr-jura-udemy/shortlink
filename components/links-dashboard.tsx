import { connection } from "next/server";
import { getLinks } from "@/lib/links";
import { serializeLink } from "@/lib/serialize";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import { LinksSearch } from "@/components/links-search";
import { LinksTable } from "@/components/links-table";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export async function LinksDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const trimmed = firstSearchParam(params.q)?.trim() ?? "";
  const links = (await getLinks({ query: trimmed || undefined })).map(
    serializeLink,
  );

  if (links.length === 0 && !trimmed) {
    return (
      <div className="flex flex-col items-start justify-center px-1 py-16 sm:py-24">
        <span
          aria-hidden
          className="font-mono text-7xl leading-none text-primary/25 select-none sm:text-8xl"
        >
          /
        </span>
        <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
          No links yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Destination URL in, short path out. Create your first link to start
          routing.
        </p>
        <div className="mt-8">
          <CreateLinkDialog label="Create your first link" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <LinksSearch defaultQuery={trimmed} />
      {links.length === 0 ? (
        <div className="flex flex-col items-start justify-center px-1 py-12 sm:py-16">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            No links match “{trimmed}”
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Try a different slug or destination URL.
          </p>
        </div>
      ) : (
        <LinksTable links={links} />
      )}
    </div>
  );
}
