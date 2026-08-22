import { Metadata } from "next";
import { getCategoryBySlug, getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCatalogClient from "@/components/CategoryCatalogClient";
import { notFound } from "next/navigation";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Not Found | Intrihub",
      description: "Explore interior and construction products across top categories on Intrihub.",
    };
  }

  const canonicalUrl = getCanonicalUrl(`/shop/${category.slug}`);
  const title = `${category.name} Online | Buy ${category.name} at Best Prices | Intrihub`;
  const description =
    category.description ||
    `Explore premium ${category.name} products on Intrihub. Compare specifications, wholesale prices, and shop interior & construction materials with doorstep delivery.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Intrihub",
      images: [
        {
          url: category.image || "/logo/intri-web-logo.png",
          alt: `${category.name} on Intrihub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image || "/logo/intri-web-logo.png"],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const [category, categories, categoryProducts] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getCategories(),
    getProducts({ categorySlug }),
  ]);

  if (!category) {
    notFound();
  }

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: category.name, url: `/shop/${category.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[175px] lg:pt-[180px]">
        <Header />

        {/* Products Grid */}
        <section className="py-6 sm:py-8 md:py-10 flex-1">
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <CategoryCatalogClient
              products={categoryProducts}
              categoryName={category.name}
            />
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

