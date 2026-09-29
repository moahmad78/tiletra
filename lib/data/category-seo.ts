/**
 * IntriHub Category-wide SEO Spec (2026-09-29)
 * Hand-written copy for 6 core categories.
 * Section 3 draft template for all remaining categories (marked noindex pending founder approval).
 * Zero prohibited intermediary trading terminology.
 * Standard delivery lines: 60-minute delivery in Bengaluru; 3-7 days Pan-India.
 */

export type CategorySeoData = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  seoHeading: string;
  introContent: string;
  subCategoryH2s?: string[];
  faqs: Array<{ question: string; answer: string }>;
  crossLinks: string[];
  isIndexable: boolean;
  deliveryText?: string;
  guideLink?: { title: string; href: string };
};

export const CATEGORY_SEO: Record<string, CategorySeoData> = {
  // =========================================================================
  // 1. ELECTRICAL (Core Category 2.1)
  // =========================================================================
  electrical: {
    metaTitle: "Electrical Materials Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy electrical wires, modular switches, MCBs, conduits and lights online. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order on IntriHub.",
    h1: "Electrical Materials Online",
    seoHeading: "Electrical Materials Online",
    subCategoryH2s: [
      "Wires & Cables",
      "Switches & Sockets",
      "MCBs, RCCBs & DBs",
      "Conduits & Accessories",
      "Lighting",
    ],
    introContent:
      "Wiring a new home or renovating an old one needs many small parts to match, from wires and switches to protection devices and conduits. IntriHub brings electrical materials into one place so you can plan the full job in a single order. Browse by sub-category, compare options, and order for site delivery. In Bengaluru you get 60-minute delivery, and across India delivery takes 3-7 days. For a first-time buyer, our electrical buying guide explains wire sizes, MCB ratings and switch types in simple language.",
    faqs: [
      {
        question: "Which wire size is used for home wiring?",
        answer:
          "Different circuits need different sizes (lights, sockets, AC). Check your electrician's load plan before ordering.",
      },
      {
        question: "What is the difference between MCB and RCCB?",
        answer:
          "An MCB protects against overload and short circuit; an RCCB protects against earth leakage.",
      },
      {
        question: "Can I order electrical materials online for a site outside Bengaluru?",
        answer: "Yes, Pan-India delivery takes 3-7 days.",
      },
    ],
    crossLinks: ["plumbing-sanitary", "hardware-fittings", "lighting"],
    isIndexable: true,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    guideLink: {
      title: "Electrical Material Selection Guide",
      href: "/guides/electrical-material-selection-guide-bengaluru",
    },
  },

  // =========================================================================
  // 2. TILES & STONE (Core Category 2.2 - tiles-stone / tiles)
  // =========================================================================
  "tiles-stone": {
    metaTitle: "Tiles Online: Vitrified, Ceramic & More | IntriHub",
    metaDescription:
      "Shop floor and wall tiles online: vitrified, ceramic, anti-skid and more. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order from IntriHub.",
    h1: "Tiles Online",
    seoHeading: "Tiles Online",
    subCategoryH2s: [
      "Vitrified Tiles",
      "Ceramic Tiles",
      "Bathroom & Kitchen Tiles",
      "Outdoor & Parking Tiles",
      "Tile Adhesives & Spacers",
    ],
    introContent:
      "The right tile depends on the room: glossy for a drawing room, anti-skid for a bathroom or balcony, tougher options for parking. IntriHub lists tiles by type and use so you can narrow down faster. Add adhesive and spacers to the same order so laying goes smoothly. Order 8-10% extra for cutting and breakage, and try to buy from a single batch for consistent shade. Bengaluru gets 60-minute delivery; the rest of India 3-7 days.",
    faqs: [
      {
        question: "Which tile is best for a bathroom?",
        answer: "Anti-skid or matte finish for grip.",
      },
      {
        question: "How much extra tile should I order?",
        answer: "Around 8-10%, more for diagonal or complex patterns.",
      },
      {
        question: "Vitrified or ceramic for flooring?",
        answer:
          "Vitrified is denser and generally preferred for floors; ceramic is common on walls.",
      },
    ],
    crossLinks: ["plumbing-sanitary", "wall-surface", "paint-finishes"],
    isIndexable: true,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    guideLink: {
      title: "Vitrified Tiles Online Buying Guide",
      href: "/guides/vitrified-tiles-online-buying-guide",
    },
  },

  // =========================================================================
  // 3. PLUMBING & SANITARY (Core Category 2.3 - plumbing-sanitary / plumbing)
  // =========================================================================
  "plumbing-sanitary": {
    metaTitle: "Plumbing Materials Online: Pipes, Fittings, Taps | IntriHub",
    metaDescription:
      "Buy plumbing pipes, fittings, valves, taps and bathroom accessories online. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Shop at IntriHub.",
    h1: "Plumbing Materials Online",
    seoHeading: "Plumbing Materials Online",
    subCategoryH2s: [
      "Pipes",
      "Fittings",
      "Valves & Cocks",
      "Taps & Showers",
      "Water Storage & Accessories",
    ],
    introContent:
      "Good plumbing is mostly about matching the right pipe, fitting and valve for the job, hot water, cold water, drainage or supply. IntriHub organises plumbing materials by use so you do not end up with mismatched parts on site. Order pipes, fittings and bathroom accessories together to keep the work moving. Bengaluru orders arrive in 60 minutes; Pan-India orders in 3-7 days.",
    faqs: [
      {
        question: "CPVC or PVC, which should I use?",
        answer:
          "CPVC is commonly used for hot and cold water supply; PVC for drainage and cold lines. Confirm with your plumber.",
      },
      {
        question: "Do I need to order fittings separately?",
        answer:
          "Yes, pipes and fittings are listed separately so you can match sizes.",
      },
      {
        question: "Can I order for a full bathroom in one go?",
        answer:
          "Yes, add pipes, fittings, taps and accessories to a single cart.",
      },
    ],
    crossLinks: ["electrical", "tiles-stone", "hardware-fittings"],
    isIndexable: true,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 4. PLYWOOD & LAMINATES (Core Category 2.4 - plywood)
  // =========================================================================
  plywood: {
    metaTitle: "Plywood & Boards Online for Furniture | IntriHub",
    metaDescription:
      "Buy plywood, block boards, MDF and laminates online for furniture and interiors. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Plywood & Boards Online",
    seoHeading: "Plywood & Boards Online",
    subCategoryH2s: [
      "Plywood",
      "Block Boards",
      "MDF & HDHMR",
      "Laminates & Veneers",
      "Adhesives",
    ],
    introContent:
      "Plywood choice decides how long wardrobes, kitchens and furniture last. Moisture-prone areas like kitchens and bathrooms need water-resistant boards; dry bedrooms may not. IntriHub groups boards by type and use so carpenters and homeowners can choose quickly. Check thickness and grade on each listing before ordering. Bengaluru gets 60-minute delivery; the rest of India 3-7 days.",
    faqs: [
      {
        question: "Which plywood is best for a kitchen?",
        answer: "Water-resistant or waterproof grades are preferred.",
      },
      {
        question: "Plywood or MDF for wardrobes?",
        answer:
          "Plywood is stronger for load-bearing parts; MDF suits smooth, painted finishes.",
      },
      {
        question: "What thickness should I choose?",
        answer:
          "Depends on use; ask your carpenter, and check the listing for thickness options.",
      },
    ],
    crossLinks: ["hardware-fittings", "furniture", "doors-windows"],
    isIndexable: true,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 5. HARDWARE & FITTINGS (Core Category 2.5 - hardware-fittings / hardware)
  // =========================================================================
  "hardware-fittings": {
    metaTitle: "Hardware Store Online: Tools, Fittings, Fasteners | IntriHub",
    metaDescription:
      "Shop hardware online: door and cabinet fittings, locks, screws, tools and fasteners. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Hardware Online",
    seoHeading: "Hardware Online",
    subCategoryH2s: [
      "Door & Window Hardware",
      "Cabinet & Drawer Fittings",
      "Locks & Security",
      "Fasteners & Adhesives",
      "Tools",
    ],
    introContent:
      "Hardware is the small stuff that decides whether a job finishes cleanly, hinges, locks, screws, handles and tools. IntriHub lists hardware by use so you can complete a door, cabinet or site job without running to multiple shops. In Bengaluru, orders arrive in 60 minutes; elsewhere in India, in 3-7 days.",
    faqs: [
      {
        question: "Can I get hardware delivered quickly in Bengaluru?",
        answer: "Yes, 60-minute delivery is available in Bengaluru.",
      },
      {
        question: "Do you have hinges and channels for modular kitchens?",
        answer: "Browse the cabinet & drawer fittings sub-category.",
      },
      {
        question: "Can I order for a site outside Bengaluru?",
        answer: "Yes, Pan-India delivery takes 3-7 days.",
      },
    ],
    crossLinks: ["plywood", "electrical", "plumbing-sanitary"],
    isIndexable: true,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 6. FURNITURE (Core Category 2.6 - furniture)
  // =========================================================================
  furniture: {
    metaTitle: "Furniture Online for Home & Office | IntriHub",
    metaDescription:
      "Browse furniture for home and office online. Beds, storage, tables and seating with delivery in Bengaluru and Pan-India. Shop at IntriHub.",
    h1: "Furniture Online",
    seoHeading: "Furniture Online",
    subCategoryH2s: [
      "Living Room Furniture",
      "Bedroom Furniture",
      "Dining & Seating",
      "Office Storage",
      "Study Tables",
    ],
    introContent:
      "Furniture should suit the room, the budget and the way you live. IntriHub lists furniture by room and use so you can compare quickly. Check dimensions and material on each listing before ordering. Bengaluru delivery is available, and Pan-India delivery takes 3-7 days.",
    faqs: [
      {
        question: "How do I check if a piece will fit my room?",
        answer:
          "Compare the listing's dimensions with your room measurements.",
      },
      {
        question: "Do you deliver furniture outside Bengaluru?",
        answer: "Yes, Pan-India in 3-7 days.",
      },
      {
        question: "Can I combine furniture with other materials in one order?",
        answer: "Yes, add items from any category to the same cart.",
      },
    ],
    crossLinks: ["plywood", "hardware-fittings", "kitchen-wardrobe"],
    isIndexable: true,
    deliveryText: "Bengaluru delivery is available; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 7. LIGHTING (Draft - noindex pending founder approval)
  // =========================================================================
  lighting: {
    metaTitle: "Lighting Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy lighting online: LED downlights, chandeliers and strip lights. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order from IntriHub.",
    h1: "Lighting Online",
    seoHeading: "Lighting Online",
    subCategoryH2s: [
      "COB Downlights",
      "LED Strip Lights",
      "Panel Lights",
      "Decorative Chandeliers",
      "Track Lighting",
    ],
    introContent:
      "Selecting the right lighting scheme transforms modern residential and commercial interiors from plain spaces into warm, welcoming environments. IntriHub organizes lighting fixtures into practical categories including recessed COB downlights, decorative chandeliers, surface panel lights, and flexible cove LED strips. When choosing architectural lighting, consider three essential factors: ceiling cutout dimensions, required color temperature (warm white 3000K vs neutral 4000K), and lumen output per room. In Bengaluru, your lighting orders arrive with 60-minute delivery; across Pan-India, site delivery takes 3-7 days.",
    faqs: [
      {
        question: "What color temperature is best for living rooms?",
        answer:
          "Warm white (3000K) or natural white (4000K) creates a comfortable, balanced ambience for residential living areas.",
      },
      {
        question: "Are drivers included with LED downlights?",
        answer:
          "Yes, all specification-grade recessed LED downlights on IntriHub include compatible surge-protected constant current drivers.",
      },
      {
        question: "How quickly can lighting fixtures be delivered in Bengaluru?",
        answer:
          "Standard in-stock lighting fixtures are dispatched for 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["electrical", "smart-home", "false-ceiling"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 8. PAINT & FINISHES (Draft - noindex pending founder approval)
  // =========================================================================
  "paint-finishes": {
    metaTitle: "Paint & Finishes Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy paint & finishes online: interior emulsions, exterior primers and wood coats. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Paint & Finishes Online",
    seoHeading: "Paint & Finishes Online",
    subCategoryH2s: [
      "Interior Emulsions",
      "Exterior Weatherproof",
      "Wall Primers & Putty",
      "Wood Finishes & Polishes",
      "Enamels & Textures",
    ],
    introContent:
      "A flawless wall or ceiling finish depends on selecting the proper primer, putty base, and topcoat emulsion formulated for your surface. IntriHub lists genuine paints and architectural coatings by application area so contractors and painters can calculate exact coverage without material waste. When purchasing paints, evaluate three critical factors: surface moisture levels, desired sheen (matte, eggshell, or gloss), and whether you need stain-resistant washable durability. In Bengaluru, get 60-minute site delivery; across India, delivery is completed in 3-7 days.",
    faqs: [
      {
        question: "How many coats of interior emulsion are recommended?",
        answer:
          "Two finish coats applied over one coat of primer and two coats of smooth acrylic putty ensure true color opacity.",
      },
      {
        question: "Can I order custom tint shades online?",
        answer:
          "Yes, provide the manufacturer shade code during order placement for automated factory machine tinting.",
      },
      {
        question: "What is the delivery timeline for paints in Bengaluru?",
        answer:
          "In-stock paint cans, primers, and brushes arrive in 60 minutes across Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["wall-surface", "false-ceiling", "tools-consumables"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 9. FALSE CEILING (Draft - noindex pending founder approval)
  // =========================================================================
  "false-ceiling": {
    metaTitle: "False Ceiling Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy false ceiling online: gypsum boards, GI channels and POP plasters. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order from IntriHub.",
    h1: "False Ceiling Online",
    seoHeading: "False Ceiling Online",
    subCategoryH2s: [
      "Gypsum Boards",
      "GI Channels & Grids",
      "POP Powder & Plaster",
      "Acoustic Ceiling Tiles",
      "Fasteners & Screws",
    ],
    introContent:
      "Modern false ceiling systems conceal electrical conduits, integrate cove illumination, and enhance room acoustic insulation. IntriHub connects contractors and builders with verified gypsum plasterboards, galvanized iron (GI) framework channels, and jointing compounds in unified shipments. When planning a false ceiling installation, balance three essential aspects: room perimeter dimensions, plenum depth for recessed downlights, and board moisture resistance for wet zones. Bengaluru orders enjoy 60-minute delivery; nationwide delivery takes 3-7 days.",
    faqs: [
      {
        question: "What gypsum board thickness is standard for ceilings?",
        answer:
          "12.5mm gypsum plasterboard is the standard specification for residential suspended ceilings.",
      },
      {
        question: "Are GI perimeter and intermediate channels compatible?",
        answer:
          "Yes, our GI ceiling sections follow standardized gauge specifications for seamless interlocking.",
      },
      {
        question: "Do you deliver false ceiling materials to job sites?",
        answer:
          "Yes, we provide 60-minute delivery in Bengaluru; 3-7 days Pan-India directly to your active project site.",
      },
    ],
    crossLinks: ["lighting", "electrical", "paint-finishes"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 10. FLOORING (Draft - noindex pending founder approval)
  // =========================================================================
  flooring: {
    metaTitle: "Flooring Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy flooring online: wooden laminates, SPC waterproof planks and vinyl rolls. 60-minute delivery in Bengaluru, 3-7 days Pan-India. IntriHub.",
    h1: "Flooring Online",
    seoHeading: "Flooring Online",
    subCategoryH2s: [
      "Wooden Laminate Flooring",
      "SPC Waterproof Planks",
      "Engineered Hardwood",
      "Vinyl Flooring Rolls",
      "Underlay & Skirting",
    ],
    introContent:
      "Upgrading residential or commercial flooring requires matching the correct core material with foot traffic intensity and moisture exposure. IntriHub supplies high-durability wooden laminates, waterproof SPC (Stone Plastic Composite) click-lock planks, and premium hardwood surfaces. When choosing flooring, evaluate three key factors: AC abrasion rating (AC3 for bedrooms vs AC4/AC5 for commercial corridors), subfloor levelling requirements, and acoustic underlay thickness. Enjoy 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "Is SPC flooring completely waterproof?",
        answer:
          "Yes, SPC flooring features a limestone-composite core that does not expand, contract, or warp from surface water.",
      },
      {
        question: "Can laminate flooring be laid over existing tiles?",
        answer:
          "Yes, provided the tile subfloor is even, dry, and prepared with an appropriate acoustic foam underlay.",
      },
      {
        question: "What is the delivery timeframe for flooring materials?",
        answer:
          "In Bengaluru, orders arrive in 60 minutes; Pan-India orders are delivered in 3-7 days.",
      },
    ],
    crossLinks: ["tiles-stone", "plywood", "doors-windows"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 11. DOORS & WINDOWS (Draft - noindex pending founder approval)
  // =========================================================================
  "doors-windows": {
    metaTitle: "Doors & Windows Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy doors & windows online: flush doors, UPVC sections & aluminium profiles. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order on IntriHub.",
    h1: "Doors & Windows Online",
    seoHeading: "Doors & Windows Online",
    subCategoryH2s: [
      "Solid Flush Doors",
      "UPVC Window Sections",
      "Aluminium Profiles",
      "Pre-Hung Door Frames",
      "Hardware Installation Kits",
    ],
    introContent:
      "Doors and window systems define indoor ventilation, natural illumination, and exterior structural security. IntriHub brings together factory-calibrated flush doors, weather-sealed UPVC sections, and heavy-duty aluminium profile sets. To ensure smooth site fitting, check three parameters: rough masonry opening sizes, wall jamb thickness, and acoustic double-glazing compatibility. Deliveries in Bengaluru arrive within 60 minutes; Pan-India site dispatch takes 3-7 days.",
    faqs: [
      {
        question: "What are standard residential flush door sizes?",
        answer:
          "Common bedroom dimensions are 2100mm height by 825mm or 900mm width, with 30mm or 32mm core thickness.",
      },
      {
        question: "Do UPVC window frames include multipoint locks?",
        answer:
          "Yes, our complete UPVC casement and sliding profiles support multipoint espagnolette security hardware.",
      },
      {
        question: "Can I receive site delivery in Bengaluru?",
        answer:
          "Yes, IntriHub provides 60-minute delivery in Bengaluru; 3-7 days Pan-India for all standard openings.",
      },
    ],
    crossLinks: ["hardware-fittings", "glass-mirror", "safety-fire"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 12. GLASS & MIRROR (Draft - noindex pending founder approval)
  // =========================================================================
  "glass-mirror": {
    metaTitle: "Glass & Mirrors Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy glass & mirrors online: toughened partitions, LED touch vanity mirrors and shower cubicles. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Glass & Mirrors Online",
    seoHeading: "Glass & Mirrors Online",
    subCategoryH2s: [
      "Toughened Partition Glass",
      "LED Vanity Mirrors",
      "Shower Enclosures",
      "Tinted & Fluted Glass",
      "Patch Fittings & Channels",
    ],
    introContent:
      "Architectural glass and smart mirrors open up interior living spaces, maximizing natural light diffusion while maintaining acoustic and thermal separation. IntriHub provides safety-tempered glass panels, fluted decorative glass, and smart defogger LED vanity mirrors. Before ordering, verify three factors: glass thickness requirements (8mm to 12mm for shower enclosures), edge polish types, and floor patch hardware specifications. In Bengaluru, expect 60-minute delivery; nationwide transit takes 3-7 days.",
    faqs: [
      {
        question: "Is 10mm toughened glass safe for bathroom partitions?",
        answer:
          "Yes, 10mm thermally toughened safety glass with polished arrissed edges is the industry standard for walk-in shower partitions.",
      },
      {
        question: "Do LED vanity mirrors need a separate electrical point?",
        answer:
          "Yes, smart touch mirrors require a standard concealed 230V AC supply point behind the mirror backing.",
      },
      {
        question: "How is glass transported safely to my construction site?",
        answer:
          "Our shipments use specialized foam-cushioned A-frames with 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["hardware-fittings", "plumbing-sanitary", "doors-windows"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 13. KITCHEN & WARDROBE (Draft - noindex pending founder approval)
  // =========================================================================
  "kitchen-wardrobe": {
    metaTitle: "Kitchen & Wardrobe Online in Bengaluru & India | IntriHub",
    metaDescription:
      "Buy kitchen & wardrobe accessories online: tandem boxes, pantry pullouts and organizers. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Kitchen & Wardrobe Online",
    seoHeading: "Kitchen & Wardrobe Online",
    subCategoryH2s: [
      "Tandem Drawer Boxes",
      "Pantry & Corner Units",
      "Stainless Steel Wire Baskets",
      "Wardrobe Pull-Outs",
      "Cutlery & Spice Trays",
    ],
    introContent:
      "Ergonomic modular storage hardware streamlines daily meal preparation and wardrobe organization with effortless soft-close mechanisms. IntriHub stocks heavy-capacity slim tandem drawer systems, blind corner swing units, and pull-out trouser racks. When configuring storage modules, evaluate three factors: internal carcass width, drawer runner weight capacity (35kg to 65kg), and anti-corrosive stainless steel grading. Enjoy 60-minute delivery across Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "What carcass widths do tandem drawer kits fit?",
        answer:
          "Our tandem boxes and organizers fit standard modular carcass widths from 450mm, 600mm, to 900mm.",
      },
      {
        question: "Are kitchen baskets made from SS 304 grade steel?",
        answer:
          "Yes, our premium modular kitchen baskets use rust-resistant SS 304 stainless steel with electro-polished chrome finishes.",
      },
      {
        question: "What is the delivery time for kitchen fittings in Bengaluru?",
        answer:
          "In Bengaluru, orders are dispatched for 60-minute delivery; nationwide deliveries arrive in 3-7 days.",
      },
    ],
    crossLinks: ["hardware-fittings", "plywood", "furniture"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 14. WALL & SURFACE (Draft - noindex pending founder approval)
  // =========================================================================
  "wall-surface": {
    metaTitle: "Wall & Surface Finishes Online in Bengaluru | IntriHub",
    metaDescription:
      "Buy wall & surface finishes online: charcoal fluted louvers, wallpapers and 3D acoustic panels. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Wall & Surface Online",
    seoHeading: "Wall & Surface Online",
    subCategoryH2s: [
      "Charcoal Fluted Panels",
      "Non-Woven Wallpapers",
      "PVC Wall Panels",
      "Acoustic Slats",
      "Polyurethane Cornices",
    ],
    introContent:
      "Feature accent walls add tactile texture, depth, and personality to residential living rooms, bed backdrops, and commercial reception lounges. IntriHub offers interlocking charcoal fluted louvers, seamless peel-and-stick wallpapers, and sound-absorbing acoustic felt slats. When choosing wall paneling, verify three factors: wall surface dampness, panel interlocking alignment, and fire-retardant surface rating. Benefit from 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "Can charcoal fluted panels be installed over damp walls?",
        answer:
          "Walls should be treated for water seepage first; panels are moisture-resistant but require a structurally sound substrate.",
      },
      {
        question: "How are decorative wall slats fixed to masonry?",
        answer:
          "Panels are installed using high-tack polymer construction adhesive combined with concealed headless pneumatic pins.",
      },
      {
        question: "What is the delivery speed for wall materials in Bengaluru?",
        answer:
          "In-stock panels arrive with 60-minute delivery in Bengaluru; 3-7 days Pan-India for outstation sites.",
      },
    ],
    crossLinks: ["paint-finishes", "tiles-stone", "false-ceiling"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 15. DECOR & ACCESSORIES (Draft - noindex pending founder approval)
  // =========================================================================
  "decor-accessories": {
    metaTitle: "Home Decor & Accents Online in Bengaluru | IntriHub",
    metaDescription:
      "Buy home decor & accents online: designer wall art, metal planters and table styling pieces. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Decor & Accessories Online",
    seoHeading: "Decor & Accessories Online",
    subCategoryH2s: [
      "Architectural Wall Art",
      "Metal Planters & Stands",
      "Sculptural Table Accents",
      "Area Rugs & Runners",
      "Decorative Wall Clocks",
    ],
    introContent:
      "Curated interior accents and sculptural decor bring cohesiveness, warmth, and artistic balance to newly finished residential and commercial projects. IntriHub offers hand-crafted metal planters, gallery wall art frames, and artisan styling ceramics. When selecting decor pieces, consider three aspects: room color palette harmony, scale relative to surrounding furniture, and low-maintenance durable finishes. In Bengaluru, items arrive via 60-minute delivery; Pan-India transit takes 3-7 days.",
    faqs: [
      {
        question: "Are planters suitable for indoor live plants?",
        answer:
          "Yes, our indoor planters include removable drainage inner pots or leak-proof powder-coated liners.",
      },
      {
        question: "Do wall art pieces include mounting hardware?",
        answer:
          "Yes, all frames and wall art include pre-installed hanging brackets and heavy-duty drywall anchors.",
      },
      {
        question: "How fast is decor delivery in Bengaluru?",
        answer:
          "Standard in-stock decor items are delivered in 60 minutes in Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["furniture", "lighting", "wall-surface"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 16. CURTAINS & BLINDS (Draft - noindex pending founder approval)
  // =========================================================================
  "curtains-blinds": {
    metaTitle: "Curtains & Blinds Online in Bengaluru | IntriHub",
    metaDescription:
      "Buy curtains & blinds online: motorized smart tracks, zebra roller blinds and designer fabrics. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Curtains & Blinds Online",
    seoHeading: "Curtains & Blinds Online",
    subCategoryH2s: [
      "Motorized Smart Tracks",
      "Zebra & Roller Blinds",
      "Blackout Drapery Fabrics",
      "Sheer Linen Curtains",
      "Curtain Rods & Finials",
    ],
    introContent:
      "Custom window dressings and motorized drapery control privacy, natural sun glare, and acoustic insulation in bedrooms and home theaters. IntriHub supplies smart motorized curtain tracks, zebra dual-roller blinds, and UV-resistant sheer linens. When ordering window treatments, check three factors: exact inside versus outside window mount measurements, blackout percentage (70% vs 100%), and remote or smart home motor integration. Receive 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "Can motorized curtain tracks integrate with Alexa or Google Home?",
        answer:
          "Yes, our WiFi smart curtain motors pair directly with voice assistants and mobile smart home automation apps.",
      },
      {
        question: "What is the difference between zebra and roller blinds?",
        answer:
          "Zebra blinds feature alternating sheer and solid stripes for precise light filtering, whereas roller blinds roll up into a single panel.",
      },
      {
        question: "What is the delivery timeline for window blinds in Bengaluru?",
        answer:
          "Standard sizes ship with 60-minute delivery in Bengaluru; 3-7 days Pan-India for custom width fabrics.",
      },
    ],
    crossLinks: ["smart-home", "doors-windows", "decor-accessories"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 17. OFFICE & COMMERCIAL (Draft - noindex pending founder approval)
  // =========================================================================
  "office-commercial": {
    metaTitle: "Office Furniture & Materials Online | IntriHub",
    metaDescription:
      "Buy office furniture & materials online: ergonomic task chairs, workstation desks and storage. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Office & Commercial Materials Online",
    seoHeading: "Office & Commercial Materials Online",
    subCategoryH2s: [
      "Ergonomic Task Chairs",
      "Modular Workstation Pods",
      "Conference Room Tables",
      "Acoustic Desk Dividers",
      "Filing Cabinets & Pedestals",
    ],
    introContent:
      "Equipping modern corporate offices and commercial co-working hubs requires high-durability furniture engineered for daily 10-hour occupational use. IntriHub supplies BIFMA-certified ergonomic mesh chairs, modular linear workstations, and acoustic privacy dividers. When purchasing commercial furniture, review three criteria: adjustable lumbar and armrest ergonomics, wire-management modesty panels, and scratch-resistant laminate worktops. Enjoy 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "Are office task chairs certified for commercial ergonomics?",
        answer:
          "Yes, our chairs feature BIFMA-certified class-4 hydraulic gas lifts with multi-lock synchro-tilt mechanisms.",
      },
      {
        question: "Can workstation clusters be configured for 4 or 6 people?",
        answer:
          "Yes, our modular office desking pods include shared cable raceways and can be daisy-chained for any floor plan layout.",
      },
      {
        question: "Can I place bulk B2B project orders with GST invoices?",
        answer:
          "Yes, IntriHub provides full GST tax invoices for commercial ITC input tax credit with 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["furniture", "electrical", "lighting"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 18. OUTDOOR & LANDSCAPE (Draft - noindex pending founder approval)
  // =========================================================================
  "outdoor-landscape": {
    metaTitle: "Outdoor & Landscaping Materials Online | IntriHub",
    metaDescription:
      "Buy outdoor & landscaping materials online: heavy-duty pavers, artificial turf and composite decking. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Outdoor & Landscape Online",
    seoHeading: "Outdoor & Landscape Online",
    subCategoryH2s: [
      "Interlocking Driveway Pavers",
      "UV-Resistant Artificial Turf",
      "WPC Composite Decking",
      "Balcony Grass Tiles",
      "Garden Edging & Planters",
    ],
    introContent:
      "Designing durable outdoor terraces, garden patios, and building driveways calls for weather-proof materials that endure tropical sun and monsoon downpours. IntriHub supplies interlocking heavy-duty concrete pavers, high-density UV artificial turf, and wood-polymer composite (WPC) decking. When selecting exterior landscaping materials, evaluate three points: slip-resistant wet traction, water drainage permeability, and UV colorfastness. In Bengaluru, orders arrive in 60 minutes; across Pan-India in 3-7 days.",
    faqs: [
      {
        question: "What artificial grass pile height is ideal for residential balconies?",
        answer:
          "A 30mm to 35mm pile height with dual-tone thatch offers the most realistic lawn appearance and comfortable underfoot feel.",
      },
      {
        question: "Is composite decking resistant to termites and rot?",
        answer:
          "Yes, WPC decking boards are composed of recycled polymers and wood fibers that never rot, splinter, or suffer termite damage.",
      },
      {
        question: "What is the delivery timeline for pavers and landscaping materials?",
        answer:
          "In Bengaluru, orders are dispatched for 60-minute delivery; nationwide Pan-India transit takes 3-7 days.",
      },
    ],
    crossLinks: ["tiles-stone", "tools-consumables", "decor-accessories"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 19. SMART HOME (Draft - noindex pending founder approval)
  // =========================================================================
  "smart-home": {
    metaTitle: "Smart Home Automation Devices Online | IntriHub",
    metaDescription:
      "Buy smart home devices online: WiFi touch switches, smart curtain motors and ambient lighting hubs. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Smart Home Devices Online",
    seoHeading: "Smart Home Devices Online",
    subCategoryH2s: [
      "WiFi Touch Switch Plates",
      "Smart Motorized Curtain Tracks",
      "Smart RGBW Scene Controllers",
      "Universal IR Blasters",
      "Smart Gateway Hubs",
    ],
    introContent:
      "Integrating wireless home automation allows homeowners to manage lighting scenes, climate control, and security access directly from smartphones or voice assistants. IntriHub carries capacitive glass touch switches, retro-fit concealed relay modules, and motorized window actuators. When designing a smart home system, consider three factors: neutral wire availability in existing switchboards, protocol compatibility (Zigbee vs WiFi 2.4GHz), and offline local schedule execution. Get 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "Do smart switches require a neutral wire in the switchboard?",
        answer:
          "While most high-stability smart switches require a neutral wire, we also stock capacitor-enabled no-neutral modules.",
      },
      {
        question: "Can smart home modules fit inside standard electrical back boxes?",
        answer:
          "Yes, our mini smart relays fit inside standard metal and PVC concealed back boxes behind regular switch plates.",
      },
      {
        question: "How fast can smart devices be delivered in Bengaluru?",
        answer:
          "Standard in-stock smart automation controllers are delivered in 60 minutes across Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["electrical", "lighting", "safety-fire"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 20. SAFETY & FIRE (Draft - noindex pending founder approval)
  // =========================================================================
  "safety-fire": {
    metaTitle: "Safety & Fire Protection Equipment Online | IntriHub",
    metaDescription:
      "Buy safety & fire equipment online: digital biometric door locks, smoke sensors and CCTV cameras. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Safety & Fire Protection Online",
    seoHeading: "Safety & Fire Protection Online",
    subCategoryH2s: [
      "Biometric Digital Door Locks",
      "ABC Dry Powder Fire Extinguishers",
      "Optical Smoke Detectors",
      "HD WiFi Security Cameras",
      "Emergency Exit Lights",
    ],
    introContent:
      "Securing property and life requires certified fire suppression systems, early warning smoke detection, and keyless biometric entry management. IntriHub supplies ISI-approved portable fire extinguishers, photoelectric smoke detectors, and smart digital door locks with fingerprint authentication. When purchasing safety hardware, verify three points: fire equipment certification (IS 15683 standards), door stile thickness compatibility for smart mortise locks, and battery backup longevity. Expect 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
    faqs: [
      {
        question: "What type of fire extinguisher is best for residential apartments?",
        answer:
          "An ABC dry powder or clean-agent extinguisher is ideal as it safely handles electrical fires, combustible wood/paper, and flammable liquids.",
      },
      {
        question: "What happens if a digital door lock battery runs out?",
        answer:
          "Smart locks feature external USB-C emergency power ports and manual override mechanical backup keys.",
      },
      {
        question: "What is the delivery timeline for safety hardware in Bengaluru?",
        answer:
          "In-stock fire extinguishers, alarms, and smart locks arrive with 60-minute delivery in Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["hardware-fittings", "doors-windows", "smart-home"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 21. TOOLS & CONSUMABLES (Draft - noindex pending founder approval)
  // =========================================================================
  "tools-consumables": {
    metaTitle: "Tools & Consumables Online in Bengaluru | IntriHub",
    metaDescription:
      "Buy construction tools & site consumables online: power drills, diamond blades and safety gear. 60-minute delivery in Bengaluru, 3-7 days Pan-India.",
    h1: "Tools & Consumables Online",
    seoHeading: "Tools & Consumables Online",
    subCategoryH2s: [
      "Cordless Power Drills",
      "Diamond Tile Cutting Blades",
      "Laser Level Measures",
      "Heavy-Duty Hand Tools",
      "Personal Protective Equipment (PPE)",
    ],
    introContent:
      "Professional contractors and site trades rely on precision power tools, industrial-grade diamond abrasives, and verified PPE to complete project handovers on schedule. IntriHub stocks heavy-duty rotary hammer drills, green-beam multi-line laser levels, and diamond cutting blades. When equipping site workers, assess three factors: cordless lithium-ion platform versatility, abrasive RPM safety ratings, and ergonomic vibration dampening. Orders in Bengaluru arrive in 60 minutes; nationwide delivery takes 3-7 days.",
    faqs: [
      {
        question: "Are power tools covered by official manufacturer warranties?",
        answer:
          "Yes, all power tools carry valid national manufacturer warranties with direct service center support.",
      },
      {
        question: "Which cutting blade is best for vitrified tiles?",
        answer:
          "Continuous-rim ultra-thin diamond blades prevent chipping on dense full-body and glazed porcelain tiles.",
      },
      {
        question: "Can tools be delivered to my construction site in Bengaluru?",
        answer:
          "Yes, we provide 60-minute delivery in Bengaluru; 3-7 days Pan-India directly to active job sites.",
      },
    ],
    crossLinks: ["hardware-fittings", "adhesives-sealants-waterproofing", "electrical"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },

  // =========================================================================
  // 22. ADHESIVES, SEALANTS & WATERPROOFING (Draft - noindex pending approval)
  // =========================================================================
  "adhesives-sealants-waterproofing": {
    metaTitle: "Adhesives, Sealants & Waterproofing Online | IntriHub",
    metaDescription:
      "Buy adhesives, sealants & waterproofing chemicals online: polymer tile adhesive, epoxy grout and silicone. 60-minute delivery in Bengaluru, 3-7 days.",
    h1: "Adhesives, Sealants & Waterproofing Online",
    seoHeading: "Adhesives, Sealants & Waterproofing Online",
    subCategoryH2s: [
      "Polymer Tile Adhesives",
      "Epoxy Tile Grouts",
      "Silicone & Acrylic Sealants",
      "Terrace Waterproofing Membranes",
      "Structural PU Foams",
    ],
    introContent:
      "Preventing hollow tiles, joint discolouration, and moisture ingress requires using specification-grade polymer-modified adhesives and flexible waterproofing membranes. IntriHub supplies IS 15477 Type 1, 2, and 4 high-grab tile adhesives, two-part epoxy grouts, and terrace liquid polyurethane coatings. When selecting bonding chemicals, check three parameters: tile substrate type (concrete vs existing tiles), chemical pot life, and elongation flexibility for exterior thermal expansion. Dispatched in Bengaluru in 60 minutes; nationwide delivery in 3-7 days.",
    faqs: [
      {
        question: "Which adhesive grade is required for 600x1200mm tiles?",
        answer:
          "Type 2 polymer-modified adhesive or Type 4 high-flexibility adhesive is recommended for large-format slabs.",
      },
      {
        question: "Why is epoxy grout preferred over cementitious grout?",
        answer:
          "Epoxy grout is 100% stain-proof, waterproof, and chemically resistant, preventing mold in showers and kitchens.",
      },
      {
        question: "How quickly are waterproofing chemicals delivered in Bengaluru?",
        answer:
          "In-stock adhesive bags, grouts, and sealants arrive in 60 minutes across Bengaluru; 3-7 days Pan-India.",
      },
    ],
    crossLinks: ["tiles-stone", "plumbing-sanitary", "paint-finishes"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  },
};

/** Get SEO data for a category slug. Returns a compliant fallback if no specific data exists. */
export function getCategorySeo(slug: string): CategorySeoData {
  if (CATEGORY_SEO[slug]) {
    return CATEGORY_SEO[slug];
  }

  // Aliases mapping
  if (slug === "tiles") return CATEGORY_SEO["tiles-stone"];
  if (slug === "plumbing") return CATEGORY_SEO["plumbing-sanitary"];
  if (slug === "hardware") return CATEGORY_SEO["hardware-fittings"];
  if (slug === "floor-tiles" || slug === "granite" || slug === "outdoor-tiles") return CATEGORY_SEO["tiles-stone"];

  const cleanName = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const trimmedTitle = `${cleanName} Online in Bengaluru | IntriHub`.slice(0, 60);

  return {
    metaTitle: trimmedTitle,
    metaDescription: `Buy ${cleanName} online: compare technical specifications and prices. 60-minute delivery in Bengaluru, 3-7 days Pan-India. Order from IntriHub.`,
    h1: `${cleanName} Online`,
    seoHeading: `${cleanName} Online`,
    introContent: `Explore ${cleanName} on IntriHub, India's curated digital marketplace for interior and construction materials. Browse options, compare technical specifications, and order directly for site delivery. In Bengaluru you get 60-minute delivery, and across India delivery takes 3-7 days.`,
    faqs: [
      {
        question: `How do I select the right ${cleanName} products?`,
        answer: `Check dimensions, material specifications, and load ratings on each listing or consult our project specialists.`,
      },
      {
        question: `Can I order for sites outside Bengaluru?`,
        answer: `Yes, Pan-India delivery takes 3-7 days.`,
      },
      {
        question: `What is the delivery timeline in Bengaluru?`,
        answer: `Most in-stock materials are delivered within 60 minutes across Bengaluru.`,
      },
    ],
    crossLinks: ["electrical", "tiles-stone", "plumbing-sanitary"],
    isIndexable: false,
    deliveryText: "60-minute delivery in Bengaluru; 3-7 days Pan-India.",
  };
}
