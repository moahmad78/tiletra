import React from "react";

const BRAND_FAQS = [
  {
    q: "What is Intrihub?",
    a: "IntriHub is India's premier instant building and interior materials marketplace. We connect homeowners, architects, interior designers, and contractors directly to certified manufacturing hubs, providing wholesale pricing on tiles, granite, electrical wires, sanitaryware, false ceilings, and hardware with 60-minute site delivery in Bengaluru and pan-India dispatch.",
  },
  {
    q: "How does 60-minute site delivery work?",
    a: "We operate a specialized quick-commerce network with micro-dark stores and direct tier-1 manufacturer hubs across Bengaluru. Once you place an order, our automated dispatch system assigns the nearest delivery fleet with live GPS tracking directly to your construction or renovation site.",
  },
  {
    q: "What product categories are available on Intrihub?",
    a: "Our catalog features over 20+ certified categories including Vitrified Floor & Wall Tiles, Natural Granite Slabs, Modular Switches & Electrical Wires, CPVC Plumbing & Sanitaryware, Designer Wallpapers, Waterproof Plywood, False Ceiling Materials, and Architectural Hardware.",
  },
  {
    q: "How does the Smart Calculator help prevent wastage?",
    a: "Our built-in, unit-aware smart calculator lives right on product pages. By simply entering your room dimensions (sq.ft or meters), it calculates exact box counts, tile pieces, and coil lengths including standard cutting buffers (+10%), preventing over-purchasing and material wastage.",
  },
  {
    q: "Who founded Intrihub?",
    a: "IntriHub was founded by Sahil Sheikh to streamline, digitize, and modernize the building material procurement supply chain across India, providing transparent wholesale rates and rapid site delivery.",
  },
  {
    q: "How can I get bulk project discounts?",
    a: "You can reach our enterprise desk directly via phone or WhatsApp at +91 92649 20211, or email support@intrihub.com. We provide dedicated relationship managers and custom GST invoicing for large residential and commercial projects.",
  },
];

export default function IntrihubBrandSEOSection() {
  // JSON-LD Structured Data Schema for Google Search Rich Snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BRAND_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "IntriHub",
    url: "https://www.intrihub.com",
    logo: "https://www.intrihub.com/logo/intri-web-logo.png",
    description:
      "India's Premier Instant Building and Interior Materials Marketplace delivering factory-direct tiles, granite, electrical, and sanitaryware across Bengaluru and pan-India.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9264920211",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  };

  return (
    <>
      {/* ── 1. Structured JSON-LD Data for Google Search Indexing ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* ── 2. Semantic Crawlable HTML for Search Engines (Visually Hidden via sr-only) ── */}
      <section className="sr-only" aria-hidden="false" aria-label="About IntriHub Building Materials">
        <h2>Why Builders, Designers & Homeowners Trust IntriHub</h2>
        <p>
          India&apos;s Building & Interior Marketplace. A comprehensive quick-commerce ecosystem
          for interior finishes and construction supplies. From foundation to final fixtures, we
          deliver factory-direct vitrified tiles, granite, electrical wires, sanitaryware, and
          hardware directly to your site within 60 minutes across Bengaluru and Pan-India.
        </p>

        <h3>Key Brand Pillars & Services</h3>
        <ul>
          <li>
            <strong>Factory-Direct Pricing:</strong> Bypass multi-tier distributor markups to access
            verified wholesale rates on 20,000+ certified products.
          </li>
          <li>
            <strong>60-Minute Site Dispatch:</strong> Never halt on-site work. Real-time GPS tracked
            delivery fleet dispatches critical materials straight to your project.
          </li>
          <li>
            <strong>Smart Quantity Calculator:</strong> Automatically calculate exact box counts, tile
            pieces, and wire lengths with a standard +10% cutting buffer.
          </li>
          <li>
            <strong>100% Genuine Guarantee:</strong> Every item is quality-inspected, backed by standard
            manufacturer warranties, and transit-packed for zero breakage.
          </li>
        </ul>

        <h3>Frequently Asked Questions</h3>
        <dl>
          {BRAND_FAQS.map((faq, idx) => (
            <React.Fragment key={idx}>
              <dt>{faq.q}</dt>
              <dd>{faq.a}</dd>
            </React.Fragment>
          ))}
        </dl>

        <div>
          <a href="/shop">Explore Catalog</a>
          <a href="https://wa.me/919264920211">Talk to Material Expert</a>
        </div>
      </section>
    </>
  );
}
