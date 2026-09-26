import { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import UspDetailClient from "@/components/usp/UspDetailClient";
import { USP_ITEMS } from "@/lib/data/usps";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";

const USP_SLUG = "screw-to-complete-project";
const canonicalUrl = getCanonicalUrl(`/${USP_SLUG}`);

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const usp = USP_ITEMS.find((item) => item.slug === USP_SLUG);
  if (!usp) return {};

  return {
    title: usp.title,
    description: usp.metaDescription,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: usp.title,
      description: usp.metaDescription,
      url: canonicalUrl,
      type: "article",
      siteName: "IntriHub",
      images: [
        {
          url: `${BASE_SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${usp.h1} — IntriHub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: usp.title,
      description: usp.metaDescription,
      images: [`${BASE_SITE_URL}/og-image.png`],
    },
  };
}

export default function UspSinglePage() {
  const usp = USP_ITEMS.find((item) => item.slug === USP_SLUG);
  if (!usp) {
    notFound();
  }

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Why IntriHub", url: "/why-intrihub" },
    { name: usp.h1, url: `/${usp.slug}` },
  ]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: usp.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    name: usp.title,
    url: canonicalUrl,
    description: usp.metaDescription,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_SITE_URL}/#website`,
      name: "IntriHub",
      url: BASE_SITE_URL,
    },
  };

  return (
    <>
      <JsonLd data={webpageSchema} id={`usp-webpage-${usp.slug}`} />
      <JsonLd data={breadcrumbsSchema} id={`usp-breadcrumbs-${usp.slug}`} />
      <JsonLd data={faqSchema} id={`usp-faq-${usp.slug}`} />

      <Header />
      <UspDetailClient usp={usp} />
      <Footer />
    </>
  );
}
