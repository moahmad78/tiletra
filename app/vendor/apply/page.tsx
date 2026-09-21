import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VendorApplyForm from "@/components/vendor/VendorApplyForm";
import { BASE_SITE_URL, getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Become an IntriHub Vendor Partner — Sell Building & Interior Materials",
  description:
    "Join Bangalore's fastest growing building and interior materials quick-commerce marketplace. Direct customer reach, transparent margins, and weekly automated settlements.",
  alternates: {
    canonical: getCanonicalUrl("/vendor/apply"),
  },
  openGraph: {
    title: "Become a Vendor Partner | IntriHub QuickCommerce",
    description:
      "Grow your construction supplies or interior retail business with IntriHub. Direct site orders from contractors, architects & homeowners.",
    url: getCanonicalUrl("/vendor/apply"),
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "IntriHub Vendor Onboarding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Become an IntriHub Vendor Partner",
    description: "Sell construction and interior materials with express site delivery across Bangalore.",
    images: [`${BASE_SITE_URL}/og-image.png`],
  },
};

export default function VendorApplyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6]">
      <Header />
      <VendorApplyForm />
      <Footer />
    </div>
  );
}
