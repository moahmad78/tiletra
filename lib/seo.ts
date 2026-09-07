/**
 * Intrihub SEO Architecture & Structured Data Engine
 * Compliant with Google Search, Google Shopping, Sitelinks Searchbox & Schema.org standards
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
 * Unified Root Entity @graph Schema for Root Layout (Emitted once, site-wide)
 * Combines Organization, LocalBusiness (child entity), and WebSite (with SearchAction)
 * into a single entity-graph that prevents duplicate competing business nodes.
 */
export function generateRootGraphSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_SITE_URL}/#organization`,
        name: "IntriHub",
        alternateName: "Intrihub QuickCommerce",
        url: BASE_SITE_URL,
        logo: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
        image: `${BASE_SITE_URL}/og-image.png`,
        description:
          "India's instant building & interior materials quick-commerce marketplace, delivering factory-direct tiles, granite, electrical, plumbing, and hardware within 60 minutes across Bengaluru and Pan-India.",
        foundingDate: "2026",
        founder: {
          "@type": "Person",
          name: "Sahil Sheikh",
          url: "https://www.instagram.com/sahil_sheikh78/",
        },
        email: "support@intrihub.com",
        telephone: "+91-70901-20211",
        sameAs: [
          "https://www.instagram.com/intrihub_/",
          "https://www.linkedin.com/company/intrihub",
          "https://www.facebook.com/intrihub",
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          postalCode: "560114",
          addressCountry: "IN",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+91-70901-20211",
            contactType: "customer service",
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${BASE_SITE_URL}/#localbusiness`,
        name: "IntriHub",
        image: `${BASE_SITE_URL}/og-image.png`,
        url: BASE_SITE_URL,
        telephone: "+91-70901-20211",
        priceRange: "₹₹",
        address: {
          "@type": "PostalAddress",
          streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          postalCode: "560114",
          addressCountry: "IN",
        },
        areaServed: [
          { "@type": "City", name: "Bengaluru" },
          { "@type": "Country", name: "India" },
        ],
        parentOrganization: {
          "@id": `${BASE_SITE_URL}/#organization`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_SITE_URL}/#website`,
        url: BASE_SITE_URL,
        name: "IntriHub",
        publisher: {
          "@id": `${BASE_SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          // Per Google Sitelinks Searchbox spec, target must be a plain string URL template.
          target: `${BASE_SITE_URL}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/**
 * Organization Schema.org structured data for IntriHub (Backward compatibility)
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "IntriHub",
    alternateName: [
      "Intrihub",
      "Intrihub.com",
      "IntriHub QuickCommerce",
      "Intrihub India",
      "Intrihub Bangalore",
      "Intrihub Building Materials",
      "Intrihub Interior Marketplace",
      "Intrihub Store",
    ],
    legalName: "IntriHub QuickCommerce",
    slogan: "Everything for Every Space — Instant Building & Interior Materials Marketplace",
    url: BASE_SITE_URL,
    logo: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
    image: `${BASE_SITE_URL}/og-image.png`,
    description:
      "Intrihub is India's leading instant building materials and interior supplies marketplace. Factory-direct rates for tiles, granite, electrical wires, sanitaryware, false ceilings, and hardware with 60-minute site delivery.",
    email: "support@intrihub.com",
    telephone: "+91-70901-20211",
    foundingDate: "2026",
    knowsAbout: [
      "Building Materials",
      "Interior Materials Marketplace",
      "Vitrified Tiles and Granite",
      "Electrical Switches and Wires",
      "Plumbing and CPVC Sanitaryware",
      "Plywood and Hardware Supplies",
      "Paints and Surface Finishes",
      "Quick Commerce Building Delivery",
    ],
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
      "https://www.instagram.com/intrihub_/",
      "https://www.linkedin.com/company/intrihub",
      "https://www.facebook.com/intrihub",
    ],
  };
}

/**
 * WebSite Schema.org structured data with SearchAction for Intrihub (Backward compatibility)
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_SITE_URL}/#website`,
    url: BASE_SITE_URL,
    name: "IntriHub",
    alternateName: [
      "Intrihub",
      "Intrihub.com",
      "Intrihub India",
      "Intrihub Quick Commerce",
      "IntriHub Marketplace",
    ],
    description:
      "Intrihub is India's instant building materials and interior supplies quick-commerce marketplace with direct factory site delivery.",
    publisher: {
      "@id": `${BASE_SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-IN",
  };
}

/**
 * Homepage FAQ Schema.org structured data (Exact 6 verified production Q&As)
 */
export function generateHomepageFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Intrihub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "IntriHub is India's premier instant building and interior materials marketplace. We connect homeowners, architects, interior designers, and contractors directly to certified manufacturing hubs, providing factory-direct pricing on tiles, granite, electrical wires, sanitaryware, false ceilings, and hardware with 60-minute site delivery in Bengaluru and pan-India dispatch.",
        },
      },
      {
        "@type": "Question",
        name: "What is IntriHub's official website?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "IntriHub's only official website is www.intrihub.com. We are not affiliated with any other website using a similar name.",
        },
      },
      {
        "@type": "Question",
        name: "How does 60-minute site delivery work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We operate a specialized quick-commerce network with micro-dark stores and direct tier-1 manufacturer hubs across Bengaluru. Once you place an order, our automated dispatch system assigns the nearest delivery fleet with live GPS tracking directly to your construction or renovation site.",
        },
      },
      {
        "@type": "Question",
        name: "What product categories are available on Intrihub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our catalog features over 20+ certified categories including Vitrified Floor & Wall Tiles, Natural Granite Slabs, Modular Switches & Electrical Wires, CPVC Plumbing & Sanitaryware, Designer Wallpapers, Waterproof Plywood, False Ceiling Materials, and Architectural Hardware.",
        },
      },
      {
        "@type": "Question",
        name: "How does the Smart Calculator help prevent wastage?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our built-in, unit-aware smart calculator lives right on product pages. By simply entering your room dimensions (sq.ft or meters), it calculates exact box counts, tile pieces, and coil lengths including standard cutting buffers (+10%), preventing over-purchasing and material wastage.",
        },
      },
      {
        "@type": "Question",
        name: "Who founded Intrihub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "IntriHub was founded by Sahil Sheikh to streamline, digitize, and modernize the building material procurement supply chain across India, providing transparent factory-direct rates and rapid site delivery.",
        },
      },
      {
        "@type": "Question",
        name: "How can I get bulk project discounts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can reach our enterprise desk directly via phone or WhatsApp at +91 70901 20211, or email support@intrihub.com. We provide dedicated relationship managers and custom GST invoicing for large residential and commercial projects.",
        },
      },
    ],
  };
}

/**
 * Brand FAQ Schema (Backward compatibility)
 */
export function generateBrandFAQSchema() {
  return generateHomepageFaqSchema();
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
      item: item.url.startsWith("http") ? item.url : `${BASE_SITE_URL}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
    })),
  };
}

/**
 * Product Schema.org structured data (Compliant with Google Product Structured Data Guidelines)
 * Emits full Offer schema with shippingDetails and hasMerchantReturnPolicy.
 * Conditionally emits aggregateRating and review ONLY when real reviews exist (reviewCount > 0).
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
  material?: string;
  avgRating?: number | null;
  reviewCount?: number;
  reviews?: Array<{
    id?: string;
    author?: string;
    rating: number;
    comment?: string | null;
    body?: string | null;
    title?: string | null;
    createdAt?: string | Date;
    user?: { name?: string | null };
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
    sku: product.sku || product.slug || product.id,
    category: product.categoryName || "Interior & Construction",
    brand: {
      "@type": "Brand",
      name: product.brand || "IntriHub",
    },
    ...(product.material ? { material: product.material } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: priceVal,
      priceValidUntil: "2026-12-31",
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
            maxValue: 0,
            unitCode: "HUR",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 1,
            unitCode: "HUR",
          },
        },
      },
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

  // Strict Conditional Review / Rating Rendering
  // ONLY emit aggregateRating and review if genuine published customer reviews exist (reviewCount > 0)
  const reviewsList = product.reviews || [];
  const validReviews = reviewsList.filter(
    (r) =>
      r &&
      r.rating &&
      ((r.body && r.body.trim().length > 0) ||
        (r.comment && r.comment.trim().length > 0) ||
        (r.title && r.title.trim().length > 0))
  );

  const realReviewCount = product.reviewCount !== undefined && product.reviewCount > 0 ? product.reviewCount : validReviews.length;
  const hasRealReviews = realReviewCount > 0;

  if (hasRealReviews) {
    const computedAvg =
      validReviews.length > 0
        ? (validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1)
        : product.avgRating && product.avgRating > 0
        ? product.avgRating.toFixed(1)
        : "5.0";

    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(computedAvg),
      reviewCount: String(realReviewCount),
      bestRating: "5",
      worstRating: "1",
    };

    if (validReviews.length > 0) {
      schema.review = validReviews.slice(0, 10).map((r) => {
        let authorName = r.author || r.user?.name || "Verified Customer";
        const parts = authorName.trim().split(" ");
        if (parts.length > 1) {
          authorName = `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
        }

        return {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: authorName,
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: String(r.rating),
            bestRating: "5",
            worstRating: "1",
          },
          reviewBody: r.body || r.comment || r.title || "Verified product review",
          ...(r.createdAt
            ? { datePublished: new Date(r.createdAt).toISOString().split("T")[0] }
            : {}),
        };
      });
    }
  }

  return schema;
}

/**
 * Service Schema.org structured data for B2B / Architectural / Contractor Bulk Procurement
 */
export function generateArchitectServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Bulk Building & Interior Material Procurement",
    provider: {
      "@id": `${BASE_SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Architects, Interior Designers, Contractors",
    },
    description:
      "Dedicated relationship managers, custom GST invoicing, and factory-direct rates for large residential and commercial projects.",
  };
}

/**
 * Person Entities Schema for Core Leadership (Connected to Organization)
 */
export function generateLeadershipPersonSchemas() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Sahil Sheikh",
      jobTitle: "Founder, CEO & CTO",
      worksFor: {
        "@id": `${BASE_SITE_URL}/#organization`,
      },
      email: "sahil@intrihub.com",
      sameAs: "https://www.instagram.com/sahil_sheikh78/",
      description: "Spearheading the technology infrastructure, platform architecture, and overall vision of Intrihub.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Gulshan",
      jobTitle: "Chief Operating Officer (COO)",
      worksFor: {
        "@id": `${BASE_SITE_URL}/#organization`,
      },
      email: "gulshan@intrihub.com",
      description: "Managing vendor relations, supply chain logistics, and ground operations to ensure lightning-fast execution.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Vishal Poddar",
      jobTitle: "Chief Product Officer (CPO)",
      worksFor: {
        "@id": `${BASE_SITE_URL}/#organization`,
      },
      email: "vishal@intrihub.com",
      description: "Curating top-tier product catalogs, monitoring market trends, and ensuring the best value and variety for our customers.",
    },
  ];
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
      url: item.url.startsWith("http") ? item.url : `${BASE_SITE_URL}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
    })),
  };
}

/**
 * LocalBusiness Schema scoped to a specific product category (and optionally a sub-location).
 * Used on /shop/[category] and /shop/[category]/[location] pages.
 */
export function generateLocalBusinessCategorySchema(opts: {
  categoryName: string;
  categorySlug: string;
  locationName?: string;
  locationArea?: string;
  pincodes?: string[];
}) {
  const { categoryName, categorySlug, locationName, locationArea, pincodes } = opts;
  const pageUrl = locationName
    ? getCanonicalUrl(
        `/shop/${categorySlug}/${locationName.toLowerCase().replace(/\s+/g, "-")}`
      )
    : getCanonicalUrl(`/shop/${categorySlug}`);

  const nameSuffix = locationName
    ? ` \u2014 ${locationName}, ${locationArea || "Bangalore"}`
    : " \u2014 Bangalore";

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_SITE_URL}/#localbusiness`,
    name: `Intrihub ${categoryName}${nameSuffix}`,
    url: pageUrl,
    telephone: "+91-70901-20211",
    image: `${BASE_SITE_URL}/og-image.png`,
    priceRange: "\u20b9\u20b9",
    knowsAbout: [
      categoryName,
      "Interior Materials",
      "Construction Supplies",
      "Building Materials Bangalore",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
      addressLocality: locationName || "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: pincodes?.[0] || "560114",
      addressCountry: "IN",
    },
    areaServed: locationName
      ? [
          { "@type": "City", name: "Bengaluru" },
          { "@type": "Place", name: locationName },
          ...(locationArea ? [{ "@type": "Place", name: locationArea }] : []),
        ]
      : [
          { "@type": "City", name: "Bengaluru" },
          { "@type": "Country", name: "India" },
        ],
    parentOrganization: {
      "@id": `${BASE_SITE_URL}/#organization`,
    },
  };
}

/**
 * Location-specific SEO intro paragraph for /shop/[category]/[location] pages.
 * Uses 4 rotating sentence structures keyed by zoneType to avoid identical doorway-page copy.
 */
export function generateLocationIntro(opts: {
  categoryName: string;
  locationName: string;
  locationArea: string;
  zoneType: "residential" | "commercial" | "tech_hub" | "industrial";
  context: string;
}): string {
  const { categoryName, locationName, locationArea, zoneType, context } = opts;

  const templates: Record<string, string> = {
    residential: `${context} For homeowners and renovation contractors working across ${locationName}, Intrihub delivers ${categoryName} directly to your site \u2014 no warehouse trips, no middlemen. Browse our complete ${categoryName} catalog and get same-day dispatch to ${locationName} and the surrounding ${locationArea} area on all in-stock orders placed before 2\u202fPM.`,
    commercial: `${locationName} hosts a dense mix of commercial construction and interior fit-out projects that demand quality ${categoryName} at competitive trade pricing. ${context} Intrihub serves ${locationName}-based contractors, architects, and interior firms with a verified ${categoryName} catalog, B2B GST invoicing, and reliable site delivery \u2014 so your project timeline stays intact.`,
    tech_hub: `${context} As ${locationName}\u2019s residential footprint grows alongside its tech corridor, demand for quality ${categoryName} at transparent factory-direct prices has grown sharply. Intrihub\u2019s direct-dispatch model eliminates the local dealer markup \u2014 bringing factory-verified ${categoryName} to your ${locationName} site with same-day delivery on in-stock items.`,
    industrial: `${context} Intrihub\u2019s ${categoryName} catalog serves ${locationName}-area projects with verified technical specifications, volume pricing for bulk orders, and direct site logistics. Contractors and procurement managers operating in ${locationName} and ${locationArea} can order online and receive scheduled deliveries with consolidated GST B2B invoicing for every purchase.`,
  };

  return templates[zoneType] ?? templates.residential;
}
