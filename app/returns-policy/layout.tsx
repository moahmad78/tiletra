import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Returns & Replacement Policy",
  description:
    "IntriHub 7-day return window, transit breakage replacement, batch matching, and transparent refund timelines.",
  alternates: {
    canonical: getCanonicalUrl("/returns-policy"),
  },
  openGraph: {
    title: "Returns & Replacement Policy | IntriHub",
    description:
      "IntriHub 7-day return window, transit breakage replacement, batch matching, and transparent refund timelines.",
    url: getCanonicalUrl("/returns-policy"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function ReturnsPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
