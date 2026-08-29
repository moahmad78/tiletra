export interface BuyingGuide {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  author: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string[];
    bulletPoints?: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  relatedCategorySlugs: string[];
}

export const BUYING_GUIDES: BuyingGuide[] = [
  {
    slug: "how-to-choose-tiles-for-home",
    title: "How to Choose the Right Tiles for Your Home: Floor vs Wall & Vitrified Guide",
    shortDescription:
      "A complete guide to choosing between glazed vitrified, double-charge, porcelain, and ceramic tiles for living rooms, kitchens, and bathrooms.",
    category: "Tiles & Flooring",
    readTime: "7 min read",
    publishedAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
    author: "Intrihub Materials Engineering Team",
    summary:
      "Selecting the correct tile depends on foot traffic, slip resistance, water absorption, and aesthetics. Vitrified tiles are ideal for heavy traffic living spaces, while ceramic and porcelain tiles excel on bathroom walls.",
    sections: [
      {
        heading: "1. Understanding Tile Types: Ceramic, Porcelain & Vitrified",
        content: [
          "Ceramic tiles are crafted from red or white clay and kiln-fired at lower temperatures. They are porous and best suited for interior walls and low-traffic areas.",
          "Vitrified tiles are formed through hydraulic pressing of silica, quartz, and feldspar fired at intense temperatures (1200°C+). This creates a glass-like structure with less than 0.5% water absorption, making them exceptionally durable and stain-resistant.",
        ],
        bulletPoints: [
          "Double Charge Vitrified: Features a 3-4mm top layer of colored pigment for heavy commercial and residential traffic.",
          "Glazed Vitrified (GVT / PGVT): Digital printing allows intricate marble, wood, and stone textures with glossy or matte finishes.",
          "Full Body Vitrified: Uniform color throughout the tile thickness, ideal for staircases, parking, and industrial spaces.",
        ],
      },
      {
        heading: "2. Selecting Finishes for Each Room",
        content: [
          "Living Rooms & Bedrooms: Polished Glazed Vitrified (PGVT) with high gloss or satin matte finishes provides an expansive, luxurious feel.",
          "Bathrooms & Balconies: Matte or anti-skid tiles (R9-R11 slip ratings) are essential to prevent slips in wet conditions.",
          "Kitchens: Satin matte or polished porcelain tiles that resist oil stains, turmeric spills, and frequent cleaning.",
        ],
      },
      {
        heading: "3. Popular Tile Sizes and Grout Selection",
        content: [
          "Larger format tiles (600x1200mm and 800x1600mm) create seamless floors with minimal grout lines, making spaces appear larger.",
          "Always use epoxy grout for wet zones and kitchen backsplashes to prevent mold and discoloration over time.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which tile is best for living room floors in India?",
        answer:
          "Glazed Vitrified Tiles (GVT) in 600x1200mm or 800x1600mm size with marble-look patterns are the most popular choice due to high durability, scratch resistance, and low maintenance.",
      },
      {
        question: "What is the difference between GVT and PGVT tiles?",
        answer:
          "GVT (Glazed Vitrified Tile) usually has a matte, satin, or textured finish. PGVT (Polished Glazed Vitrified Tile) has an additional nano-polished high-gloss coating that reflects light brightly.",
      },
      {
        question: "How much wastage should I account for when ordering tiles?",
        answer:
          "For straight laying patterns, add 10% extra buffer for cutting and breakage. For diagonal or herringbone layouts, allocate 15% wastage buffer.",
      },
    ],
    relatedCategorySlugs: ["floor-tiles", "wall-tiles", "tile-adhesives"],
  },
  {
    slug: "granite-vs-tiles-comparison",
    title: "Tiles vs Granite: Which Material Should You Use for Kitchens, Stairs & Floors?",
    shortDescription:
      "Detailed cost, durability, maintenance, and heat-resistance comparison between natural granite stone and large-format vitrified tiles.",
    category: "Granite & Stone",
    readTime: "6 min read",
    publishedAt: "2026-02-18T00:00:00.000Z",
    updatedAt: "2026-08-22T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200",
    author: "Intrihub Structural Sourcing Specialists",
    summary:
      "Granite offers unrivaled heat resistance and natural stone individuality for kitchen countertops and heavy-duty stair treads, whereas vitrified tiles deliver consistent patterns, lighter weight, and easier replacement for general flooring.",
    sections: [
      {
        heading: "1. Heat Resistance & Countertop Performance",
        content: [
          "Kitchen countertops undergo extreme heat, knife cuts, and acidic spills (citrus, vinegar, oils).",
          "Granite is a natural igneous rock that comfortably withstands direct contact with hot pans (up to 400°C) without blistering or cracking. It remains the gold standard for Indian kitchen platforms.",
          "Full-body vitrified tiles and quartz surfaces are viable modern alternatives but require silicone trivets for hot utensils.",
        ],
      },
      {
        heading: "2. Cost & Installation Complexity",
        content: [
          "Granite slabs typically require specialized edge moulding (bullnose, chamfer), heavy transport, and skilled stone masons.",
          "Vitrified tiles are factory-sized with precise calibrated edges, reducing labor costs and installation time by up to 40%.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is granite better than vitrified tiles for kitchen countertops?",
        answer:
          "Yes, natural granite (such as Black Galaxy, Jet Black, or Tan Brown) is superior for main kitchen cooking platforms because of its natural density, heat tolerance, and scratch resistance.",
      },
      {
        question: "Can tiles be laid directly over existing granite floors?",
        answer:
          "Yes, using polymer-modified tile-on-tile adhesives (such as Type 2 C2TE adhesives) allows direct bonding over clean, roughened stone without dismantling the subfloor.",
      },
    ],
    relatedCategorySlugs: ["granite-marble", "floor-tiles", "tile-adhesives"],
  },
  {
    slug: "tile-quantity-calculation-guide",
    title: "How to Calculate Tile Quantity & Box Requirements (Formula with Wastage Buffer)",
    shortDescription:
      "Step-by-step formula to calculate square footage, box count, and mortar requirements for floors, walls, and skirttings.",
    category: "Calculators & Guides",
    readTime: "5 min read",
    publishedAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200",
    author: "Intrihub Project Estimation Team",
    summary:
      "Never run short on material midway through installation. Learn the standard industry formula: (Length × Width) + 10% Wastage ÷ Coverage per Box = Total Boxes Needed.",
    sections: [
      {
        heading: "1. The Standard Area Formula",
        content: [
          "Measure the room length and width in feet. Multiply Length × Width to get the net Floor Area in square feet (sq.ft).",
          "For L-shaped or irregular rooms, divide the layout into smaller rectangles, calculate each area, and sum them together.",
        ],
        bulletPoints: [
          "Net Area = Length (ft) × Width (ft)",
          "Total Area with Wastage = Net Area × 1.10 (for straight lay) or × 1.15 (for herringbone/diagonal)",
          "Total Boxes = Total Area with Wastage ÷ Sq.Ft per Box",
        ],
      },
      {
        heading: "2. Don't Forget Skirting Tiles",
        content: [
          "Skirting runs along the bottom perimeter of the walls (usually 4 to 6 inches high).",
          "Add the room's total perimeter in running feet minus door openings, and multiply by the skirting height to include in your tile order.",
        ],
      },
    ],
    faqs: [
      {
        question: "How many square feet are in a standard box of 600x600mm tiles?",
        answer:
          "A standard box of 600x600mm (2x2 ft) tiles usually contains 4 pieces, which covers approximately 15.5 to 16.0 square feet (1.44 sq. meters).",
      },
      {
        question: "Why is a 10% wastage allowance necessary?",
        answer:
          "Tiling requires cuts around corners, pillars, plumbing pipes, and doorways. Furthermore, tiles from different batch production runs may have slight shade variations, so purchasing adequate quantity upfront guarantees batch consistency.",
      },
    ],
    relatedCategorySlugs: ["floor-tiles", "wall-tiles", "tile-adhesives"],
  },
  {
    slug: "interior-material-checklist-contractors",
    title: "Interior & Construction Material Sourcing Checklist for Contractors and Architects",
    shortDescription:
      "Comprehensive procurement checklist covering civil finishes, electricals, plumbing, sanitaryware, adhesives, and hardware for turnkey interior projects.",
    category: "B2B & Sourcing",
    readTime: "8 min read",
    publishedAt: "2026-02-22T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200",
    author: "Intrihub B2B Trade Supply Desk",
    summary:
      "A structured 5-phase procurement timeline ensuring zero project downtime: Structural Prep, Concealed Utilities, Hard Surfaces & Tiling, Fixtures & Fittings, and Final Touchups.",
    sections: [
      {
        heading: "1. Phase 1: Concealed Infrastructure (Plumbing & Electricals)",
        content: [
          "Concealed conduits, CPVC/UPVC water supply pipes, drainage lines, and FRLS electrical cables must be procured first before wall plastering.",
        ],
        bulletPoints: [
          "ISI certified CPVC & PVC pipes and fittings (Class 1 & Class 2)",
          "Flame Retardant Low Smoke (FRLS) copper wires (1.0 sq.mm to 6.0 sq.mm)",
          "Concealed flush cisterns, diverters, and stop cocks",
        ],
      },
      {
        heading: "2. Phase 2: Flooring, Walls & Tile Adhesives",
        content: [
          "Source floor tiles, wall tiles, and engineered tile adhesives together with spacer clips to achieve level lippage-free surfaces.",
        ],
        bulletPoints: [
          "Vitrified floor tiles and anti-skid bathroom tiles",
          "Type 1 & Type 2 polymer modified tile adhesives and epoxy grouts",
          "Waterproofing chemical membranes for sunken slabs and wet areas",
        ],
      },
    ],
    faqs: [
      {
        question: "Can Intrihub provide GST invoices and bulk trade pricing for contractors?",
        answer:
          "Yes. Intrihub provides full GST compliant input tax credit (ITC) invoices, consolidated project billing, and direct factory wholesale pricing on bulk orders.",
      },
      {
        question: "Does Intrihub offer multi-drop site deliveries for commercial projects?",
        answer:
          "Yes. We coordinate phased site deliveries directly to your project location in Bangalore and across major Indian cities.",
      },
    ],
    relatedCategorySlugs: ["electricals", "sanitaryware", "tile-adhesives", "hardware"],
  },
  {
    slug: "how-intrihub-delivers-materials-in-60-minutes",
    title: "How IntriHub Delivers Building & Interior Materials in 60 Minutes Across Bangalore",
    shortDescription:
      "A deep dive into IntriHub's quick-commerce logistics network: hyper-local dark stores, automated dispatch, palletized transport, and zero-breakage construction supplies delivery.",
    category: "Quick Commerce & Logistics",
    readTime: "6 min read",
    publishedAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200",
    author: "Sahil Sheikh (Founder & CEO, IntriHub)",
    summary:
      "Standard construction procurement in India takes days or weeks. IntriHub operates a quick-commerce network across Bangalore, delivering essential electricals, tiles, sanitaryware, adhesives, and hardware directly to construction sites within 60 minutes.",
    sections: [
      {
        heading: "1. The 60-Minute Quick Commerce Model for Building Materials",
        content: [
          "Construction downtime costs builders and homeowners immense money when workers sit idle waiting for missing cables, adhesive bags, or plumbing valves.",
          "IntriHub solves this through strategically located micro-fulfillment hubs (dark stores) across Begur, Electronic City, Whitefield, and North Bengaluru stocked with high-frequency SKUs.",
        ],
        bulletPoints: [
          "Hyper-local dispatch centers positioned within 10km radius of major construction corridors.",
          "Instant order routing algorithm selecting the closest hub with live inventory allocation.",
          "Specialized fleet handling heavy pallets, fragile sanitaryware, and bulk project supplies safely.",
        ],
      },
      {
        heading: "2. Zero-Breakage Packaging & Live Tracking",
        content: [
          "Tiles, granite, and porcelain sanitaryware are vulnerable to mishandling in regular parcel transport.",
          "Every IntriHub delivery utilizes reinforced edge guards, cushioned pallet straps, and direct-vehicle dispatch with real-time GPS tracking so project supervisors know exact arrival times.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which areas in Bangalore are eligible for IntriHub's 60-minute delivery?",
        answer:
          "IntriHub delivers within 60 minutes across South Bangalore (Begur, HSR Layout, Koramangala, Electronic City, Bannerghatta Rd) and major surrounding tech and residential hubs, with pan-Bangalore express coverage.",
      },
      {
        question: "Can I order heavy building materials like cement and granite for 60-minute delivery?",
        answer:
          "Yes. Our rapid dispatch fleet includes high-payload flatbed and hydraulic-tail vehicles capable of transporting up to 2.5 tons of construction supplies in a single fast-track dispatch.",
      },
    ],
    relatedCategorySlugs: ["floor-tiles", "electricals", "plumbing-sanitary", "hardware"],
  },
  {
    slug: "founders-note-why-we-started-intrihub",
    title: "Founder's Note: Why We Started IntriHub to Revolutionize Building & Interior Supplies",
    shortDescription:
      "Our founding vision: eliminating middlemen markups, ending project delays with 60-minute delivery, and creating India's most transparent interior materials marketplace.",
    category: "Company & Vision",
    readTime: "5 min read",
    publishedAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200",
    author: "Sahil Sheikh (Founder & Lead Architect, IntriHub)",
    summary:
      "IntriHub was founded with a single mission: Everything for Every Space. We connect manufacturers directly with homeowners, architects, and builders with honest pricing and instant doorstep site delivery.",
    sections: [
      {
        heading: "1. The Broken Reality of Traditional Material Sourcing",
        content: [
          "For decades, buying tiles, bath fittings, and hardware meant navigating opaque pricing, multiple broker tiers, unreliable quality grades, and week-long delivery delays.",
          "As an architect and builder, I saw first-hand how much time and energy was wasted chasing materials instead of focusing on craft and design.",
        ],
      },
      {
        heading: "2. The IntriHub Promise: Direct, Transparent & Instant",
        content: [
          "We built IntriHub to democratize access to factory-direct materials. Every price is published openly, coverage calculators eliminate guesswork, and our 60-minute quick-commerce fleet ensures zero site downtime.",
        ],
        bulletPoints: [
          "Direct-from-factory sourcing with guaranteed ISI and ISO certifications.",
          "Wholesale trade rates available for both individual homeowners and commercial contractors.",
          "Tech-driven inventory and rapid dispatch fleet anchored in Bengaluru.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where is IntriHub headquartered?",
        answer:
          "IntriHub is headquartered at 41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114, India.",
      },
      {
        question: "How can manufacturers and vendors partner with IntriHub?",
        answer:
          "Suppliers and verified manufacturers can register directly via our Vendor Portal (intrihub.com/vendor/login) or reach our onboarding team at vendor@intrihub.com.",
      },
    ],
    relatedCategorySlugs: ["floor-tiles", "lighting", "paint-finishes", "furniture"],
  },
];

export function getBuyingGuideBySlug(slug: string): BuyingGuide | undefined {
  return BUYING_GUIDES.find((g) => g.slug === slug);
}

