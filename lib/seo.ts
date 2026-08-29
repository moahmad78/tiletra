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
/**
 * Organization Schema.org structured data for IntriHub (Compliant with Section 6.1)
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "IntriHub",
    alternateName: "IntriHub QuickCommerce",
    url: BASE_SITE_URL,
    logo: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
    description:
      "India's instant building materials quick commerce network. Direct-from-factory delivery for construction & interior products.",
    email: "support@intrihub.com",
    telephone: "+91-92649-20211",
    foundingDate: "2026",
    address: {
      "@type": "PostalAddress",
      streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
      addressLocality: "Begur, Bengaluru",
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
      "https://www.instagram.com/intrihub/",
      "https://www.linkedin.com/company/intrihub",
      "https://www.facebook.com/intrihub",
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
    name: "IntriHub",
    alternateName: "IntriHub Quick Commerce",
    description: "India's instant building materials quick commerce network. Direct-from-factory delivery for construction & interior products.",
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
 * Product Schema.org structured data (Compliant with Sections 5.1.2, 5.3, 6.2, and 6.3)
 * Emits full Offer schema with shippingDetails and hasMerchantReturnPolicy for Google Merchant Center.
 * Conditionally emits aggregateRating and review ONLY when genuine reviews exist (zero placeholder/fake reviews).
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
  reviews?: Array<{
    id?: string;
    author: string;
    rating: number;
    comment: string;
    createdAt?: string | Date;
  }>;
}) {
  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_SITE_URL}${img.startsWith("/") ? img : `/${img}`}`
        )
      : [`${BASE_SITE_URL}/placeholders/product.svg`];

  const productUrl = getCanonicalUrl(`/product/${product.slug}`);
  const priceVal = String(product.price || 0);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    url: productUrl,
    image: images,
    description:
      product.description ||
      `Buy ${product.name} online on IntriHub. Factory-direct building & interior materials with rapid delivery.`,
    sku: product.sku || product.id,
    category: product.categoryName || "Interior & Construction",
    brand: {
      "@type": "Brand",
      name: product.brand || "IntriHub",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: priceVal,
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "IntriHub",
        url: BASE_SITE_URL,
      },
      // Google Merchant Center: Offer Shipping Details (Section 5.1.2 / 6.2)
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
      // Google Merchant Center: Merchant Return Policy (Section 5.1.2 / 6.2)
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  // Section 5.3 & 6.3: Strict Conditional Review / Rating Rendering
  // ONLY emit aggregateRating and review if genuine, approved customer reviews exist
  if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    const validReviews = product.reviews.filter((r) => r && r.rating && r.comment && r.comment.trim().length > 0);

    if (validReviews.length > 0) {
      const avgRating = (
        validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length
      ).toFixed(1);

      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: String(validReviews.length),
        bestRating: "5",
        worstRating: "1",
      };

      schema.review = validReviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: r.author || "Verified Customer",
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: r.comment,
        ...(r.createdAt
          ? { datePublished: new Date(r.createdAt).toISOString().split("T")[0] }
          : {}),
      }));
    }
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

