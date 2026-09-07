import { prisma } from "../lib/prisma";

export async function seedIntrihub() {
  console.log("🌱 Starting Intrihub Category and Multi-Category Product Seeding...");

  // 1. Seed Categories
  const categoriesData = [
    {
      id: "cat-1",
      name: "Tiles & Flooring",
      slug: "floor-tiles",
      description: "Premium vitrified, ceramic, and porcelain floor & wall tiles for every space.",
      image: "/placeholders/product.svg",
      order: 1,
      icon: "Grid",
    },
    {
      id: "cat-2",
      name: "Electrical",
      slug: "electrical",
      description: "Certified wires, modular switches, MCBs, conduit pipes & designer lighting.",
      image: "/placeholders/product.svg",
      order: 2,
      icon: "Zap",
    },
    {
      id: "cat-3",
      name: "Plumbing",
      slug: "plumbing",
      description: "CPVC/UPVC pipes, brass mixer taps, sanitaryware, washbasins & bath fittings.",
      image: "/placeholders/product.svg",
      order: 3,
      icon: "Droplets",
    },
    {
      id: "cat-4",
      name: "Hardware",
      slug: "hardware",
      description: "Stainless steel screws, architectural hinges, mortise locks & cabinet handles.",
      image: "/placeholders/product.svg",
      order: 4,
      icon: "Wrench",
    },
    {
      id: "cat-5",
      name: "Plywood",
      slug: "plywood",
      description: "BWP marine grade plywood, commercial ply, MDF boards & high gloss laminates.",
      image: "/placeholders/product.svg",
      order: 5,
      icon: "Layers",
    },
    {
      id: "cat-6",
      name: "Granite",
      slug: "granite",
      description: "Polished South Indian granite slabs, Italian marble, step treads & kitchen counters.",
      image: "/placeholders/product.svg",
      order: 6,
      icon: "Sparkles",
    },
    {
      id: "cat-7",
      name: "Aluminum & Doors",
      slug: "aluminum-doors",
      description: "Solid flush doors, anodized aluminum window sections & glass sliding profiles.",
      image: "/placeholders/product.svg",
      order: 7,
      icon: "DoorOpen",
    },
    {
      id: "cat-8",
      name: "Wallpaper",
      slug: "wallpaper",
      description: "Textured non-woven vinyl wallpapers, acoustic charcoal fluted wall panels.",
      image: "/placeholders/product.svg",
      order: 8,
      icon: "Palette",
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        icon: cat.icon,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        icon: cat.icon,
      },
    });
  }
  console.log("✅ Categories synced.");

  // 2. Sample Products for each new category
  const productsToSeed = [
    // ── ELECTRICAL ────────────────────────────────────
    {
      name: "Havells LifeLine Plus 2.5 sq mm FR House Wire (90m)",
      slug: "havells-lifeline-plus-2-5-wire-90m",
      categorySlug: "electrical",
      categoryName: "Electrical",
      unitOfSale: "coil",
      material: "Copper",
      finish: "Glossy PVC",
      size: "2.5 sq mm / 90m",
      pricePerSqft: 2450, // Price for 1 unit/coil
      description: "Flame Retardant (FR) grade 100% bare electrolytic copper conductor house wire. High insulation resistance and heat retardant properties designed for residential and commercial wiring.",
      images: [
        "/placeholders/product.svg",
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Gauge", value: "2.5 sq mm" },
        { key: "Coil Length", value: "90 Meters" },
        { key: "Conductor", value: "100% Electrolytic Bare Copper" },
        { key: "Voltage Rating", value: "1100V" },
        { key: "Insulation", value: "Flame Retardant (FR) PVC" },
        { key: "Certification", value: "IS:694 & ISI Marked" },
      ],
      variant: {
        size: "90m Coil (2.5 sq mm)",
        finish: "Red / Flame Retardant",
        color: "Red",
        pricePerBox: 2450,
        pricePerSqft: 2450,
        sqftPerBox: 1,
        stockBoxes: 150,
      },
    },
    {
      name: "Schneider Electric Opale 16A 1-Way Modular Switch",
      slug: "schneider-opale-16a-switch",
      categorySlug: "electrical",
      categoryName: "Electrical",
      unitOfSale: "piece",
      material: "Polycarbonate",
      finish: "Matte",
      size: "1 Module",
      pricePerSqft: 185,
      description: "Sleek and sparkless 16 Amp modular switch with silver cadmium oxide contacts for superior conductivity and long electrical life. Fire retardant virgin polycarbonate body.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: false,
      isTrending: true,
      attributes: [
        { key: "Amperage", value: "16A" },
        { key: "Voltage", value: "240V AC" },
        { key: "Type", value: "1-Way Modular Switch" },
        { key: "Color", value: "Polar White" },
        { key: "Material", value: "UV Resistant Polycarbonate" },
        { key: "Warranty", value: "2 Years Manufacturer Warranty" },
      ],
      variant: {
        size: "1 Module (16A)",
        finish: "Polar White",
        color: "White",
        pricePerBox: 185,
        pricePerSqft: 185,
        sqftPerBox: 1,
        stockBoxes: 300,
      },
    },

    // ── PLUMBING ──────────────────────────────────────
    {
      name: "Supreme 1-Inch CPVC Schedule 40 Pressure Pipe (3m)",
      slug: "supreme-cpvc-pipe-1-inch-3m",
      categorySlug: "plumbing",
      categoryName: "Plumbing",
      unitOfSale: "piece",
      material: "CPVC",
      finish: "Smooth",
      size: "1 Inch x 3 Meters",
      pricePerSqft: 340,
      description: "Chlorinated Polyvinyl Chloride (CPVC) pipe for potable hot and cold water distribution. High temperature resistance up to 93°C with lead-free formulation and minimal friction loss.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: false,
      attributes: [
        { key: "Diameter", value: "1 Inch (25mm)" },
        { key: "Length", value: "3 Meters (10 ft)" },
        { key: "Class", value: "Schedule 40 (SDR 11)" },
        { key: "Temperature Range", value: "Up to 93°C" },
        { key: "Standard", value: "ASTM D2846 / IS:15778" },
      ],
      variant: {
        size: "1 Inch x 3m",
        finish: "Standard",
        color: "Off-White",
        pricePerBox: 340,
        pricePerSqft: 340,
        sqftPerBox: 1,
        stockBoxes: 200,
      },
    },
    {
      name: "Jaquar Continental Wall Mixer with Provision for Overhead Shower",
      slug: "jaquar-continental-wall-mixer",
      categorySlug: "plumbing",
      categoryName: "Plumbing",
      unitOfSale: "piece",
      material: "Brass",
      finish: "Polished",
      size: "Standard Wall Mount",
      pricePerSqft: 4850,
      description: "Forged solid brass wall mixer with dual operating levers for hot and cold control. Features high-quality ceramic cartridges tested for over 500,000 operational cycles.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Finish", value: "Mirror Chrome Plated" },
        { key: "Material", value: "Grade A Solid Brass" },
        { key: "Cartridge", value: "High Durability Ceramic Disc" },
        { key: "Mounting", value: "Wall Mounted Exposed" },
        { key: "Warranty", value: "10 Years Brand Warranty" },
      ],
      variant: {
        size: "Standard",
        finish: "Chrome Plated",
        color: "Silver",
        pricePerBox: 4850,
        pricePerSqft: 4850,
        sqftPerBox: 1,
        stockBoxes: 40,
      },
    },

    // ── HARDWARE ──────────────────────────────────────
    {
      name: "SS 304 High-Tensile Self-Drilling Star Screws (Pack of 100)",
      slug: "ss304-self-drilling-screws-pack-100",
      categorySlug: "hardware",
      categoryName: "Hardware",
      unitOfSale: "pack",
      material: "Metal",
      finish: "Satin",
      size: "2 Inch (50mm)",
      pricePerSqft: 280,
      description: "Corrosion-proof Grade 304 Stainless Steel self-drilling wood and metal screws. Precision Phillips drive with sharp self-tapping threads for fast penetration without pre-drilling.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Length", value: "2 Inch (50mm)" },
        { key: "Material", value: "Grade 304 Stainless Steel" },
        { key: "Pack Quantity", value: "100 Pieces" },
        { key: "Head Type", value: "Phillips Star Pan Head" },
        { key: "Application", value: "Wood, Aluminum Sections, Drywall" },
      ],
      variant: {
        size: "2 Inch (Pack of 100)",
        finish: "Stainless Steel",
        color: "Silver",
        pricePerBox: 280,
        pricePerSqft: 280,
        sqftPerBox: 1,
        stockBoxes: 250,
      },
    },
    {
      name: "Godrej Stainless Steel Heavy Duty Butt Hinges 4-Inch (Pair)",
      slug: "godrej-ss-butt-hinges-4inch-pair",
      categorySlug: "hardware",
      categoryName: "Hardware",
      unitOfSale: "pack",
      material: "Metal",
      finish: "Satin",
      size: "4 x 3 x 3mm",
      pricePerSqft: 320,
      description: "Heavy-duty Grade 201/304 stainless steel ball-bearing door hinges with smooth, squeak-free operation. Engineered for solid timber main doors and heavy flush doors.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: false,
      isTrending: true,
      attributes: [
        { key: "Size", value: "4 Inch x 3 Inch x 3mm" },
        { key: "Material", value: "Stainless Steel" },
        { key: "Pack Quantity", value: "2 Pieces (1 Pair) with Screws" },
        { key: "Weight Capacity", value: "Up to 50kg per pair" },
        { key: "Bearing", value: "Dual Ball Bearing Silent Glide" },
      ],
      variant: {
        size: "4 Inch (Pair)",
        finish: "Satin Brush",
        color: "Silver",
        pricePerBox: 320,
        pricePerSqft: 320,
        sqftPerBox: 1,
        stockBoxes: 180,
      },
    },

    // ── PLYWOOD ───────────────────────────────────────
    {
      name: "CenturyPly Club Prime BWP 100% Waterproof Plywood 19mm",
      slug: "centuryply-club-prime-bwp-19mm",
      categorySlug: "plywood",
      categoryName: "Plywood",
      unitOfSale: "piece",
      material: "Wood",
      finish: "Matte",
      size: "8x4 ft (32 sq.ft)",
      pricePerSqft: 3950,
      description: "Boiling Waterproof (BWP) marine grade plywood engineered with ViroKill and Firewall technology. Specially selected imported hardwood timber bonded with un-extended synthetic resin.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Thickness", value: "19mm" },
        { key: "Sheet Dimension", value: "8 ft x 4 ft (32 sq.ft)" },
        { key: "Grade", value: "BWP Marine IS:710 Certified" },
        { key: "Core Timber", value: "100% Imported Hardwood" },
        { key: "Borer & Termite Proof", value: "25-Year Guarantee" },
        { key: "Technology", value: "ViroKill Antimicrobial & Firewall" },
      ],
      variant: {
        size: "8x4 ft (19mm)",
        finish: "Calibrated Sanded",
        color: "Natural Wood",
        pricePerBox: 3950,
        pricePerSqft: 3950,
        sqftPerBox: 1,
        stockBoxes: 80,
      },
    },
    {
      name: "Greenlam 1mm High-Gloss Burma Teak Decorative Laminate",
      slug: "greenlam-1mm-high-gloss-burma-teak",
      categorySlug: "plywood",
      categoryName: "Plywood",
      unitOfSale: "piece",
      material: "Wood",
      finish: "Glossy",
      size: "8x4 ft (1mm)",
      pricePerSqft: 1650,
      description: "1.0mm decorative luxury surface laminate with a deep high-gloss mirror finish. Resistant to scratches, steam, boiling water, and stains. Ideal for modular kitchens and wardrobe shutters.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: false,
      isTrending: true,
      attributes: [
        { key: "Thickness", value: "1.0 mm" },
        { key: "Sheet Dimension", value: "8 ft x 4 ft (32 sq.ft)" },
        { key: "Finish", value: "High Gloss Mirror Reflection" },
        { key: "Design Pattern", value: "Natural Burma Teak Grain" },
        { key: "Antibacterial", value: "99.9% Antibacterial Shield" },
      ],
      variant: {
        size: "8x4 ft (1mm)",
        finish: "High Gloss",
        color: "Teak Brown",
        pricePerBox: 1650,
        pricePerSqft: 1650,
        sqftPerBox: 1,
        stockBoxes: 120,
      },
    },

    // ── GRANITE ───────────────────────────────────────
    {
      name: "Black Galaxy Mirror Polished South Indian Granite Slab",
      slug: "black-galaxy-mirror-polished-granite",
      categorySlug: "granite",
      categoryName: "Granite",
      unitOfSale: "sqft",
      material: "Natural Stone",
      finish: "Polished",
      size: "Cut to Size (18mm)",
      pricePerSqft: 220,
      description: "World-renowned Black Galaxy granite featuring deep black base crystal interspersed with shimmering gold and bronze flecks. Dense, non-porous and highly scratch resistant for countertops.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Thickness", value: "18 mm" },
        { key: "Surface Finish", value: "10-Head Line Mirror Polished" },
        { key: "Origin Quarry", value: "Chimakurthy, Andhra Pradesh" },
        { key: "Compressive Strength", value: "2100 kg/cm²" },
        { key: "Recommended Usage", value: "Kitchen Countertops, Steps & Cladding" },
      ],
      variant: {
        size: "18mm Slab",
        finish: "Mirror Polished",
        color: "Jet Black with Gold",
        pricePerBox: 220,
        pricePerSqft: 220,
        sqftPerBox: 1,
        stockBoxes: 500,
      },
    },
    {
      name: "Tan Brown Leathered / Flamed Textured Granite",
      slug: "tan-brown-leathered-granite",
      categorySlug: "granite",
      categoryName: "Granite",
      unitOfSale: "sqft",
      material: "Natural Stone",
      finish: "Textured",
      size: "Cut to Size (20mm)",
      pricePerSqft: 175,
      description: "Rich dark brown and black granite treated with high-pressure waterjet and brushing for a sophisticated leathered, non-slip feel. High stain resistance without requiring sealers.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: false,
      isTrending: true,
      attributes: [
        { key: "Thickness", value: "20 mm" },
        { key: "Surface Finish", value: "Leather / Flamed Matte Grip" },
        { key: "Origin", value: "Karimnagar, Telangana" },
        { key: "Slip Resistance", value: "High (R11 Anti-Skid)" },
        { key: "Recommended Usage", value: "Staircases, Outdoor Steps, Vanity Tops" },
      ],
      variant: {
        size: "20mm Slab",
        finish: "Leathered",
        color: "Tan Brown",
        pricePerBox: 175,
        pricePerSqft: 175,
        sqftPerBox: 1,
        stockBoxes: 400,
      },
    },

    // ── TILES & WALL SURFACE (MOROCCAN HERITAGE) ──────
    {
      name: "Moroccan Heritage Pattern Encaustic Vitrified Kitchen Wall Tile (300x300mm)",
      slug: "moroccan-heritage-pattern-kitchen",
      categorySlug: "floor-tiles",
      categoryName: "Tiles & Flooring",
      unitOfSale: "box",
      material: "Vitrified",
      finish: "Matte",
      size: "300x300mm (12x12 inch)",
      pricePerSqft: 65,
      description: `Moroccan heritage pattern encaustic vitrified tile engineered specifically for luxury kitchen backsplashes, accent walls, and boutique bathroom floors. Drawing inspiration from timeless Andalusian and Mediterranean geometric mosaic art, each 300x300mm tile combines vibrant cobalt blues, terracotta tones, and intricate monochromatic geometries with high-definition digital inkjet glazing.

Manufactured with an ultra-dense vitrified ceramic body with an exceptionally low water absorption rate (<0.08%), these tiles are completely impervious to cooking oil splatters, steam, turmeric, coffee, and acidic food stains. The surface features an advanced protective micro-matte glaze that delivers a velvety anti-reflective texture while maintaining a Class 5 stain-cleanability rating (stains wipe clean instantly with a damp cloth and mild detergent).

Engineered with PEI IV commercial surface abrasion resistance and R10 anti-skid grip, this tile provides outstanding wear resistance for both vertical wall cladding and moderate foot-traffic residential flooring. The rectified, laser-calibrated edges allow for minimal 2mm grout joint installations, creating a seamless, continuous geometric tapestry across backsplashes, breakfast counter surrounds, powder room feature walls, and entryway borders.

Compliant with ISO 13006 / IS:15622 Group B1a standards with high breaking strength (>1500 N) and total UV fade resistance, ensuring lasting brilliance in indoor and semi-covered outdoor applications. Sold in convenient 9.7 sq.ft boxes with secure transit pallet packaging.`,
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Tile Size", value: "300 x 300 mm (12 x 12 inches)" },
        { key: "Thickness", value: "9 mm" },
        { key: "Surface Finish", value: "Velvety Anti-Reflective Matte Glaze" },
        { key: "Water Absorption", value: "<0.08% (Impervious Vitrified)" },
        { key: "Abrasion Rating", value: "PEI IV Commercial Grade" },
        { key: "Slip Resistance", value: "DIN 51130 R10 Anti-Skid" },
        { key: "Stain Resistance", value: "ISO 10545-14 Class 5 (High Cleanability)" },
        { key: "Edge Type", value: "Rectified Precision Sharp Edge" },
        { key: "Box Coverage", value: "9.7 sq.ft (9 Pieces per Box)" },
        { key: "Recommended Usage", value: "Kitchen Backsplash, Bathroom Wall, Feature Floor" },
      ],
      variant: {
        size: "300x300mm",
        finish: "Matte Encaustic",
        color: "Multicolor Heritage Pattern",
        pricePerBox: 630,
        pricePerSqft: 65,
        sqftPerBox: 9.7,
        stockBoxes: 120,
      },
    },

    // ── ALUMINUM & DOORS ──────────────────────────────
    {
      name: "Solid Pine Wood Core Pre-Laminated Flush Door 7x3 ft (32mm)",
      slug: "solid-pine-wood-core-flush-door-7x3",
      categorySlug: "aluminum-doors",
      categoryName: "Aluminum & Doors",
      unitOfSale: "piece",
      material: "Wood",
      finish: "Matte",
      size: "7 ft x 3 ft (32mm)",
      pricePerSqft: 4600,
      description: `Solid pine wood core pre-laminated flush door engineered for high-performance residential and commercial architectural installations. Crafted with 100% kiln-seasoned pine timber internal stiles and rails, this 32mm architectural door provides exceptional structural rigidity, dimensional stability, and zero warping across seasonal humidity variations.

Constructed in strict accordance with IS:2202 (Part 1) quality standards, the interior core is vacuum-pressure impregnated with eco-friendly preservatives compliant with IS:401, rendering the door completely borer-proof, termite-resistant, and immune to fungal attack. High-density cross-band hardwood veneers are bonded under high-pressure hydraulic hot presses with Boiling Water Proof (BWP) grade synthetic phenol formaldehyde resin.

The exterior surface features an ultra-durable, scratch-resistant pre-laminated melamine finish in rich natural dark walnut grain, completely eliminating the labor, fumes, and cost of on-site polishing or painting. Engineered with a solid high-density acoustic core providing 32dB sound reduction, this door is ideal for master bedrooms, executive home offices, hotel suites, conference halls, and luxury apartments.

Features solid internal timber framing for secure mortise lock installation, heavy-duty architectural butt hinge anchoring (holding strength exceeding 1500N), and smooth factory-sealed edge lipping. Ready for direct installation in standard 7x3 ft door frames with factory-calibrated precision.`,
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Door Dimensions", value: "7 ft x 3 ft (84 inch x 36 inch / 2134mm x 914mm)" },
        { key: "Door Thickness", value: "32 mm" },
        { key: "Core Material", value: "Kiln Seasoned Solid Pine Timber" },
        { key: "Surface Finish", value: "Pre-Laminated Melamine (Dark Walnut)" },
        { key: "Acoustic Insulation", value: "32 dB Sound Reduction" },
        { key: "Adhesive Resin", value: "Un-Extended BWP Synthetic Phenol Resin" },
        { key: "Certification", value: "IS:2202 Part 1 & IS:401 Borer-Proof" },
        { key: "Screw Holding Capacity", value: ">1500 N" },
        { key: "Warranty", value: "10 Years Manufacturer Warranty" },
      ],
      variant: {
        size: "7x3 ft (32mm)",
        finish: "Walnut Laminated",
        color: "Dark Walnut",
        pricePerBox: 4600,
        pricePerSqft: 4600,
        sqftPerBox: 1,
        stockBoxes: 60,
      },
    },

    // ── WALLPAPER ─────────────────────────────────────
    {
      name: "Royal European 3D Geometric Textured Vinyl Wallpaper Roll (57 sq.ft)",
      slug: "royal-european-geometric-wallpaper-roll",
      categorySlug: "wallpaper",
      categoryName: "Wallpaper",
      unitOfSale: "roll",
      material: "Vinyl",
      finish: "Textured",
      size: "10m x 0.53m (57 sq.ft)",
      pricePerSqft: 1850,
      description: "Heavyweight non-woven washable textured vinyl wallpaper roll. Deep embossing with metallic gold and neutral grey accents creates an opulent accent wall for living rooms and bedrooms.",
      images: [
        "/placeholders/product.svg",
      ],
      isBestseller: true,
      isTrending: true,
      attributes: [
        { key: "Roll Coverage", value: "57 sq.ft (5.3 sq.m)" },
        { key: "Roll Dimensions", value: "10 Meters x 0.53 Meters (33ft x 21in)" },
        { key: "Material", value: "Washable Non-Woven Vinyl" },
        { key: "Installation", value: "Paste the Wall / Wallpaper Glue" },
        { key: "Pattern Repeat", value: "53 cm Straight Match" },
      ],
      variant: {
        size: "1 Roll (57 sq.ft)",
        finish: "Textured Embossed",
        color: "Gold & Charcoal Grey",
        pricePerBox: 1850,
        pricePerSqft: 1850,
        sqftPerBox: 1,
        stockBoxes: 150,
      },
    },
    // ── GSC CANONICAL PRODUCTS (previously mis-redirected, now fully seeded) ──
    {
      name: "Solid Pine Wood Core Flush Door 7x3 ft — Pre-Laminated Teak Finish",
      slug: "solid-pine-wood-core-flush-door-7x3",
      categorySlug: "aluminum-doors",
      categoryName: "Aluminum & Doors",
      unitOfSale: "piece",
      material: "Pine Wood Core",
      finish: "Pre-Laminated Teak",
      size: "7 ft x 3 ft (2134 x 914 mm)",
      pricePerSqft: 4200,
      description:
        "The Intrihub Solid Pine Wood Core Flush Door (7 ft × 3 ft) is an architecturally precision-engineered interior door designed for premium residential and commercial developments. Constructed from a kiln-dried solid pine wood core — responsibly sourced from FSC-certified plantations — the door provides superior structural rigidity, excellent screw-holding strength, and dramatically reduced warping compared to hollow-core alternatives. The entire door assembly is veneered on both faces with IS:1328-grade pre-laminated decorative teak finish, offering a rich, warm woodgrain surface that requires no additional painting or polishing post-installation. The high-density pine core construction ensures an STC (Sound Transmission Class) rating of 32 dB, making this door an effective acoustic barrier between living spaces, bedrooms, home offices, and common corridors in residential apartments and commercial suites. Each door leaf is bonded under hydraulic cold press at 40 kg/cm² for 8 hours, ensuring void-free panel integrity with no internal delamination or bubbles. The factory-applied veneer surfaces are pre-sanded to 180-grit and sealed with anti-fungal primer, making installation in humid climates — including coastal Bengaluru and Mumbai — practical and durable. Dimensions are precision CNC machined to ±1.5 mm tolerance, enabling gap-free fits with standard aluminum door frames, wooden box frames, or concealed subframe systems. The solid pine core ensures full hardware compatibility: mortise locks, concealed door closers, multi-point locking systems, and magnetic latches can all be fitted without bridging or backing reinforcement. Each door leaf passes IS:4020 cyclic accelerated humidity and temperature variance tests over 1,200 cycles, certifying its dimensional stability across Indian climate zones. Available in standard 7 × 3 ft (2134 × 914 mm) and custom cut-to-size on project orders. Minimum order for single-batch tonal match on multi-door commercial projects is 10 pieces. Packed in polypropylene corrugated wrap with 4-point corner guards for transit protection. Intrihub offers phased project delivery with GPS-tracked logistics to active construction sites across Bengaluru, Mysuru, Hyderabad, and Chennai.",
      images: ["/placeholders/product.svg"],
      isBestseller: true,
      isTrending: false,
      attributes: [
        { key: "Core Material", value: "Kiln-Dried Solid Pine (FSC Certified)" },
        { key: "Surface Finish", value: "Pre-Laminated Teak Decorative Veneer (IS:1328)" },
        { key: "Door Size", value: "7 ft × 3 ft (2134 × 914 mm)" },
        { key: "Door Thickness", value: "35 mm (Standard) / 45 mm (Premium)" },
        { key: "STC Acoustic Rating", value: "32 dB" },
        { key: "Press Bonding Pressure", value: "40 kg/cm² Hydraulic Cold Press (8 hrs)" },
        { key: "Humidity Resistance", value: "IS:4020 Cyclic Test Certified (1,200 Cycles)" },
        { key: "Screw Pull Resistance", value: ">1,200 N (IS:4020 Clause 7)" },
        { key: "Finish Grit", value: "Pre-Sanded 180-Grit + Anti-Fungal Primer Sealed" },
        { key: "Compatible Hardware", value: "Mortise Locks, Concealed Closers, Magnetic Latches" },
        { key: "Standard", value: "IS:2202 / IS:4020" },
        { key: "Origin", value: "Bengaluru / Rajasthan Factory" },
      ],
      variant: {
        size: "7 ft × 3 ft (2134 × 914 mm)",
        finish: "Pre-Laminated Teak",
        color: "Teak Brown",
        pricePerBox: 4200,
        pricePerSqft: 4200,
        sqftPerBox: 1,
        stockBoxes: 85,
      },
    },
    {
      name: "Moroccan Heritage Pattern Kitchen Wall Tile — Encaustic Gloss 200×200 mm",
      slug: "moroccan-heritage-pattern-kitchen",
      categorySlug: "floor-tiles",
      categoryName: "Tiles & Flooring",
      unitOfSale: "box",
      material: "Ceramic",
      finish: "Glossy",
      size: "200 × 200 mm (8×8 inch)",
      pricePerSqft: 68,
      description:
        "The Intrihub Moroccan Heritage Pattern Kitchen Wall Tile is a premium 200 × 200 mm ceramic wall tile featuring a hand-printed Moroccan encaustic pattern in vibrant cobalt blue, antique white, and terracotta ochre — evoking traditional Zellige and Bejmat artisan tile traditions of North Africa and Andalusia. This tile is manufactured using double-fired ceramic technology with a high-gloss transparent glaze overlay, achieving a water absorption rate of less than 3% (Group BIII classification per ISO 10545-3), making it fully suitable for Indian kitchen backsplashes, wet walls, bathroom dado applications, and decorative feature walls in cafes, restaurants, and boutique hospitality interiors. The geometric star-and-interlace pattern repeat is digitally printed via direct inkjet technology at 1,200 dpi resolution, ensuring crisp geometric edges and vibrant, fade-resistant chromatic saturation. The tiles maintain their chromatic fidelity across 300+ thermal cycles, passing ISO 10545-9 thermal shock resistance tests. Each tile surface has a Mohs hardness rating of 5 to 6, sufficient for vertical wall installation in high-humidity environments without surface crazing or glaze cracking. The back face features a ribbed keying pattern, providing superior mortar adhesion (pullout strength exceeding 0.5 N/mm² per EN 1348). A single box covers 4.8 sq.ft (0.45 sq.m), with 12 tiles per box and a caliber tolerance of ±0.5 mm, enabling tight-grout installation with 2 mm grout joints for a seamless mosaic appearance. Installation compatibility extends to grey flexible adhesive (C2 grade), white non-sanded grout, and waterproof epoxy grout for wet zone applications. This tile range is certified under IS:15622 (vitrified tile standard reference for color and pattern stability) and is manufactured at BIS-approved ceramic units in Morbi, Gujarat, the world's largest tile manufacturing hub. Intrihub supplies this tile with individual carton barcodes for BOQ reconciliation and project quantity verification. Matching border trim tiles, pencil liners, and corner ogee profiles are available in the same Moroccan Heritage collection for fully cohesive wall installations. Minimum project order for single-run dye-lot consistency: 50 boxes.",
      images: ["/placeholders/product.svg"],
      isBestseller: false,
      isTrending: true,
      attributes: [
        { key: "Tile Size", value: "200 × 200 mm (8 × 8 inches)" },
        { key: "Thickness", value: "7 mm" },
        { key: "Tiles per Box", value: "12 Tiles" },
        { key: "Coverage per Box", value: "4.8 sq.ft (0.45 sq.m)" },
        { key: "Surface", value: "High-Gloss Transparent Glaze" },
        { key: "Pattern", value: "Moroccan Encaustic Heritage Geometric — Star & Interlace" },
        { key: "Print Technology", value: "Direct Inkjet 1,200 dpi" },
        { key: "Water Absorption", value: "<3% (ISO 10545-3, Group BIII)" },
        { key: "Mohs Hardness", value: "5–6 (Wall Grade)" },
        { key: "Thermal Shock Resistance", value: "ISO 10545-9 Certified (300+ Cycles)" },
        { key: "Adhesion Pullout", value: ">0.5 N/mm² (EN 1348)" },
        { key: "Grout Joint Recommendation", value: "2 mm (Tight-Set)" },
        { key: "Standard", value: "IS:15622 / ISO 13006" },
        { key: "Origin", value: "Morbi, Gujarat (BIS-Approved Unit)" },
        { key: "Suitable For", value: "Kitchen Backsplash, Bathroom Dado, Feature Walls, Cafe Interiors" },
      ],
      variant: {
        size: "Box of 12 Tiles (200×200 mm)",
        finish: "Glossy Cobalt Blue / White / Ochre",
        color: "Cobalt Blue & Antique White",
        pricePerBox: 68,
        pricePerSqft: 68,
        sqftPerBox: 4.8,
        stockBoxes: 220,
      },
    },
  ];


  for (const item of productsToSeed) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (existing) {
      // Update attributes
      await prisma.productAttribute.deleteMany({ where: { productId: existing.id } });
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          unitOfSale: item.unitOfSale,
          pricePerSqft: item.pricePerSqft,
          attributes: {
            create: item.attributes.map((a) => ({ key: a.key, value: a.value })),
          },
        },
      });
    } else {
      const cat = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
      await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          categoryId: cat?.id || null,
          categorySlug: item.categorySlug,
          categoryName: item.categoryName,
          unitOfSale: item.unitOfSale,
          material: item.material,
          finish: item.finish,
          size: item.size,
          pricePerSqft: item.pricePerSqft,
          thickness: "Standard",
          usage: "Interior / Building",
          look: item.name,
          inStock: true,
          isBestseller: item.isBestseller,
          isTrending: item.isTrending,
          images: item.images,
          description: item.description,
          rating: 4.8,
          reviewCount: 18,
          variants: {
            create: [item.variant],
          },
          attributes: {
            create: item.attributes.map((a) => ({ key: a.key, value: a.value })),
          },
        },
      });
    }
  }

  console.log(`✅ Seeded ${productsToSeed.length} multi-category sample products.`);
}

seedIntrihub()
  .then(() => {
    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  });
