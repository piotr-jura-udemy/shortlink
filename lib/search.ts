import { getLinks } from "./links";

export type SearchHit = {
  type: "link";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type SearchOptions = {
  types?: Array<"link">;
  limit?: number;
};

export async function search(
  query: string,
  options?: SearchOptions,
): Promise<SearchHit[]> {
  const types = options?.types ?? ["link"];
  const limit = options?.limit;
  const hits: SearchHit[] = [];

  if (types.includes("link")) {
    const rows = await getLinks({ query });
    for (const link of rows) {
      hits.push({
        type: "link",
        id: link.id,
        title: link.slug,
        subtitle: link.url,
        href: `/${link.slug}`,
      });
      if (limit !== undefined && hits.length >= limit) {
        break;
      }
    }
  }

  return hits;
}
