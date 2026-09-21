import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCatalogClient from "@/components/CategoryCatalogClient";
import JsonLd from "@/components/JsonLd";
import {
  getCanonicalUrl,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateFAQSchema,
  generateLocalBusinessCategorySchema,
} from "@/lib/seo";
import { SEO_LOCATIONS, getLocationBySlug } from "@/lib/data/seo-locations";
import { categories as allCategories } from "@/lib/data/categories";
import LocationSeoIntro from "@/components/seo/LocationSeoIntro";
import CategorySeoBlock from "@/components/seo/CategorySeoBlock";
import { getCategorySeo } from "@/lib/data/category-seo";
import { ChevronRight, Home } from "lucide-react";

// Cache generated location pages at the edge for 24 hours (ISR) to ensure sub-800ms TTFB under concurrency
export const revalidate = 86400;

export async function generateStaticParams() {
  const params: { category: string; location: string }[] = [];
  for (const cat of allCategories) {
    for (const loc of SEO_LOCATIONS) {
      params.push({ category: cat.slug, location: loc.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; location: string }>;
}): Promise<Metadata> {
  const { category: categorySlug, location: locationSlug } = await params;

  const [category, location] = [
    await getCategoryBySlug(categorySlug),
    getLocationBySlug(locationSlug),
  ];

  if (!category || !location) {
    return { title: "Location Not Found | IntriHub" };
  }

  const canonicalUrl = getCanonicalUrl(`/shop/${category.slug}/${location.slug}`);
  const cleanTitle = `${category.name} Provider in ${location.name}, ${location.city} | IntriHub`;
  const subAreasText = location.serviceableSubAreas?.slice(0, 3).join(", ") || location.area;
  const description = `Buy ${category.name} in ${location.name}, ${location.city}. Direct site delivery with ${location.dispatchWindow.toLowerCase()} across ${subAreasText}. Factory rates & verified GST invoice.`;

  return {
    title: cleanTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cleanTitle}`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "IntriHub",
      images: [{ url: "https://intrihub.com/og-image.png", alt: `${category.name} in ${location.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanTitle}`,
      description,
      images: ["https://intrihub.com/og-image.png"],
    },
  };
}

export default async function CategoryLocationPage({
  params,
}: {
  params: Promise<{ category: string; location: string }>;
}) {
  const { category: categorySlug, location: locationSlug } = await params;

  const [category, products] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getProducts({ categorySlug }),
  ]);

  const location = getLocationBySlug(locationSlug);

  if (!category || !location) {
    notFound();
  }

  const seo = getCategorySeo(categorySlug);
  const naturalH1 = `${category.name} Provider in ${location.name}, ${location.city}`;

  // 1. Breadcrumbs Schema & UI Data
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: category.name, url: `/shop/${category.slug}` },
    { name: location.name, url: `/shop/${category.slug}/${location.slug}` },
  ];
  const breadcrumbsSchema = generateBreadcrumbSchema(breadcrumbItems);

  // 2. Product Catalog Schema
  const itemListSchema = generateItemListSchema(
    products.map((p, idx) => ({
      name: p.name,
      url: `/product/${p.slug}`,
      image: p.images?.[0],
      position: idx + 1,
    }))
  );

  // 3. LocalBusiness Schema
  const localBusinessSchema = generateLocalBusinessCategorySchema({
    categoryName: category.name,
    categorySlug: category.slug,
    locationName: location.name,
    locationArea: location.area,
    pincodes: location.pincodes,
  });

  // 4. Combined Location-Specific FAQs
  const combinedFaqs = [
    ...(location.localFaqs || []),
    ...seo.faqs,
    {
      question: `How does IntriHub handle bulk contractor orders for ${category.name} in ${location.name}?`,
      answer: `We provide dedicated trade managers, customized GST tax invoices, and scheduled multi-drop site deliveries for builders and interior studios operating across ${location.name} and ${location.area}.`,
    },
  ];
  const faqSchema = generateFAQSchema(combinedFaqs);

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="location-breadcrumbs-schema" />
      <JsonLd data={itemListSchema} id="location-itemlist-schema" />
      <JsonLd data={localBusinessSchema} id="location-localbusiness-schema" />
      <JsonLd data={faqSchema} id="location-faq-schema" />

      <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[175px] lg:pt-[180px]">
        <Header />

        <section className="py-6 sm:py-8 md:py-10 flex-1">
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Visual Breadcrumb Navigation Bar */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4 overflow-x-auto whitespace-nowrap py-1"
            >
              <Link href="/" className="hover:text-[#F26522] flex items-center gap-1 transition-colors">
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronRight size={13} className="text-gray-400 shrink-0" />
              <Link href="/shop" className="hover:text-[#F26522] transition-colors">
                Shop
              </Link>
              <ChevronRight size={13} className="text-gray-400 shrink-0" />
              <Link href={`/shop/${category.slug}`} className="hover:text-[#F26522] transition-colors">
                {category.name}
              </Link>
              <ChevronRight size={13} className="text-gray-400 shrink-0" />
              <span className="text-[#052a51] font-bold">{location.name}</span>
            </nav>

            {/* Natural, Semantic H1 */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#052a51] tracking-tight">
                {naturalH1}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Verified building &amp; interior materials with rapid dispatch to {location.name} ({location.pincodes.join(", ")})
              </p>
            </div>

            {/* Rich Location Logistics Block */}
            <LocationSeoIntro categoryName={category.name} location={location} />

            {/* Product Catalog Display */}
            <CategoryCatalogClient
              products={products}
              categoryName={`${category.name} — ${location.name}`}
            />

            {/* Localized FAQ Accordion */}
            {combinedFaqs.length > 0 && (
              <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs max-w-4xl">
                <h3 className="text-lg sm:text-xl font-black text-[#052a51] mb-5">
                  Frequently Asked Questions — {category.name} in {location.name}
                </h3>
                <div className="space-y-3">
                  {combinedFaqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-2xl border border-gray-200 bg-gray-50/50 overflow-hidden"
                    >
                      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-bold text-sm text-gray-800 select-none hover:bg-gray-100/60 transition-colors">
                        <span>{faq.question}</span>
                        <ChevronRight
                          size={16}
                          className="text-gray-400 shrink-0 transition-transform group-open:rotate-90"
                        />
                      </summary>
                      <div className="px-5 pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-200/60 pt-3 bg-white">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Full Category SEO block & cross-links below grid */}
            <CategorySeoBlock
              categorySlug={categorySlug}
              categoryName={category.name}
            />
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
