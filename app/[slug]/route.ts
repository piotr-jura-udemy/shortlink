import { NextResponse } from "next/server";
import { getLinkBySlug, incrementClicks } from "@/lib/links";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const link = await getLinkBySlug(slug);
  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await incrementClicks(link.id);
  return NextResponse.redirect(link.url, 302);
}
