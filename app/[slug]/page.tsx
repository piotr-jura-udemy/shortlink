import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { MissingLinkView } from "@/components/missing-link/missing-link-view";
import { getLinkBySlug, incrementClicks } from "@/lib/links";

/** Redirects and DB lookups must finish before any shell can stream. */
export const instant = false;

type ShortLinkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ShortLinkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (link) {
    return { title: "shortlink" };
  }
  return {
    title: "Path not found · shortlink",
    description: "This short link has nowhere to go.",
    robots: { index: false, follow: false },
  };
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  await connection();
  const { slug } = await params;

  const link = await getLinkBySlug(slug);
  if (!link) {
    return <MissingLinkView slug={slug} />;
  }

  await incrementClicks(link.id);
  redirect(link.url);
}
