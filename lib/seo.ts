/**
 * Intrihub SEO Architecture & Structured Data Engine
 * Compliant with Google Search, Google Shopping & Schema.org standards
 */

export const BASE_SITE_URL = "https://www.intrihub.com";

/**
 * Serializes structured data into safe JSON-LD string with script tag injection escaping
 */
export function safeJsonLd(data: any): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Normalizes and formats a preferred canonical URL
 * Strips query parameters, trailing slashes, and enforces HTTPS + canonical domain
 */
export function getCanonicalUrl(path: string = ""): string {
  const cleanPath = path
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");

  if (!cleanPath || cleanPath === "/") {
    return BASE_SITE_URL;
  }

  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${BASE_SITE_URL}${formattedPath.toLowerCase()}`;
}

/**
 * Organization Schema.org structured data for Intrihub
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "Intrihub",
    alternateName: "Intrihub Marketplace",
    url: BASE_SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
      caption: "Intrihub - Everything for Every Space",
    },
    description:
      "Intrihub is India's premier online marketplace for interior, construction, home-improvement, and building supplies.",
    email: "support@intrihub.com",
    telephone: "+919264920211",
    address: {
      "@type": "PostalAddress",
      streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560114",
      addressCountry: "IN",
    },
    founder: {
      "@type": "Person",
      name: "Sahil Sheikh",
      jobTitle: "Founder & CEO",
      sameAs: "https://www.instagram.com/sahil_sheikh78/",
    },
    sameAs: [
      "https://www.instagram.com/sahil_sheikh78/",
    ],
  };
}

/**
 * WebSite Schema.org structured data with SearchAction
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_SITE_URL}/#website`,
    url: BASE_SITE_URL,
    name: "Intrihub",
    description: "Everything for Every Space — Interior & Construction Supplies Marketplace",
    publisher: {
      "@id": `${BASE_SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-IN",
  };
}

/**
 * BreadcrumbList Schema.org structured data
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Product Schema.org structured data
 * Strictly outputs genuine data without fake ratings or reviews
 */
export function generateProductSchema(product: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  images?: string[];
  price?: number;
  inStock?: boolean;
  categoryName?: string;
  sku?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
}) {
  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_SITE_URL}${img.startsWith("/") ? img : `/${img}`}`
        )
      : [`${BASE_SITE_URL}/placeholders/product.svg`];

  const productUrl = getCanonicalUrl(`/product/${product.slug}`);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    url: productUrl,
    image: images,
    description:
      product.description ||
      `Buy ${product.name} online on Intrihub. Best quality interior & construction supplies delivered directly to your doorstep.`,
    sku: product.sku || product.id,
    category: product.categoryName || "Interior & Construction",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.price || 0,
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Intrihub",
        url: BASE_SITE_URL,
      },
    },
  };

  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  // Only include genuine aggregateRating if ratings exist
  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Article / Guide Schema.org structured data
 */
export function generateArticleSchema(guide: {
  title: string;
  description: string;
  slug: string;
  publishedTime: string;
  modifiedTime?: string;
  images?: string[];
  authorName?: string;
}) {
  const guideUrl = getCanonicalUrl(`/guides/${guide.slug}`);
  const images =
    guide.images && guide.images.length > 0
      ? guide.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_SITE_URL}${img.startsWith("/") ? img : `/${img}`}`
        )
      : [`${BASE_SITE_URL}/logo/intri-web-logo.png`];

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${guideUrl}#article`,
    headline: guide.title,
    description: guide.description,
    image: images,
    datePublished: guide.publishedTime,
    dateModified: guide.modifiedTime || guide.publishedTime,
    author: {
      "@type": "Organization",
      name: guide.authorName || "Intrihub Editorial & Technical Team",
      url: BASE_SITE_URL,
    },
    publisher: {
      "@id": `${BASE_SITE_URL}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": guideUrl,
    },
  };
}

/**
 * FAQPage Schema.org structured data
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * ItemList Schema.org structured data for Categories & Collections
 */
export function generateItemListSchema(items: Array<{ name: string; url: string; image?: string; position?: number }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: item.position || idx + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${BASE_SITE_URL}${item.url}`,
      image: item.image ? (item.image.startsWith("http") ? item.image : `${BASE_SITE_URL}${item.image}`) : undefined,
    })),
  };
}

