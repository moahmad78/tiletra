import { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCatalogClient from "@/components/CategoryCatalogClient";
import { notFound, redirect } from "next/navigation";
import { getRedirectForPath } from "@/lib/redirects";
import {
  BASE_SITE_URL,
  getCanonicalUrl,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateFAQSchema,
  generateLocalBusinessCategorySchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import CategorySeoBlock from "@/components/seo/CategorySeoBlock";
import { getCategorySeo } from "@/lib/data/category-seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    const redirectRecord = await getRedirectForPath(`/shop/${categorySlug}`);
    if (redirectRecord) {
      return {
        title: "Redirecting...",
        alternates: {
          canonical: getCanonicalUrl(redirectRecord.toPath),
        },
      };
    }

    return {
      title: "Category Not Found | IntriHub",
      description: "Explore interior and construction products across top categories on Intrihub.",
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  const seo = getCategorySeo(categorySlug);
  const cleanMetaTitle = seo.metaTitle;
  const canonicalUrl = getCanonicalUrl(`/shop/${category.slug}`);

  return {
    title: cleanMetaTitle,
    description: seo.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: seo.isIndexable,
      follow: true,
      googleBot: {
        index: seo.isIndexable,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: `${cleanMetaTitle} | IntriHub`,
      description: seo.metaDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "IntriHub",
      images: [
        {
          url: category.image && !category.image.includes("placeholder")
            ? (category.image.startsWith("http") ? category.image : `${BASE_SITE_URL}${category.image.startsWith("/") ? category.image : `/${category.image}`}`)
            : `${BASE_SITE_URL}/og-image.png`,
          alt: `${category.name} on Intrihub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanMetaTitle} | IntriHub`,
      description: seo.metaDescription,
      images: [
        category.image && !category.image.includes("placeholder")
          ? (category.image.startsWith("http") ? category.image : `${BASE_SITE_URL}${category.image.startsWith("/") ? category.image : `/${category.image}`}`)
          : `${BASE_SITE_URL}/og-image.png`,
      ],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const [category, categoryProducts] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getProducts({ categorySlug }),
  ]);

  if (!category) {
    const redirectRecord = await getRedirectForPath(`/shop/${categorySlug}`);
    if (redirectRecord) {
      redirect(redirectRecord.toPath);
    }
    notFound();
  }

  const seo = getCategorySeo(categorySlug);

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: category.name, url: `/shop/${category.slug}` },
  ]);

  // List first 10 visible products for ItemList schema
  const itemListSchema = generateItemListSchema(
    categoryProducts.slice(0, 10).map((p, idx) => ({
      name: p.name,
      url: `/product/${p.slug}`,
      image: p.images?.[0],
      position: idx + 1,
    }))
  );

  const localBusinessSchema = generateLocalBusinessCategorySchema({
    categoryName: category.name,
    categorySlug: category.slug,
  });

  // Mirror visible FAQs exactly in FAQ schema
  const faqSchema = seo.faqs.length > 0 ? generateFAQSchema(seo.faqs) : null;

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="category-breadcrumbs-schema" />
      <JsonLd data={itemListSchema} id="category-itemlist-schema" />
      <JsonLd data={localBusinessSchema} id="category-localbusiness-schema" />
      {faqSchema && <JsonLd data={faqSchema} id="category-faq-schema" />}
      <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[175px] lg:pt-[180px]">
        <Header />

        {/* Category Catalog & Products Grid */}
        <section className="py-6 sm:py-8 md:py-10 flex-1">
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Delivery Strip Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#052A51] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-5 h-5 text-[#FF9900]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {seo.deliveryText || "60-minute delivery in Bengaluru; 3-7 days Pan-India."}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct manufacturer supply with verified transit damage replacement.
                  </p>
                </div>
              </div>
            </div>

            <CategoryCatalogClient
              products={categoryProducts}
              categoryName={category.name}
            />

            {/* SEO block — placed below product grid, never above fold */}
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
