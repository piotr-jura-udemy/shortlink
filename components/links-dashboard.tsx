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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <h2 className="text-lg font-medium tracking-tight">No links yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first short link to get started. Destination URL in,
          short path out.
        </p>
        <div className="mt-6">
          <CreateLinkDialog label="Create your first link" />
        </div>
      </div>
    );
  }

  return <LinksTable links={links} />;
}
