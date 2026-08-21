import { Metadata } from "next";
import { getProductBySlug, getProducts } from "@/lib/actions/products";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import { notFound } from "next/navigation";
import { BASE_SITE_URL, getCanonicalUrl, generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Intrihub",
      description: "The requested interior and construction product could not be found on Intrihub.",
    };
  }

  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const title = `${product.name} | Intrihub`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} online at Intrihub. High quality interior and construction materials with doorstep delivery across Bangalore & Pan-India.`;

  const imageUrls =
    product.images && product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_SITE_URL}${img.startsWith("/") ? img : `/${img}`}`
        )
      : [`${BASE_SITE_URL}/logo/intri-web-logo.png`];

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
      images: imageUrls.map((url) => ({
        url,
        width: 800,
        height: 800,
        alt: product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrls,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getProducts({
    categorySlug: product.categorySlug,
    limit: 4,
  }).then((prods) => prods.filter((p) => p.id !== product.id).slice(0, 3));

  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.pricePerBox || v.pricePerSqft || 0))
    : 0;

  const productSchema = generateProductSchema({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    images: product.images,
    price: minPrice,
    inStock: product.variants?.some((v) => v.stockBoxes > 0) ?? true,
    categoryName: product.categoryName || product.categorySlug,
    brand: (product as any).brand || "Intrihub",
  });

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    {
      name: product.categoryName || "Shop",
      url: `/shop/${product.categorySlug || ""}`,
    },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbsSchema),
        }}
      />
      <ProductDetailsClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}

