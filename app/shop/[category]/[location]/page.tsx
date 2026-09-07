import { Metadata } from "next";
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

export const revalidate = 3600; // Location pages are stable — revalidate hourly

/**
 * Pre-generate all valid [category] × [location] combinations at build time.
 * This avoids server-rendering on every cold request for these SEO-only sub-pages.
 */
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
    return { title: "Not Found | Intrihub" };
  }

  const canonicalUrl = getCanonicalUrl(`/shop/${category.slug}/${location.slug}`);
  const title = `${category.name} in ${location.name}, Bangalore | Factory-Direct Prices | Intrihub`;
  const description = `Buy ${category.name} in ${location.name}, ${location.area}. Intrihub delivers ${category.name} directly to your ${location.name} site — same-day dispatch, factory-direct prices.`;

  return {
    title,
    description,
    alternates: {
      // Canonical always points to this location page (it's a real indexed URL)
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Intrihub",
      images: [{ url: "https://intrihub.com/og-image.png", alt: `${category.name} in ${location.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
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

  // Schema: 3-level breadcrumb
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: category.name, url: `/shop/${category.slug}` },
    { name: location.name, url: `/shop/${category.slug}/${location.slug}` },
  ]);

  const itemListSchema = generateItemListSchema(
    products.map((p, idx) => ({
      name: p.name,
      url: `/product/${p.slug}`,
      image: p.images?.[0],
      position: idx + 1,
    }))
  );

  // LocalBusiness schema scoped to the specific location
  const localBusinessSchema = generateLocalBusinessCategorySchema({
    categoryName: category.name,
    categorySlug: category.slug,
    locationName: location.name,
    locationArea: location.area,
    pincodes: location.pincodes,
  });

  const faqSchema = generateFAQSchema([
    ...seo.faqs,
    {
      question: `How quickly can Intrihub deliver ${category.name} to ${location.name}?`,
      answer: `Intrihub delivers ${category.name} to ${location.name} within 60 minutes for in-stock orders placed before 2 PM. Our dispatch network covers ${location.name} and the wider ${location.area} area. Track your delivery in real time via our platform after order placement.`,
    },
    {
      question: `Do you deliver ${category.name} to all areas within ${location.name}?`,
      answer: `Yes. Intrihub's delivery coverage includes all residential societies, commercial buildings, and construction sites across ${location.name} and surrounding ${location.area} localities. Enter your exact pincode at checkout to confirm delivery availability and estimated time.`,
    },
  ]);

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
            {/* Location-specific intro — above grid but compact (not pushing products off-screen) */}
            <LocationSeoIntro categoryName={category.name} location={location} />

            <CategoryCatalogClient
              products={products}
              categoryName={`${category.name} — ${location.name}`}
            />

            {/* Full SEO block below the grid */}
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
