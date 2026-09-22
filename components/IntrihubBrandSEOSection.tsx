import React from "react";

const BRAND_FAQS = [
  {
    q: "What is Intrihub?",
    a: "IntriHub is India's premier instant building and interior materials marketplace. We connect homeowners, architects, interior designers, and contractors directly to certified manufacturing hubs, providing factory-direct pricing on tiles, granite, electrical wires, sanitaryware, false ceilings, and hardware with 60-minute site delivery in Bengaluru and pan-India dispatch.",
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
    a: "IntriHub was founded by Sahil Sheikh to streamline, digitize, and modernize the building material procurement supply chain across India, providing transparent factory rates and rapid site delivery.",
  },
  {
    q: "How can I get bulk project discounts?",
    a: "You can reach our enterprise desk directly via phone or WhatsApp at +91 70901 20211, or email support@intrihub.com. We provide dedicated relationship managers and custom GST invoicing for large residential and commercial projects.",
  },
];

export default function IntrihubBrandSEOSection() {
  return (
    <>
      {/* ── Semantic Crawlable HTML Structure for Search Engines (Visually Hidden via sr-only) ── */}
      <section className="sr-only" aria-hidden="false" aria-label="About IntriHub Building Materials Ecosystem">
        <h2>About IntriHub: India&apos;s Instant Building &amp; Interior Marketplace</h2>
        <p>
          Welcome to IntriHub, India&apos;s trusted building materials online India platform and premier construction material marketplace. We are transforming construction with instant building materials delivery and specialized quick-commerce construction supplies. By offering factory direct building materials and bulk construction materials online, we ensure your projects never halt. Whether you need raw materials for construction India, heavy construction supplies online, or a reliable commercial interior supplies store, we bridge the gap as wholesale building material suppliers and your go-to home building materials online shopping app.
        </p>

        <h3>Why Contractors &amp; Builders Choose IntriHub Across Bengaluru</h3>
        <p>
          As a leading contractor material supply platform and digital construction marketplace for structural building materials online, IntriHub operates a robust supply chain. If you are searching for a trusted building materials supplier Bengaluru, fast construction material delivery Bangalore, or interior materials wholesale Bangalore, our micro-dark store network delivers within 60 minutes. From hardware stores online Bengaluru and tile suppliers in Bangalore to a local plumbing materials shop near me Bangalore, electrical goods wholesale Karnataka, and plywood shop online Bengaluru, we provide rapid dispatch, civil construction items online Bangalore, bulk hardware supplier Bengaluru, architectural supplies Bangalore delivery, and a trusted material marketplace Karnataka.
        </p>

        <div>
          <h4>Transparent Factory-Direct Pricing</h4>
          <p>Get direct-from-manufacturer wholesale rates with zero hidden middleman commissions.</p>
        </div>
        <div>
          <h4>60-Minute Rapid Site Dispatch</h4>
          <p>Instant dispatch hubs across Bengaluru ensuring construction work never halts on site.</p>
        </div>
        <div>
          <h4>Smart Quantity &amp; Box Calculators</h4>
          <p>Accurately estimate tile box counts, plumbing joints, and plywood sheets in seconds.</p>
        </div>

        <h3>Explore Our Certified Product Categories</h3>
        <div>
          <h4>Vitrified Tiles &amp; Flooring Supplies</h4>
          <p>Glazed vitrified tiles, polished granite slabs, parking tiles, and specialized epoxy grouts.</p>
        </div>
        <div>
          <h4>Premium Electrical &amp; Wiring Essentials</h4>
          <p>FR/FRLS copper house wires, modular switch plates, MCB distribution boards, and LED lighting.</p>
        </div>
        <div>
          <h4>Heavy-Duty Plumbing &amp; Piping Materials</h4>
          <p>CPVC, UPVC pipes, brass fittings, concealed cisterns, and luxury sanitaryware.</p>
        </div>
        <div>
          <h4>Plywood, Hardware &amp; Interior Finishes</h4>
          <p>Boiling waterproof (BWP) plywood, designer laminates, architectural hardware, and premium wall paints.</p>
        </div>

        <h3>How Our Quick-Commerce Network Works</h3>
        <p>
          We operate localized micro-fulfillment dark stores across Bengaluru connected with tier-1 factories for instant order routing, automated site dispatch, and damage-free transit.
        </p>

        <h3>Frequently Asked Questions About Ordering</h3>
        <dl>
          {BRAND_FAQS.map((faq, idx) => (
            <React.Fragment key={idx}>
              <dt>{faq.q}</dt>
              <dd>{faq.a}</dd>
            </React.Fragment>
          ))}
        </dl>

        <div>
          <a href="/shop" aria-label="Browse Complete Construction Supplies Catalog">Browse Construction Supplies Catalog</a>
          <a href="https://wa.me/917090120211" aria-label="Connect with IntriHub Project Material Specialist">Connect with Material Specialist</a>
        </div>
      </section>
    </>
  );
}
