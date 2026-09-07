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
    metaTitle: "Tiles & Stone Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy vitrified tiles, granite slabs & stone cladding online in Bangalore. Factory-direct prices, 60-min delivery. Explore 500+ designs on Intrihub.",
    seoHeading: "Buy Tiles & Stone Online in Bangalore — Factory-Direct Prices",
    seoContent: `Choosing the right tile is one of the most impactful decisions in any interior or construction project — it defines the character of every floor, wall, and outdoor surface in the space. At Intrihub, we bring the factory floor directly to your project site: our Tiles & Stone catalog spans vitrified floor tiles, ceramic wall tiles, natural granite slabs, Italian marble, rough-cut stone cladding, and high-gloss porcelain — all sourced from ISO-certified manufacturing hubs in Rajasthan, Morbi, and Karnataka.

Every tile listing on Intrihub includes verified technical specs: slip resistance class, water absorption percentage, PEI wear rating, and coverage per box. Our built-in smart calculator on each product page takes your room's square footage and instantly computes the exact number of boxes you need — including a standard 10% cutting wastage buffer — so you never over-order or run short mid-project.

For contractors and builders handling multiple floors or large commercial spaces, Intrihub offers tiered contractor pricing on pallet quantities. For homeowners and interior designers choosing between 10–20 boxes for a bedroom or bathroom makeover, our per-box pricing already beats most local dealers by 15–30% because we've removed the distributor and retailer markup from the chain.

Delivery for tiles is handled by our specialized heavy-goods fleet — not a generic courier. Our logistics team coordinates lift access, floor-level delivery, and unboxing at your site, minimizing breakage risk that's common with standard parcel services. Orders placed before 2 PM for in-stock designs typically dispatch the same day to addresses across Bangalore.

Whether you're laying 600×600mm vitrified tiles for a modern living room, 300×600mm bathroom wall tiles, or sourcing natural granite for kitchen countertops and staircase treads, Intrihub's Tiles & Stone section covers every application. Filter by size, finish, shade, or usage, and browse with full confidence — every product carries a clear return policy and quality assurance guarantee.`,
    faqs: [
      {
        question: "What tile sizes are available for delivery in Bangalore?",
        answer:
          "Intrihub stocks tiles in standard sizes including 300×300mm, 300×600mm, 600×600mm, 600×1200mm, 800×1600mm, and custom slab formats. All sizes are available for same-day or next-day delivery across Bangalore depending on stock availability at the nearest dispatch hub.",
      },
      {
        question: "How do I calculate how many tile boxes I need?",
        answer:
          "Use Intrihub's built-in smart calculator on each tile product page. Enter your room area in square feet, and the calculator will compute the exact number of boxes required including a 10% wastage buffer for cuts. You can also speak to our project support team on WhatsApp for complex layouts.",
      },
    ],
    crossLinks: ["electrical", "plumbing-sanitary", "adhesives-sealants-waterproofing"],
  },

  electrical: {
    metaTitle: "Electrical Materials Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy wires, switches, MCBs & conduits online in Bangalore. ISI-certified electrical materials at factory-direct prices. Fast site delivery — Intrihub.",
    seoHeading: "Buy Electrical Materials Online in Bangalore — ISI-Certified, Direct Factory Rates",
    seoContent: `Electrical work is the invisible backbone of every building — done right, it lasts decades; done wrong, it creates hazards that no renovation can easily undo. Intrihub's Electrical category is curated specifically for the construction and renovation market: every product listed has passed ISI, BEE, or FRLS certification, and we display the certification details on each product page so you can verify before ordering.

Our catalog covers the full electrical supply chain from bare conductor to finished fitting. FRLS (Flame Retardant Low Smoke) wires from Havells, Polycab, Finolex, and RR Kabel are available in 1.5 sq.mm, 2.5 sq.mm, 4 sq.mm, 6 sq.mm, and 10 sq.mm sizes — the most common gauges for residential and light commercial wiring. For higher amperage circuits, we stock armored cables (AYFY/AYWY) and industrial-grade flexible cables for machinery and HVAC applications.

Modular switches and sockets from Legrand, GM, Simon, Anchor, and Wipro are organized by series — from economy residential to premium glass-finish architectural series — with complete compatibility charts so you can mix frames and modules confidently. MCBs, RCCBs, and Distribution Boards (DB boxes) from Schneider Electric, Havells, and Legrand complete the panel-room supply list.

Intrihub stocks PVC conduit pipes, flexible conduit, junction boxes, and cable trays for complete installation sets — so your electrician doesn't have to make multiple trips to the hardware store. All conduit and trunking products include dimensional specs and load ratings.

For large residential projects or commercial fit-outs requiring multi-phase cabling, our contractor desk provides project-level quotes with phased delivery scheduling aligned to your construction timeline. GST B2B invoices with valid HSN codes are issued for every order.`,
    faqs: [
      {
        question: "What wire sizes are available for home wiring in Bangalore?",
        answer:
          "Intrihub stocks FRLS copper wires in 1.5 sq.mm (for lighting), 2.5 sq.mm (for power points), 4 sq.mm and 6 sq.mm (for AC/heavy appliances), and 10 sq.mm (for main supply). All wires are ISI-certified from brands including Havells, Polycab, and Finolex.",
      },
      {
        question: "Do you supply MCBs and distribution boards for commercial projects?",
        answer:
          "Yes. Intrihub carries MCBs (6A–63A), RCCBs, ELCBs, and complete distribution board enclosures from Schneider Electric, Havells, and Legrand. For large commercial projects requiring bulk DB panels, contact our contractor desk for custom project quotes and phased delivery.",
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

Decorative lighting — pendant lights, designer chandeliers, wall sconces, and table lamps — is selected for both aesthetic impact and practical wiring compatibility. Each decorative fitting specifies the canopy size, wire length, and bulb type required, reducing the back-and-forth with your electrician.

For false ceiling or cove lighting applications, Intrihub carries LED strip profiles (aluminum channels with diffusers), smart dimmable LED strips, and DALI-compatible drivers for integration with building automation systems. Our profile channel range includes surface, recessed, and corner variants.

Intrihub also offers architectural exterior lighting — bollard lights, step lights, facade uplighters, and underwater pond lights — for landscape and outdoor design projects across Bangalore villas and commercial properties.`,
    faqs: [
      {
        question: "What LED downlight sizes are available for false ceilings?",
        answer:
          "Intrihub stocks recessed LED downlights in 2-inch (50mm), 3-inch (75mm), 4-inch (100mm), and 6-inch (150mm) cutout diameters, covering 3W to 25W wattage ranges. Both warm white (3000K) and cool white (6500K) CCT options are available.",
      },
      {
        question: "Do you supply LED strip lights for cove lighting?",
        answer:
          "Yes. Intrihub carries single-color, dual-white, and RGB LED strip lights in 12V and 24V variants with IP20 (indoor dry) and IP65 (moisture-resistant) ratings. We also stock aluminum channel profiles with diffusers for a premium finished look in cove and cabinet lighting applications.",
      },
    ],
    crossLinks: ["electrical", "smart-home", "false-ceiling"],
  },

  "plumbing-sanitary": {
    metaTitle: "Plumbing & Sanitaryware Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy CPVC pipes, faucets, washbasins & water closets online in Bangalore. Quality plumbing materials, site delivery. Shop Intrihub.",
    seoHeading: "Buy Plumbing & Sanitaryware Online in Bangalore — Direct Factory Prices",
    seoContent: `Plumbing is the circulatory system of every building, and the quality of materials used determines whether you're dealing with zero maintenance or chronic leaks for the next 20 years. Intrihub's Plumbing & Sanitary category covers the entire water supply and drainage ecosystem: from CPVC/UPVC pipes at the input to designer faucets, washbasins, EWCs, and shower panels at the output.

CPVC pressure pipes from Astral, Supreme, and Finolex are stocked in 15mm to 50mm diameters with full fitting ranges — elbows, tees, couplings, reducers, ball valves, and stop cocks — so your plumber can complete a bathroom set from a single order. For drainage, we carry SWR PVC pipes and push-fit drainage fittings compliant with IS:13592 standards.

Our sanitaryware selection partners with Kohler, Jaquar, Parryware, Hindware, Cera, and Somany — covering the spectrum from economy builder-grade to premium designer bathrooms. Wall-hung EWCs with concealed cisterns, floor-mounted pedestal wash basins, under-counter vanity basins, and RIMLESS flushing technology models are all listed with installation dimension drawings so your tile setter and plumber can coordinate accurately.

Bathroom faucets and shower systems are organized by finish (chrome, brushed gold, matte black, gunmetal) and by collection — so you can match a basin mixer, overhead shower, hand shower, and wall spout from a coordinated range rather than mixing incompatible designs. Every faucet listing specifies spout reach, handle type, and cartridge brand for ease of servicing.

For site managers handling multiple bathroom units across a residential project, Intrihub's bulk order desk provides package pricing for complete bathroom sets — EWC + basin + mixer + shower set — with scheduled floor-by-floor delivery.`,
    faqs: [
      {
        question: "What CPVC pipe brands are available for hot and cold water lines?",
        answer:
          "Intrihub stocks CPVC pipes and fittings from Astral, Supreme, and Finolex in 15mm, 20mm, 25mm, 32mm, and 50mm diameters. CPVC is suitable for both hot and cold water supply lines and is the standard specification for residential plumbing across Bangalore.",
      },
      {
        question: "Do you sell wall-hung EWCs with concealed cisterns in Bangalore?",
        answer:
          "Yes. Intrihub carries wall-hung EWCs with concealed flush cisterns from Kohler, Jaquar, Hindware, and Cera. Each listing includes installation depth requirements and compatible flush plate options. Our team can also help with complete bathroom set pricing for multi-unit projects.",
      },
    ],
    crossLinks: ["tiles-stone", "hardware-fittings", "adhesives-sealants-waterproofing"],
  },

  plywood: {
    metaTitle: "Plywood & Laminates Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy BWP marine ply, commercial MR plywood, MDF & laminates online in Bangalore. Direct factory rates, bulk supply. Intrihub.",
    seoHeading: "Buy Plywood & Laminates Online in Bangalore — BWP, MR Grade, MDF",
    seoContent: `Plywood is the structural foundation of every wardrobe, kitchen cabinet, false ceiling frame, and wooden furniture piece — choosing the wrong grade compromises everything built on top of it. Intrihub's Plywood & Laminates category is engineered for the construction trade: clear grade labeling, verified ISI marks, and consistent thickness tolerance across every sheet.

BWP (Boiling Water Proof) marine-grade plywood is our highest-specification offering — suitable for kitchens, bathrooms, and any humid environment where MR plywood would delaminate over time. We carry 6mm, 9mm, 12mm, 18mm, and 25mm thicknesses in standard 8×4 feet sheets from Century, Greenply, Kitply, and Action TESA.

MR (Moisture Resistant) commercial plywood serves interior carpentry where direct moisture exposure isn't a concern — TV units, bedroom wardrobes, study tables, and wall paneling. At a lower price point than BWP, MR plywood covers the bulk of interior joinery requirements.

MDF (Medium Density Fibreboard) and HDHMR boards provide a smooth, stable substrate for paint, lacquer, and PU finishes on flat-panel doors and cabinets. Intrihub stocks standard and moisture-resistant MDF in 6mm to 25mm thickness, along with matching edge banding tapes and pre-laminated boards that save finishing time.

Decorative laminates from Merino, Century, Greenlam, and Virgo are organized by finish — solid colors, woodgrain textures, stone textures, and abstract patterns — with matching edgeband availability noted on each listing. For site managers, Intrihub offers full-project plywood + laminate package quotes with floor-by-floor delivery scheduling.`,
    faqs: [
      {
        question: "What is the difference between BWP and MR grade plywood?",
        answer:
          "BWP (Boiling Water Proof) plywood uses phenol formaldehyde adhesive and can withstand prolonged water exposure — making it ideal for kitchens, bathrooms, and wet areas. MR (Moisture Resistant) plywood uses urea formaldehyde adhesive and resists humidity but should not be used in direct water contact areas. For most interior carpentry, MR grade suffices; for kitchen and bathroom shutters, BWP is recommended.",
      },
      {
        question: "Do you supply plywood and laminates for full apartment fit-outs in Bangalore?",
        answer:
          "Yes. Intrihub offers project-level bulk pricing for full apartment fit-outs including BWP plywood, MR plywood, MDF, laminates, and edgebanding. Contact our contractor desk via WhatsApp for a project quote and delivery schedule aligned to your carpenter's timeline.",
      },
    ],
    crossLinks: ["hardware-fittings", "furniture", "kitchen-wardrobe"],
  },

  "hardware-fittings": {
    metaTitle: "Hardware & Fittings Online in Bangalore | Factory-Direct Prices | Intrihub",
    metaDescription:
      "Buy hinges, locks, screws, drawer slides & handles online in Bangalore. Direct hardware prices, fast delivery. Intrihub.",
    seoHeading: "Buy Hardware & Fittings Online in Bangalore — Trade Prices on Hinges, Locks & More",
    seoContent: `Hardware and architectural fittings are the functional detail that determines how a finished interior actually performs in daily use — a kitchen cabinet that doesn't close silently, a bathroom door that drags, or a wardrobe whose drawer slides fail within a year are all hardware failures, not joinery failures. Intrihub's Hardware & Fittings category carries the full range of architectural and furniture hardware required for professional interior fit-outs.

Concealed hydraulic hinges (30° and 170° opening) from Hettich, Blum, and Dorset are organized by door weight capacity — 10kg, 20kg, and 40kg — with damper specifications. Soft-close mechanisms are specified by damping speed and release angle so your carpenter can select the right component for door thickness and weight.

Drawer slides from Hettich, Sugatsune, and Ebco are listed with load capacity (20kg, 40kg, 60kg), extension type (partial, full, over-travel), and mounting width — critical for accurate wardrobe and kitchen module specification. Ball-bearing under-mount and side-mount variants are stocked in lengths from 250mm to 600mm.

Mortise locks, cylindrical locks, and digital smart locks from Godrej, Yale, Dorset, and Europa cover residential doors and commercial office applications. Lock body dimensions, strike plate type, and key cylinder specifications are listed for each model to eliminate compatibility issues on site.

Handles and knobs — from stainless steel 304 bar pulls to zinc alloy heritage knobs to aluminum profile handles — are organized by material, finish, and hole-center dimension. Full-range matching collections are grouped together so designers can specify a consistent handle aesthetic across kitchens, wardrobes, and drawers.

Stainless steel screws, bolts, rawl plugs, and construction fasteners round out the catalog — available in trade packs for site-level consumption.`,
    faqs: [
      {
        question: "What hinge brands are available for modular kitchen shutters?",
        answer:
          "Intrihub stocks hydraulic soft-close hinges from Hettich, Blum, and Dorset — the three most specified brands in Bangalore modular kitchens. Hinges are available in 35mm cup diameter for standard doors, with opening angles of 110°, 165°, and 170° to suit frameless and face-frame cabinet constructions.",
      },
      {
        question: "Do you sell full-extension drawer slides for modular wardrobes?",
        answer:
          "Yes. Intrihub carries full-extension ball-bearing drawer slides from Hettich, Sugatsune, and Ebco in 250mm to 600mm lengths, rated for 20kg to 60kg loads. Undermount and side-mount options are both available, with soft-close dampening variants for premium applications.",
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
