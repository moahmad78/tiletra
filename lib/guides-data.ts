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
    image: "/images/categories/cat-tiles-stone.jpg",
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
    relatedCategorySlugs: ["tiles-stone", "adhesives-sealants-waterproofing", "flooring"],
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
    image: "/images/categories/cat-granite.jpg",
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
    relatedCategorySlugs: ["tiles-stone", "granite", "adhesives-sealants-waterproofing"],
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
    image: "/images/categories/cat-floor-tiles.jpg",
    author: "Intrihub Materials Engineering Team",
    summary:
      "Avoid under-ordering delays or excess dead-stock costs by using the standard industry tile formula: (Room Length × Width) + 10% cutting buffer divided by box coverage.",
    sections: [
      {
        heading: "1. The Standard Tile Quantity Formula",
        content: [
          "Total Area (sq.ft) = Room Length (ft) × Room Width (ft)",
          "Net Tile Required = Total Area × 1.10 (Adding 10% cutting and corner wastage buffer)",
          "Total Boxes Required = Net Tile Area ÷ Coverage per Box (sq.ft)",
        ],
        bulletPoints: [
          "Always round UP to the nearest full box — tiles cannot be bought in loose partial boxes.",
          "Keep 1 spare box preserved in your utility area for future pipe repairs or renovation patchups.",
        ],
      },
      {
        heading: "2. Estimating Adhesive and Grout",
        content: [
          "For standard 600x600mm vitrified tiles, plan for approximately 1 bag (20kg) of polymer-modified adhesive per 40-50 sq.ft of floor area.",
          "Epoxy grouts require 1kg per 70-100 sq.ft depending on joint width (2mm to 4mm spacer).",
        ],
      },
    ],
    faqs: [
      {
        question: "How many square feet are in a standard 600x600mm tile box?",
        answer:
          "Most manufacturers pack four 600x600mm tiles per box, delivering approximately 15.5 to 15.6 sq.ft of floor coverage per box.",
      },
      {
        question: "Why is a 10% wastage allowance necessary?",
        answer:
          "Tiling requires cuts around corners, pillars, plumbing pipes, and doorways. Furthermore, tiles from different batch production runs may have slight shade variations, so purchasing adequate quantity upfront guarantees batch consistency.",
      },
    ],
    relatedCategorySlugs: ["tiles-stone", "adhesives-sealants-waterproofing", "flooring"],
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
    image: "/images/categories/cat-hardware-fittings.jpg",
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
          "Yes. Intrihub provides full GST compliant input tax credit (ITC) invoices, consolidated project billing, and direct factory pricing on bulk orders.",
      },
      {
        question: "Does Intrihub offer multi-drop site deliveries for commercial projects?",
        answer:
          "Yes. We coordinate phased site deliveries directly to your project location in Bangalore and across major Indian cities.",
      },
    ],
    relatedCategorySlugs: ["electrical", "plumbing-sanitary", "adhesives-sealants-waterproofing", "hardware-fittings"],
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
    image: "/images/banners/banner-slide-1.jpg",
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
    relatedCategorySlugs: ["tiles-stone", "electrical", "plumbing-sanitary", "hardware-fittings"],
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
    image: "/images/banners/banner-slide-2.jpg",
    author: "Sahil Sheikh (Founder & Lead Architect, IntriHub)",
    summary:
      "IntriHub was founded with a single mission: Build Better, We Deliver Faster. We connect manufacturers directly with homeowners, architects, and builders with honest pricing and instant doorstep site delivery.",
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
          "Direct factory rates available for both individual homeowners and commercial contractors.",
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
    relatedCategorySlugs: ["tiles-stone", "lighting", "paint-finishes", "furniture"],
  },
  {
    slug: "building-material-list-for-house-construction-bengaluru",
    title: "Building Material List for House Construction in Bengaluru (Stage-Wise Checklist & Sourcing Tips)",
    shortDescription:
      "A complete, stage-by-stage building material checklist for residential home construction in Bengaluru. Covers foundation cement, TMT steel, CPVC plumbing, vitrified tiles, electricals, and false ceiling.",
    category: "Construction & Building Materials",
    readTime: "8 min read",
    publishedAt: "2026-09-24T00:00:00.000Z",
    updatedAt: "2026-09-24T00:00:00.000Z",
    image: "/images/categories/cat-tiles-stone.jpg",
    author: "IntriHub Civil & Materials Engineering Team",
    summary:
      "Constructing a residential home in Bengaluru requires precision material scheduling across 7 distinct building phases. Learn exact grade specifications (OPC/PPC cement, Fe-550D TMT steel, CPVC pipes, vitrified tiles) and order-smart logistics strategies to prevent site downtime and budget overruns.",
    sections: [
      {
        heading: "1. Stage 1: Foundation & Substructure Materials",
        content: [
          "The substructure bears the entire structural load of the building. In Bengaluru's red clay and rocky subsoil, choosing the right grade of cement and high-ductility steel prevents foundation settlement and dampness.",
        ],
        bulletPoints: [
          "Cement: OPC 53 Grade (Ultratech / Birla Super) for structural RCC footings and columns; PPC (Portland Pozzolana Cement) for plain concrete beds and moisture resistance.",
          "TMT Steel Bars: Fe-550D primary grade rebar (Tata Tiscon / JSW Neosteel / Jindal Panther) in 8mm, 10mm, 12mm, 16mm, and 20mm diameters.",
          "Sand & Aggregates: Manufactured Sand (M-Sand for concrete, P-Sand for plastering) and graded blue metal granite aggregates (20mm down and 40mm).",
          "Anti-Termite Treatment: Chlorpyrifos or Imidacloprid emulsion applied along the foundation trench and plinth backfill.",
        ],
      },
      {
        heading: "2. Stage 2: Superstructure, Masonry & Wall Construction",
        content: [
          "Wall construction in modern Bengaluru builds utilizes lightweight, thermally efficient blocks or traditional wire-cut red bricks to optimize dead weight and thermal insulation.",
        ],
        bulletPoints: [
          "Wall Units: AAC (Autoclaved Aerated Concrete) lightweight blocks (6-inch external walls, 4-inch partition walls) or Solid Concrete Blocks.",
          "Block Jointing Mortar: Thin-bed polymer adhesive (Roff / Saint-Gobain) to eliminate 14-day water curing and prevent shrinkage cracks.",
          "DPC (Damp Proof Course): 50mm concrete band with integral waterproofing compound (Dr. Fixit 101 LW+) at plinth level.",
        ],
      },
      {
        heading: "3. Stage 3: Plumbing, Drainage & Water Supply Infrastructure",
        content: [
          "Concealed plumbing requires high-pressure, non-corrosive piping systems to withstand Bengaluru's borewell water hardness and high municipal Cauvery water pressure.",
        ],
        bulletPoints: [
          "Hot & Cold Water Supply: SDR 11 CPVC pipes & brass threaded fittings (Astral / Ashirvad / Supreme) rated up to 93°C.",
          "Cold Water Riser Lines: Class 1 / Class 2 UPVC heavy-duty solvent-weld pipes for external shafts.",
          "Sewage & Rainwater Drainage: PVC SWR (Soil, Waste, Rainwater) ring-fit pipes (110mm and 75mm) for leak-proof vertical downspouts.",
          "Overhead Water Storage: Triple-layer or 4-layer antimicrobial UV-stabilized rotational polyethylene tanks (Sintex / Astral).",
        ],
      },
      {
        heading: "4. Stage 4: Electrical Conduits & Concealed Wiring",
        content: [
          "Concealed electrical lines must be installed before wall plastering. Always specify Flame Retardant Low Smoke (FRLS) certified copper wires for residential safety.",
        ],
        bulletPoints: [
          "Conduit Pipes: Heavy mechanical grade PVC conduit pipes (20mm, 25mm) with solvent-welded junction boxes embedded in brickwork.",
          "House Wires: 100% electrolytic pure copper FRLS-H insulated multi-strand wires (Polycab / Havells / Finolex) — 1.5 sq.mm for lighting, 2.5 sq.mm for standard sockets, 4.0 sq.mm for ACs & geysers.",
          "Concealed Metal Boxes: Galvanized steel modular back boxes (18-gauge) with earthing screws.",
          "Grounding & Protection: 100% copper bonded earthing electrode rods with backfill chemical bentonite compound.",
        ],
      },
      {
        heading: "5. Stage 5: Plastering, Waterproofing & POP False Ceiling",
        content: [
          "Surface leveling and moisture protection safeguard your interior finishes against Bengaluru's monsoon dampness.",
        ],
        bulletPoints: [
          "Internal Plaster: Ready-mix gypsum plaster (Saint-Gobain Elite / Gyproc) for direct paint-ready velvet wall finish, saving sand and water curing.",
          "External Plaster: 1:4 cement-sand mortar enhanced with styrene-butadiene rubber (SBR) latex bonding agents.",
          "Wet Area Waterproofing: 2-coat elastomeric acrylic polymer waterproofing slurry membrane (Dr. Fixit Fastflex / Fosroc Brushbond) for bathrooms and sunken slabs.",
          "False Ceiling Framing: 0.50mm BMT Hot-dip galvanized steel (GI) perimeter channels, ceiling sections, and intermediate channels with 12.5mm moisture-resistant gypsum boards.",
        ],
      },
      {
        heading: "6. Stage 6: Flooring, Vitrified Tiles, Granite & Surface Finishes",
        content: [
          "Flooring represents a substantial portion of the interior budget. Vitrified tiles and natural south Indian granite provide the highest longevity and aesthetic value.",
        ],
        bulletPoints: [
          "Living & Dining: Glazed Vitrified Tiles (GVT/PGVT in 800x1600mm or 600x1200mm slabs) or South Indian Natural Granite (Tan Brown, Black Pearl).",
          "Bathrooms & Balconies: Matt anti-skid floor tiles (300x300mm or 600x600mm with R10 slip rating).",
          "Tile Fixing: Type 2 C2TE polymer-modified tile adhesive (Roff T02 / Saint-Gobain Weber) to prevent hollow sound and debonding.",
          "Grout: 100% solid epoxy tile grout (Roff Rainbow / Kerakoll) for waterproof, stain-proof tile joints in wet areas.",
        ],
      },
      {
        heading: "7. Stage 7: Doors, Windows, Laminates & Architectural Hardware",
        content: [
          "Finishing hardware and woodwork provide daily tactile quality and long-term home security.",
        ],
        bulletPoints: [
          "Door Cores: Boiling Water Proof (BWP / IS:2202) solid pine wood core flush doors.",
          "Decorative Surface: 1.0mm high-pressure interior laminates (Greenlam / Century / Merino).",
          "Hardware & Locks: SS 304 architectural ball-bearing hinges, heavy-duty concealed door closers, and brass cylinder mortise locksets (Godrej / Yale / Dorset).",
        ],
      },
      {
        heading: "8. Order-Smart Sourcing & Logistics Tips for Bengaluru Builders",
        content: [
          "Bengaluru's unique traffic regulations and construction dynamics require strategic material scheduling to avoid fines and costly labor downtime.",
        ],
        bulletPoints: [
          "Traffic Delivery Windows: Heavy 6-wheel delivery trucks are restricted in BBMP core zones during peak hours (8 AM - 11 AM & 5 PM - 8 PM). Schedule bulk cement and steel deliveries during afternoon or early morning slots.",
          "Batch Wastage Buffer: Always order +10% extra on tiles, plumbing fittings, and wiring to accommodate cutting cuts and preserve production shade batch match.",
          "Zero-Downtime Finishing Sourcing: For missing hardware, adhesives, and electricals during final staging, utilize IntriHub's 60-minute quick-commerce delivery to keep masons and carpenters working without half-day delays.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I calculate the total cement required for a 1,000 sq.ft house in Bengaluru?",
        answer:
          "For a standard 1,000 sq.ft residential G+1 building, the rule-of-thumb cement requirement is approximately 400 to 450 bags across RCC foundation, slab casting, masonry blockwork, and two coats of plastering.",
      },
      {
        question: "Is CPVC or UPVC better for bathroom plumbing in Bengaluru?",
        answer:
          "CPVC (Chlorinated Polyvinyl Chloride) is mandatory for hot and cold internal bathroom supply lines because it withstands geyser temperatures up to 93°C. UPVC is ideal for external cold water downlines and rainwater harvesting connections.",
      },
      {
        question: "Can I order building materials online in Bengaluru with same-day site delivery?",
        answer:
          "Yes. IntriHub offers 60-minute express site delivery across Bengaluru for finishing materials, adhesives, electricals, plumbing, and architectural hardware, alongside scheduled freight delivery for heavy materials.",
      },
      {
        question: "Why should polymer tile adhesive be used instead of traditional sand-cement mortar for vitrified tiles?",
        answer:
          "Vitrified tiles have very low water absorption (<0.5%), meaning cement slurry cannot penetrate to form a mechanical key. Polymer-modified tile adhesives form chemical bonds with high tensile adhesion, eliminating debonding, pop-ups, and hollow sounds.",
      },
    ],
    relatedCategorySlugs: [
      "tiles-stone",
      "plumbing",
      "electrical",
      "hardware",
      "false-ceiling",
      "granite",
      "adhesives-sealants-waterproofing",
    ],
  },
];

export function getBuyingGuideBySlug(slug: string): BuyingGuide | undefined {
  return BUYING_GUIDES.find((g) => g.slug === slug);
}

