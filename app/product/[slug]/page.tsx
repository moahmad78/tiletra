import { Metadata } from "next";
import { getProductBySlug, getProducts } from "@/lib/actions/products";
import { prisma } from "@/lib/prisma";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import { notFound, redirect } from "next/navigation";
import { BASE_SITE_URL, getCanonicalUrl, generateProductSchema, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";
import { getRedirectForPath } from "@/lib/redirects";

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
      title: "Product Not Found | IntriHub",
      description: "The requested interior and construction product could not be found on IntriHub.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isDiscontinued = product.status === "discontinued";
  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const title = isDiscontinued
    ? `${product.name} (Discontinued) | IntriHub`
    : `${product.name} | IntriHub`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} online at IntriHub. Direct-from-factory building & interior materials with rapid delivery across Bangalore & Pan-India.`;

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
    // Add noindex for discontinued items per PRD section 4.1 while still returning HTTP 200 with alternatives
    robots: isDiscontinued
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "IntriHub",
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
  const [product, allProducts, publishedReviews] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    prisma.review.findMany({
      where: {
        product: { slug },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  if (!product) {
    // Check if a permanent 301 redirect exists for this product URL
    const redirectRecord = await getRedirectForPath(`/product/${slug}`);
    if (redirectRecord && redirectRecord.toPath) {
      redirect(redirectRecord.toPath);
    }
    notFound();
  }

  const relatedProducts = allProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 6);

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
    brand: (product as any).brand || "IntriHub",
    avgRating: (product as any).avgRating ?? (product as any).rating,
    reviewCount: (product as any).reviewCount ?? publishedReviews.length,
    reviews: publishedReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      author: r.user?.name || "Verified Customer",
    })),
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
          __html: safeJsonLd(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <ProductDetailsClient
        product={product}
        relatedProducts={relatedProducts}
        allProducts={allProducts}
      />
    </>
  );
}

