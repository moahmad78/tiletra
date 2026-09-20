import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how IntriHub protects customer personal data, payment details, and order information with enterprise security.",
  alternates: {
    canonical: getCanonicalUrl("/privacy-policy"),
  },
  openGraph: {
    title: "Privacy Policy | IntriHub",
    description:
      "Learn how IntriHub protects customer personal data, payment details, and order information with enterprise security.",
    url: getCanonicalUrl("/privacy-policy"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
