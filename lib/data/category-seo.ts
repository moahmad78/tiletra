/**
 * Intrihub Category SEO Content
 * Unique per-category SEO metadata, prose blocks, FAQs, and cross-links.
 * Content is placed BELOW the product grid — never above the fold.
 */

export type CategorySeoData = {
  /** PRD-spec meta title */
  metaTitle: string;
  /** 150-160 char meta description */
  metaDescription: string;
  /** H2 heading for the SEO block */
  seoHeading: string;
  /** 300-400 word unique prose (never templated fill-in-the-blank) */
  seoContent: string;
  /** 2 category-specific FAQs (beyond the 2 generic FAQs already in the template) */
  faqs: Array<{ question: string; answer: string }>;
  /** Category slugs to cross-link to */
  crossLinks: string[];
};

export const CATEGORY_SEO: Record<string, CategorySeoData> = {
  "tiles-stone": {
    metaTitle: "Vitrified Tiles & Flooring Materials Online | Best Prices | IntriHub",
    metaDescription:
      "Explore vitrified tiles online India at the floor tiles best price online. Buy anti-skid bathroom tiles, kitchen wall tiles & digital vitrified tiles 600x600.",
    seoHeading: "Vitrified Tiles & Flooring Materials Online — Factory Direct",
    seoContent: `Choosing the right tile is one of the most impactful decisions in any interior or construction project. At IntriHub, explore vitrified tiles online India at the floor tiles best price online. Our expansive surface catalog connects you directly to premier ISO-certified manufacturing plants, eliminating unnecessary middlemen markups.

Discover our curated premium collection including anti skid bathroom tiles, competitive kitchen wall tiles price, and precision-cut digital vitrified tiles 600x600. For areas demanding resilient durability, we stock polished porcelain tiles online, partner with certified ceramic wall tiles suppliers, and deliver heavy duty parking tiles engineered for vehicular loads.

Elevate your interiors with glossy finish living room tiles, weather-resistant outdoor elevation tiles online, and warm rustic wooden look tiles price. For commercial developments and large projects, IntriHub provides grand slab tiles for commercial interior, affordable flooring materials online, marble look tiles wholesale, and exclusive mosaic and designer tiles India with 60-minute site delivery in Bengaluru.`,
    faqs: [
      {
        question: "What tile sizes and finishes are available for delivery in Bangalore?",
        answer:
          "IntriHub stocks digital vitrified tiles 600x600, 600x1200mm, 800x1600mm, polished porcelain tiles online, anti-skid bathroom tiles, and heavy duty parking tiles with same-day dispatch across Bengaluru.",
      },
      {
        question: "How do I calculate how many tile boxes I need?",
        answer:
          "Use IntriHub's built-in smart calculator on each tile product page. Enter your room square footage, and the calculator computes the exact box count with a 10% cutting wastage buffer.",
      },
    ],
    crossLinks: ["electrical", "plumbing-sanitary", "adhesives-sealants-waterproofing"],
  },

  electrical: {
    metaTitle: "Commercial & Residential Electrical Supplies Online | IntriHub",
    metaDescription:
      "Shop certified electrical wiring materials online, best modular switches and plates price & genuine copper electrical wires online at IntriHub.",
    seoHeading: "Commercial & Residential Electrical Supplies Online — ISI-Certified",
    seoContent: `Electrical infrastructure forms the vital backbone of every residential and commercial development. At IntriHub, shop certified electrical wiring materials online, best modular switches and plates price, and genuine copper electrical wires online from top ISI-certified brands including Havells, Polycab, Finolex, and Schneider Electric.

Our electrical catalog spans commercial lighting fixtures wholesale, circuit breakers MCB distribution box units, electrical conduits and fittings, and heavy-duty industrial electrical supplies India. Equip your buildings with energy-efficient LED panel lights online store, heavy duty electrical cables, smart switches for home interior automation, and electrical safety devices online.

Contractors and electricians can source multi-strand copper wire price, waterproof outdoor lights online, modular switchboards wholesale, and flexible pipe electrical accessories with instant site dispatch and B2B GST invoicing across Karnataka.`,
    faqs: [
      {
        question: "What wire gauges and cables are available on IntriHub?",
        answer:
          "We stock genuine copper electrical wires online in 1.5 sq.mm, 2.5 sq.mm, 4 sq.mm, 6 sq.mm, and 10 sq.mm sizes, along with armored heavy duty electrical cables and flexible pipe electrical accessories.",
      },
      {
        question: "Do you supply modular switches and distribution boards in bulk?",
        answer:
          "Yes. IntriHub offers modular switchboards wholesale, circuit breakers MCB distribution box panels, and smart switches for home interior projects at trade wholesale pricing.",
      },
    ],
    crossLinks: ["lighting", "smart-home", "safety-fire"],
  },

  lighting: {
    metaTitle: "Lighting Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy LED lights, chandeliers, downlights & strip lights online in Bangalore. Factory-direct prices, fast delivery. Premium brands on Intrihub.",
    seoHeading: "Buy Lighting Online in Bangalore — LED, Decorative & Architectural Solutions",
    seoContent: `Lighting is the element that elevates a finished interior from functional to extraordinary — the same room feels entirely different under warm ambient downlights versus cold overhead panels. Intrihub's Lighting catalog bridges the gap between electrical supply stores and premium design showrooms: you get specification-grade luminaires at trade prices, delivered to your site.

Our LED category includes recessed COB downlights (3W to 25W), surface-mount panel lights, linear LED strips in single-color and CCT-tunable variants, track lighting systems for retail and gallery applications, and waterproof IP65 rated fittings for bathrooms, kitchens, and outdoor use. All LED products list actual lumen output, color rendering index (CRI), beam angle, and energy consumption so you can design to specification rather than guessing.

Decorative lighting — pendant lights, designer chandeliers, wall sconces, and table lamps — is selected for both aesthetic impact and practical wiring compatibility. Each decorative fitting specifies the canopy size, wire length, and bulb type required, reducing the back-and-forth with your electrician.`,
    faqs: [
      {
        question: "What LED downlight sizes are available for false ceilings?",
        answer:
          "Intrihub stocks recessed LED downlights in 2-inch (50mm), 3-inch (75mm), 4-inch (100mm), and 6-inch (150mm) cutout diameters, covering 3W to 25W wattage ranges.",
      },
      {
        question: "Do you supply LED strip lights for cove lighting?",
        answer:
          "Yes. Intrihub carries single-color, dual-white, and RGB LED strip lights in 12V and 24V variants with IP20 (indoor dry) and IP65 (moisture-resistant) ratings.",
      },
    ],
    crossLinks: ["electrical", "smart-home", "false-ceiling"],
  },

  "plumbing-sanitary": {
    metaTitle: "Heavy-Duty Plumbing Systems & Sanitaryware Online | IntriHub",
    metaDescription:
      "Get plumbing materials wholesale price, reliable PVC pipes and fittings online, CPVC pipes for hot water supply & UPVC plumbing systems price.",
    seoHeading: "Heavy-Duty Plumbing Systems & Sanitaryware Online — Direct Rates",
    seoContent: `A leak-free, long-lasting water management system requires specification-grade pipes and precision-engineered fixtures. At IntriHub, get plumbing materials wholesale price, reliable PVC pipes and fittings online, CPVC pipes for hot water supply, and competitive UPVC plumbing systems price from Astral, Supreme, and Finolex.

For luxury and residential bathrooms, we connect you with certified bathroom sanitaryware suppliers, wall mixer and faucet online, one piece commode and washbasin configurations, and concealed cistern flush tank units from Kohler, Jaquar, Hindware, and Cera.

Equip kitchens and utility areas with kitchen sink stainless steel online, drainage and sewage pipes price, water storage tanks online India, and bath fittings and accessories store. We also supply critical infrastructure hardware like pressure relief valves plumbing, premium shower heads online, and heavy duty brass fittings for high-pressure installations.`,
    faqs: [
      {
        question: "What pipe grades are available for plumbing installations?",
        answer:
          "IntriHub provides CPVC pipes for hot water supply, UPVC plumbing systems price, and durable PVC pipes and fittings online with complete elbow, tee, union, and valve fittings.",
      },
      {
        question: "Do you supply sanitaryware and concealed cisterns across Bangalore?",
        answer:
          "Yes, we deliver one piece commode and washbasin units, wall-hung toilets, and concealed cistern flush tank assemblies with 60-minute site dispatch in Bengaluru.",
      },
    ],
    crossLinks: ["tiles-stone", "hardware-fittings", "adhesives-sealants-waterproofing"],
  },

  plywood: {
    metaTitle: "Plywood, Architectural Hardware & Interior Finishes | IntriHub",
    metaDescription:
      "Check waterproof plywood 710 grade price, commercial plywood online store, blockboard and flush doors India & decorative laminate sheets price.",
    seoHeading: "Plywood, Architectural Hardware & Interior Finishes — Mill Direct",
    seoContent: `Engineered wood panels and architectural hardware form the structural core of bespoke cabinetry, wardrobes, and modern interiors. At IntriHub, check waterproof plywood 710 grade price, commercial plywood online store, blockboard and flush doors India, decorative laminate sheets price, MDF and particle board online, and termite proof plywood sheets.

Pair your wood panels with premium architectural hardware fittings, door locks and handles online, heavy duty drawer channels, hydraulic hinges for kitchen cabinets, tower bolts and door stoppers, glass fittings and patch locks, and modular kitchen hardware online from Hettich, Godrej, and Dorset.

Ensure lasting durability with multi-purpose construction adhesives, structural silicone sealant online, PU foam and waterproofing chemicals, drywall screws and fasteners, and edge banding tape for plywood. Complete modern aesthetics with safety locks for main doors, furniture fittings wholesale India, charcoal panels for interior wall, acoustic panels online price, synthetic wood louvers online, and primer and wall putty supplies.`,
    faqs: [
      {
        question: "What plywood grades and thicknesses are available?",
        answer:
          "We supply waterproof plywood 710 grade price, commercial plywood online store, and termite proof plywood sheets in 6mm, 9mm, 12mm, 16mm, 18mm, and 25mm thicknesses.",
      },
      {
        question: "Do you supply architectural hardware and laminates for full project fit-outs?",
        answer:
          "Yes. IntriHub delivers decorative laminate sheets price, hydraulic hinges for kitchen cabinets, heavy duty drawer channels, and multi-purpose construction adhesives in bulk across Bengaluru.",
      },
    ],
    crossLinks: ["hardware-fittings", "furniture", "kitchen-wardrobe"],
  },

  "hardware-fittings": {
    metaTitle: "Architectural Hardware Fittings & Door Locks Online | IntriHub",
    metaDescription:
      "Buy architectural hardware fittings, door locks and handles online, heavy duty drawer channels & hydraulic hinges for kitchen cabinets at trade prices.",
    seoHeading: "Architectural Hardware Fittings & Fasteners — Trade Prices",
    seoContent: `Hardware and architectural fittings are the essential moving parts that define the daily comfort, safety, and longevity of your interiors. At IntriHub, browse premium architectural hardware fittings, door locks and handles online, heavy duty drawer channels, hydraulic hinges for kitchen cabinets, tower bolts and door stoppers, glass fittings and patch locks, and modular kitchen hardware online.

We stock industrial-grade multi-purpose construction adhesives, structural silicone sealant online, PU foam and waterproofing chemicals, drywall screws and fasteners, edge banding tape for plywood, safety locks for main doors, and furniture fittings wholesale India with fast site dispatch across Bengaluru.`,
    faqs: [
      {
        question: "What hardware brands are available on IntriHub?",
        answer:
          "IntriHub carries genuine architectural hardware from Hettich, Godrej, Yale, Dorset, and Ebco with full manufacturer warranty and instant site delivery.",
      },
      {
        question: "Can I get soft-close hydraulic hinges and drawer channels?",
        answer:
          "Yes, we provide hydraulic hinges for kitchen cabinets, heavy duty drawer channels, and soft-close sliders in all standard depth profiles.",
      },
    ],
    crossLinks: ["plywood", "doors-windows", "furniture"],
  },

  furniture: {
    metaTitle: "Furniture Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy living room, bedroom & dining furniture online in Bangalore. Factory-direct prices, fast delivery. Premium furniture catalog on Intrihub.",
    seoHeading: "Buy Furniture Online in Bangalore — Living, Bedroom & Dining at Factory-Direct Prices",
    seoContent: `Furniture procurement for a home, office, or commercial space involves navigating an overwhelming market of quality tiers, finish options, and size configurations. Intrihub simplifies this by curating furniture across living, dining, bedroom, study, and outdoor categories — with verified dimensions, material specifications, and assembly requirements clearly displayed on every listing.

Living room furniture at Intrihub spans solid wood sofas with fabric and leatherette upholstery, coffee tables in glass-top and solid wood finishes, TV units in engineered wood with open shelving and concealed storage, and accent chairs in premium weave and velvet. Every sofa listing specifies foam density (minimum 32 density for long-term comfort), spring type, and frame material.

Bedroom furniture is organized by bed size — single (36×75 inches), double (54×75 inches), and king (72×78 inches) — with matching wardrobe and dresser dimensions shown for space planning. Bed frames are available in solid sheesham wood, engineered wood with veneer, and upholstered panel configurations, with storage variant options (hydraulic lift, side drawers).

Dining sets from 4-seater to 10-seater are listed with table dimensions and chair specifications, covering both compact apartment dining (120cm tables) and large family dining (240cm extending tables). Material options span glass-top with metal base, solid wood, and marble-finish tops.

For office and commercial spaces, Intrihub stocks workstation desks, height-adjustable sit-stand desks, ergonomic task chairs (with lumbar support specifications), and modular storage pedestals — covering both home office setups and enterprise fit-outs.`,
    faqs: [
      {
        question: "What sofa materials are available at Intrihub Bangalore?",
        answer:
          "Intrihub carries sofas in fabric upholstery (polyester, cotton blend), leatherette (PVC), genuine leather, and velvet finishes. All sofas list foam density (32D or higher for quality), frame material (solid wood or metal), and spring type so you can evaluate durability before purchasing.",
      },
      {
        question: "Do you offer delivery and assembly for large furniture in Bangalore?",
        answer:
          "Yes. Large furniture items at Intrihub include in-home delivery to ground floor or lift-accessible floors across Bangalore. Assembly service for beds, wardrobes, and dining sets is available as an add-on at checkout. Our logistics team coordinates delivery timing to avoid damage to freshly finished floors and walls.",
      },
    ],
    crossLinks: ["hardware-fittings", "decor-accessories", "kitchen-wardrobe"],
  },

  "false-ceiling": {
    metaTitle: "False Ceiling Materials Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy gypsum boards, GI channels, POP & ceiling tiles online in Bangalore. Factory-direct prices, fast delivery. Intrihub.",
    seoHeading: "Buy False Ceiling Materials Online in Bangalore — Gypsum, POP & Grid Systems",
    seoContent: `False ceilings are one of the most transformative elements of interior design — they conceal structural slabs, integrate lighting, improve acoustics, and define the architectural character of every room. Intrihub's False Ceiling category supplies the complete material set for gypsum board, POP (Plaster of Paris), grid ceiling, and decorative ceiling tile installations.

Gypsum boards from Saint-Gobain, Armstrong, and USG are available in standard (12.5mm), moisture-resistant (MR), and fire-rated (FR) variants. We stock both regular tapered-edge boards for seamless jointing and square-edge boards for grid ceiling applications. Each board is listed with density, edge profile, and fire rating certification.

GI channel sections — main runners, cross tees, wall angles, and carrying channels — are specified by gauge (0.5mm to 0.8mm) and load rating. We carry both exposed and concealed grid systems, with suspension wire, hanger rods, and spring toggle bolts for anchor points in concrete slabs.

POP products include bagged machine plaster, manual finishing plaster, and ready-mix compounds for jointing and surface finishing. For decorative applications, Intrihub stocks polyurethane (PU) cornices, ceiling roses, and medallions — lightweight alternatives to traditional POP molding that install without structural loading concerns.

Acoustic ceiling tiles and mineral fiber panels for commercial applications — offices, conference rooms, and auditoriums — are available in standard 600×600mm grid sizes, with NRC (Noise Reduction Coefficient) ratings listed per product.`,
    faqs: [
      {
        question: "What gypsum board thickness is standard for residential false ceilings in Bangalore?",
        answer:
          "12.5mm gypsum board is the standard thickness for residential false ceiling applications, providing the right balance of weight and rigidity. For bathrooms and kitchens, moisture-resistant (MR) gypsum board of the same thickness is used. For areas requiring fire separation, 15mm or 15mm + 12.5mm double-layer configurations are specified.",
      },
      {
        question: "Do you supply complete false ceiling kits including GI channels and fixings?",
        answer:
          "Yes. Intrihub offers complete false ceiling material packages — gypsum boards, GI main channels, cross tees, wall angles, hanger rods, and suspension wires — priced per square foot of ceiling area. Contact our project desk for a material takeoff for your specific room dimensions.",
      },
    ],
    crossLinks: ["lighting", "paint-finishes", "electrical"],
  },

  "paint-finishes": {
    metaTitle: "Paints & Finishes Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy interior emulsions, exterior paints & wood polishes online in Bangalore. Factory-direct prices, fast delivery. Intrihub.",
    seoHeading: "Buy Paints & Finishes Online in Bangalore — Interior, Exterior & Wood Finishes",
    seoContent: `Paint selection is the final act of any interior or exterior construction project — yet it's where the most costly mistakes happen when coverage rates are misjudged or the wrong finish is specified for an application. Intrihub's Paint & Finishes category organizes products by surface type, finish category, and coverage specification to remove guesswork from your purchase.

Interior emulsions from Asian Paints, Berger, Nerolac, and Dulux are listed with spread rate per litre, minimum coats required for full opacity, sheen level (matte, eggshell, satin, semi-gloss), and scrubbability cycle rating — so you know exactly how many litres to buy for a room and how the finish will perform over time.

Exterior weatherproof paints specify elastomeric crack-bridging capacity, water-shedding angle, and UV-fade resistance life in years — the metrics that matter for Bangalore's high-rainfall climate. Masonry primers, alkali-resistant sealers, and waterproofing compounds to prep surfaces before painting are also available.

Wood finishes — including PU (polyurethane) lacquers, NC (nitrocellulose) sealers, and water-based acrylics for furniture and joinery — are specified by gloss level, pot life, thinning ratio, and drying time. Both spray-grade thinned variants and brush/roller grade variants are stocked.

Texture coatings, sand finishes, and designer wall plasters for feature wall applications round out the catalog, with application tools including roller covers, paint brushes, spray gun nozzle sets, and mixing paddles available as accessories.`,
    faqs: [
      {
        question: "How many litres of paint do I need for a 12×12 foot room in Bangalore?",
        answer:
          "A standard 12×12 foot room with 10-foot ceiling height has approximately 480 square feet of wall area. With a typical interior emulsion spread rate of 120-140 sq.ft per litre (2 coats), you'd need approximately 7-8 litres. Intrihub's smart calculator on paint product pages computes this automatically when you enter room dimensions.",
      },
      {
        question: "What exterior paint brands do you supply for Bangalore's climate?",
        answer:
          "Intrihub stocks exterior weatherproof paints from Asian Paints (Apex Ultima), Berger (WeatherCoat), Nerolac (Excel), and Dulux (Weathershield) — all formulated for tropical high-humidity and rainfall conditions. Each exterior paint listing specifies the life expectancy in Bangalore's climate zone and recommended primer.",
      },
    ],
    crossLinks: ["false-ceiling", "wall-surface", "tools-consumables"],
  },

  "doors-windows": {
    metaTitle: "Doors & Windows Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy flush doors, UPVC windows & aluminium frames online in Bangalore. Factory-direct prices, site delivery. Intrihub.",
    seoHeading: "Buy Doors & Windows Online in Bangalore — Flush Doors, UPVC & Aluminium Profiles",
    seoContent: `Doors and windows define the relationship between interior spaces and determine how natural light, ventilation, and acoustics work across a building. Intrihub's Doors & Windows category covers the material supply chain from structural door frames to finished window systems.

Solid core flush doors from Greenply, Duro, and Kitply are stocked in standard heights (2100mm, 2400mm) and widths (750mm, 825mm, 900mm), with fire-rated variants available for stairwells and commercial egress paths. Skin options include plain MDF for paint finish, teak veneer for natural wood appearance, and laminate pre-finished doors for installation without additional finishing work.

UPVC window sections and sliding door systems from Rehau, Fenesta, LG Hausys, and Veka are specified by profile chamber count, wall thickness, glass bead type, and thermal coefficient. Our UPVC catalog covers casement, sliding, fixed-lite, tilt-and-turn, and louvered variants — with hardware packages (handles, espagnolette locks, hinge stays) available as matching kits.

Aluminium extruded profiles for sliding doors, partition systems, storefront, and curtain wall applications are stocked in standard anodized silver, powder-coated black, and bronze finishes, with glass compatibility specifications per profile series.

Door frames — solid wood, engineered wood, and hollow metal — are listed by wall thickness compatibility and finish options, with matching door stops, architraves, and weather seals available for complete installation supply.`,
    faqs: [
      {
        question: "What is the standard door size for residential bedrooms in Bangalore?",
        answer:
          "Standard residential bedroom doors in Bangalore are typically 2100mm (7 feet) tall × 825mm or 900mm wide (2.75 or 3 feet). Bathroom doors are usually 750mm (2.5 feet) wide. Intrihub stocks flush doors in all standard sizes, and custom sizes can be quoted for non-standard openings.",
      },
      {
        question: "Do you supply UPVC windows with glass for Bangalore apartments?",
        answer:
          "Intrihub supplies UPVC window frames and sections from Rehau and LG Hausys. Glass (toughened, double-glazed, or laminated) is available separately or as a package. Contact our project desk for a window schedule quote if you're sourcing for a full floor or building.",
      },
    ],
    crossLinks: ["hardware-fittings", "glass-mirror", "safety-fire"],
  },
};

/** Get SEO data for a category slug. Returns a generic fallback if no specific data exists. */
export function getCategorySeo(slug: string): CategorySeoData {
  if (CATEGORY_SEO[slug]) {
    return CATEGORY_SEO[slug];
  }

  // Generic fallback for categories without specific copy
  const cleanName = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    metaTitle: `${cleanName} Online in Bangalore | Factory-Direct Prices | Intrihub`,
    metaDescription: `Buy ${cleanName} online in Bangalore at factory-direct prices. Fast site delivery across Bengaluru. Explore Intrihub's curated catalog of interior & construction materials.`,
    seoHeading: `Buy ${cleanName} Online in Bangalore — Factory-Direct Prices`,
    seoContent: `Intrihub brings you a curated selection of ${cleanName} products sourced directly from certified manufacturers and authorized distributors across India. Our ${cleanName} catalog is designed for homeowners, architects, interior designers, and contractors who need reliable quality at trade-competitive prices without navigating multiple local dealers.

Every ${cleanName} product on Intrihub is verified for quality compliance and listed with full technical specifications — so you can compare options meaningfully and order with confidence. Our team reviews each listing for accurate dimension data, load ratings, and compatibility information before it goes live.

For residential projects, Intrihub offers per-unit and small-quantity ordering with doorstep delivery across Bangalore. For commercial projects and bulk requirements, our contractor desk provides project-level pricing, phased delivery scheduling, and consolidated B2B GST invoicing.

We deliver ${cleanName} via our specialized site-delivery logistics network — coordinating lift access, floor-level delivery, and careful handling to protect your materials and your finished flooring. Same-day dispatch is available for in-stock items ordered before 2 PM across most Bangalore pin codes.`,
    faqs: [
      {
        question: `What brands are available in the ${cleanName} category on Intrihub?`,
        answer: `Intrihub's ${cleanName} catalog features verified brands and certified manufacturers. Each product listing includes brand information, certification marks, and technical specifications. Browse the category to explore available brands, or contact our team to source a specific brand not currently listed.`,
      },
      {
        question: `Can I get bulk pricing for ${cleanName} for a large project in Bangalore?`,
        answer: `Yes. Intrihub offers volume pricing and project-level quotes for bulk ${cleanName} orders. Contact our contractor desk via WhatsApp at +91 70901 20211 or fill the quote request form for dedicated project support, GST B2B invoicing, and phased delivery scheduling.`,
      },
    ],
    crossLinks: [],
  };
}
