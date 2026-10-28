import type { Metadata } from "next";
import { MissingLinkView } from "@/components/missing-link/missing-link-view";

export const metadata: Metadata = {
  title: "Path not found · shortlink",
  description: "This short link has nowhere to go.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <MissingLinkView />;
}
