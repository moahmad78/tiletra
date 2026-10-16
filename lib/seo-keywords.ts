// System Instructions & Guidance for Agent / Dynamic Page Generation
export const AGENT_SYSTEM_PROMPT = `
You are the SEO & Content Agent for IntriHub (QuickCommerce platform for construction, electrical, plumbing, and hardware materials).

PRIMARY TASKS:
1. Dynamic Route Management: Map incoming SEO slugs to their respective metadata (title, description) and render the core Homepage component.
2. User Intent Retention: All dynamic SEO URLs (/online-hardware-dukan, /online-hardware-shop-bangalore, etc.) MUST deliver the complete IntriHub Homepage UI experience without breaking the layout or forcing redirects.
3. Geo & Intent Focus: Focus on high-conversion keywords around Bangalore local delivery, QuickCommerce site supply, and hardware store/dukan search terms.
4. Brand Taglines Integration: Ensure all dynamic metadata and dynamic headings reflect brand taglines: "Every Material. Every Space." and "Build Better. Deliver Faster."

RULES:
- Maintain canonical links pointing to the specific URL slug or main domain for consolidation.
- Do not modify product catalog states or core homepage features; only adapt dynamic metadata and top announcement/header banners where appropriate.
`;

export interface KeywordSEO {
  slug: string;
  title: string;
  desc: string;
  h1Text?: string;
}

export const SEO_KEYWORDS: KeywordSEO[] = [
  // Short Direct Keyword Slugs
  { 
    slug: "hardwaredukan", 
    title: "Hardware Dukan Online | Fast Site Delivery - IntriHub", 
    desc: "Aapki apni digital hardware dukan. Order building materials, tools, plumbing & electrical hardware online.",
    h1Text: "India's Online Hardware Dukan"
  },
  { 
    slug: "hardwareshop", 
    title: "Hardware Shop Online | Buy Construction Supplies - IntriHub", 
    desc: "Order hardware materials online from trusted digital hardware shop. Express delivery for tools, electricals & plumbing.",
    h1Text: "Digital Hardware Shop for Every Material & Every Space"
  },

  // Dukan Focus
  { 
    slug: "online-hardware-dukan", 
    title: "Online Hardware Dukan | IntriHub", 
    desc: "Aapki apni online hardware dukan. Order building & hardware materials online.",
    h1Text: "India's Trusted Online Hardware Dukan"
  },
  { 
    slug: "online-hardware-dukan-bangalore", 
    title: "Online Hardware Dukan in Bangalore | IntriHub", 
    desc: "Bangalore ki digital hardware dukan. Get fast delivery of construction materials.",
    h1Text: "Bangalore Ki Digital Hardware Dukan"
  },
  { 
    slug: "hardware-dukan-near-me", 
    title: "Online Hardware Dukan Near Me | IntriHub Bangalore", 
    desc: "Fast hardware delivery near you in Bangalore. Order tools, electricals, & plumbing.",
    h1Text: "Online Hardware Dukan Near You"
  },
  { 
    slug: "online-sanitaryware-dukan", 
    title: "Online Sanitaryware Dukan | IntriHub", 
    desc: "Buy sanitaryware, pipes & bathroom fittings online at best prices.",
    h1Text: "Online Sanitaryware & Bathroom Fittings Dukan"
  },
  { 
    slug: "online-building-material-dukan", 
    title: "Online Building Material Dukan | IntriHub", 
    desc: "All construction & building materials delivered directly to your site.",
    h1Text: "Online Building Material Dukan for Direct Site Delivery"
  },

  // Shop & Store Focus
  { 
    slug: "online-hardware-shop-bangalore", 
    title: "Online Hardware Shop in Bangalore | Fast Delivery - IntriHub", 
    desc: "Buy hardware online in Bangalore with express delivery on IntriHub.",
    h1Text: "Online Hardware Shop in Bangalore"
  },
  { 
    slug: "online-hardware-store-in-bangalore", 
    title: "Best Online Hardware Store in Bangalore | IntriHub", 
    desc: "Explore top quality hardware tools, electricals, and plumbing supplies in Bangalore.",
    h1Text: "Best Online Hardware Store in Bangalore"
  },
  { 
    slug: "hardware-material-online-delivery-bangalore", 
    title: "Hardware Material Online Delivery Bangalore | IntriHub", 
    desc: "Order hardware materials online and get fast site delivery across Bangalore.",
    h1Text: "Express Hardware Material Online Delivery in Bangalore"
  },
  { 
    slug: "online-plumbing-hardware-shop-bangalore", 
    title: "Online Plumbing Hardware Shop Bangalore | IntriHub", 
    desc: "CPVC pipes, fittings, taps, and plumbing items online in Bangalore.",
    h1Text: "Online Plumbing Hardware Shop in Bangalore"
  },
  { 
    slug: "electrical-hardware-shop-online-bangalore", 
    title: "Electrical Hardware Shop Online Bangalore | IntriHub", 
    desc: "Wires, switches, conduits, and electrical hardware online delivery.",
    h1Text: "Electrical Hardware Shop Online Bangalore"
  },

  // Quick Delivery Intent
  { 
    slug: "instant-hardware-delivery-bangalore", 
    title: "Instant Hardware Delivery Bangalore | IntriHub QuickCommerce", 
    desc: "Need hardware urgently on site? Get quick delivery across Bangalore with IntriHub.",
    h1Text: "Instant Hardware Delivery Across Bangalore"
  },
  { 
    slug: "quick-commerce-hardware-shop", 
    title: "Quick Commerce Hardware Shop | IntriHub", 
    desc: "India's quick commerce portal for hardware, tools & construction materials.",
    h1Text: "Quick-Commerce Hardware & Construction Materials Portal"
  },
  { 
    slug: "same-day-building-material-delivery-bangalore", 
    title: "Same Day Building Material Delivery Bangalore | IntriHub", 
    desc: "Order tiles, plywood, hardware & get same day site delivery in Bangalore.",
    h1Text: "Same Day Building Material Delivery in Bangalore"
  },
  { 
    slug: "online-construction-material-shop-bangalore", 
    title: "Online Construction Material Shop Bangalore | IntriHub", 
    desc: "Complete construction and hardware supply portal in Bangalore.",
    h1Text: "Online Construction Material Shop in Bangalore"
  },

  // Category Focus
  { 
    slug: "buy-hardware-tools-online-bangalore", 
    title: "Buy Hardware Tools Online Bangalore | IntriHub", 
    desc: "Power tools, hand tools, fasteners & hardware equipment online.",
    h1Text: "Buy Power & Hand Hardware Tools Online"
  },
  { 
    slug: "online-tiles-and-plywood-shop-bangalore", 
    title: "Online Tiles & Plywood Shop Bangalore | IntriHub", 
    desc: "Vitrified tiles, marine ply, commercial plywood online delivery.",
    h1Text: "Online Vitrified Tiles & Plywood Shop in Bangalore"
  },
  { 
    slug: "wholesale-hardware-shop-online-bangalore", 
    title: "Wholesale Hardware Shop Online Bangalore | IntriHub", 
    desc: "Bulk hardware & building materials at wholesale pricing in Bangalore.",
    h1Text: "Wholesale Hardware & Building Material Online Supply"
  },
  { 
    slug: "online-sanitary-and-plumbing-store", 
    title: "Online Sanitary & Plumbing Store | IntriHub", 
    desc: "Premium bathroom fittings, CPVC/PVC pipes & plumbing materials.",
    h1Text: "Online Sanitaryware & Plumbing Material Store"
  },
  { 
    slug: "buy-electrical-goods-online-bangalore", 
    title: "Buy Electrical Goods Online Bangalore | IntriHub", 
    desc: "Modular switches, wires, DB boxes, and lighting supplies online.",
    h1Text: "Buy Wires, Switches & Electrical Goods Online"
  },
  { 
    slug: "online-building-material-store", 
    title: "Online Building Material Store | IntriHub", 
    desc: "Every Material. Every Space. Build better and deliver faster with IntriHub.",
    h1Text: "Every Material. Every Space. Build Better. Deliver Faster."
  }
];

export function getKeywordBySlug(slug: string): KeywordSEO | undefined {
  const normalized = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  return SEO_KEYWORDS.find((k) => k.slug.toLowerCase() === normalized);
}
