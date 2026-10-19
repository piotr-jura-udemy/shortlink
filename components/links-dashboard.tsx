import { connection } from "next/server";
import { getLinks } from "@/lib/links";
import { serializeLink } from "@/lib/serialize";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import { LinksTable } from "@/components/links-table";

export async function LinksDashboard() {
  await connection();
  const links = (await getLinks()).map(serializeLink);

  if (links.length === 0) {
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

  return <LinksTable links={links} />;
}
