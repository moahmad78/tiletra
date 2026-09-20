import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Review terms and conditions for ordering building materials, delivery acceptance, and platform usage on IntriHub.",
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
  openGraph: {
    title: "Terms & Conditions | IntriHub",
    description:
      "Review terms and conditions for ordering building materials, delivery acceptance, and platform usage on IntriHub.",
    url: getCanonicalUrl("/terms"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
