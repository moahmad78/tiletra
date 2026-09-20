import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description:
    "Learn about IntriHub's 60-minute site delivery, heavy freight packaging, and zero-breakage guarantee across Bengaluru.",
  alternates: {
    canonical: getCanonicalUrl("/shipping-policy"),
  },
  openGraph: {
    title: "Shipping & Delivery Policy | IntriHub",
    description:
      "Learn about IntriHub's 60-minute site delivery, heavy freight packaging, and zero-breakage guarantee across Bengaluru.",
    url: getCanonicalUrl("/shipping-policy"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function ShippingPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
