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
  const cleanMetaTitle = `${category.name} Online in Bangalore`;
  const canonicalUrl = getCanonicalUrl(`/shop/${category.slug}`);

  return {
    title: cleanMetaTitle,
    description: seo.metaDescription,
    alternates: {
      canonical: canonicalUrl,
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

  const itemListSchema = generateItemListSchema(
    categoryProducts.map((p, idx) => ({
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

  // Combine category-specific FAQs with 2 generic delivery FAQs
  const allFaqs = [
    ...seo.faqs,
    {
      question: `What is the delivery timeline for ${category.name} in Bangalore?`,
      answer: `Most ${category.name} orders are delivered directly to your site within 60 minutes across Bangalore via our rapid dispatch quick-commerce fleet for in-stock items.`,
    },
    {
      question: `Can I get bulk contractor discounts on ${category.name}?`,
      answer: `Yes, Intrihub offers tiered trade discounts, GST tax invoices for input credit, and dedicated project supply managers for contractors, builders, and designers.`,
    },
  ];

  const faqSchema = generateFAQSchema(allFaqs);

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="category-breadcrumbs-schema" />
      <JsonLd data={itemListSchema} id="category-itemlist-schema" />
      <JsonLd data={localBusinessSchema} id="category-localbusiness-schema" />
      <JsonLd data={faqSchema} id="category-faq-schema" />
      <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[175px] lg:pt-[180px]">
        <Header />

        {/* Products Grid */}
        <section className="py-6 sm:py-8 md:py-10 flex-1">
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
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
