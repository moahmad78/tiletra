import { prisma } from "../lib/prisma";

export const CATEGORIES_DATA = [
  {
    name: "Cement & Concrete",
    slug: "cement-concrete",
    description: "OPC/PPC grade cement bags, ready-mix concrete, admixtures, curing compounds & site mixes.",
    image: "/images/categories/cat-cement-concrete.jpg",
    icon: "Package",
    order: 1,
  },
  {
    name: "Steel & Rebar",
    slug: "steel-rebar",
    description: "Fe 550D TMT reinforcement bars, MS angles, binding wire, steel mesh & structural beams.",
    image: "/images/categories/cat-steel-rebar.jpg",
    icon: "Layers",
    order: 2,
  },
  {
    name: "Bricks & Blocks",
    slug: "bricks-blocks",
    description: "Red kiln-burnt clay bricks, lightweight AAC fly-ash blocks, concrete solid blocks & pavers.",
    image: "/images/categories/cat-bricks-blocks.jpg",
    icon: "Square",
    order: 3,
  },
  {
    name: "Sand & Aggregates",
    slug: "sand-aggregates",
    description: "Manufactured M-sand, plastering P-sand, 10mm/20mm coarse aggregate gravel & stone dust.",
    image: "/images/categories/cat-sand-aggregates.jpg",
    icon: "Boxes",
    order: 4,
  },
  {
    name: "Roofing & Sheets",
    slug: "roofing-sheets",
    description: "Color coated profile roofing sheets, galvanized GI corrugated sheets, polycarbonate & FRP panels.",
    image: "/images/categories/cat-roofing-sheets.jpg",
    icon: "Building",
    order: 5,
  },
  {
    name: "Site Tools & Safety",
    slug: "site-tools-safety",
    description: "Construction safety helmets, high-vis vests, steel-toe boots, scaffolding, power tools & mason trowels.",
    image: "/images/categories/cat-tools-consumables.jpg",
    icon: "ShieldAlert",
    order: 6,
  },
  {
    name: "Tiles & Flooring",
    slug: "tiles-flooring",
    aliases: ["floor-tiles", "tiles-stone"],
    description: "Vitrified floor tiles, glazed wall tiles, natural marble, polished granite & SPC planks.",
    image: "/images/categories/cat-tiles-stone.jpg",
    icon: "Grid",
    order: 7,
  },
  {
    name: "Plywood, Laminates & Surfaces",
    slug: "plywood-laminates-surfaces",
    aliases: ["plywood", "wall-surface"],
    description: "BWP marine plywood, commercial MR ply, decorative sunmica laminates, veneers & acrylic sheets.",
    image: "/images/categories/cat-plywood.jpg",
    icon: "Layers",
    order: 8,
  },
  {
    name: "Hardware & Fasteners",
    slug: "hardware-fasteners",
    aliases: ["hardware", "hardware-fittings"],
    description: "SS 304 screws, anchor bolts, hydraulic soft-close hinges, drawer channels & precision fasteners.",
    image: "/images/categories/cat-hardware.webp",
    icon: "Wrench",
    order: 9,
  },
  {
    name: "Lights & Lighting",
    slug: "lights-lighting",
    aliases: ["lighting"],
    description: "Architectural recessed COB downlights, LED magnetic tracks, profile strip lights, chandeliers & smart fixtures.",
    image: "/images/categories/cat-lighting.jpg",
    icon: "Sun",
    order: 10,
  },
  {
    name: "Kitchen & Wardrobe Fittings",
    slug: "kitchen-wardrobe-fittings",
    aliases: ["kitchen-wardrobe"],
    description: "Modular kitchen tandem drawers, SS wire pull-out baskets, corner carousels & wardrobe organizers.",
    image: "/images/categories/cat-kitchen-wardrobe.jpg",
    icon: "Package",
    order: 11,
  },
  {
    name: "Paints & Finishes",
    slug: "paint-finishes",
    description: "Luxury interior emulsions, exterior weatherproof paints, acrylic wall putty, primers & wood coatings.",
    image: "/images/categories/cat-paint-finishes.jpg",
    icon: "Palette",
    order: 12,
  },
  {
    name: "Glass, Mirrors & Profiles",
    slug: "glass-mirrors-profiles",
    aliases: ["glass-mirror"],
    description: "Toughened architectural partition glass, LED smart touch vanity mirrors, shower enclosures & aluminum glass profiles.",
    image: "/images/categories/cat-glass-mirror.jpg",
    icon: "Maximize",
    order: 13,
  },
  {
    name: "Ceiling & Drywall",
    slug: "ceiling-drywall",
    aliases: ["false-ceiling"],
    description: "Gypsum plasterboards, POP false ceiling molding plaster, GI perimeter channels & acoustic panels.",
    image: "/images/categories/cat-false-ceiling.jpg",
    icon: "Square",
    order: 14,
  },
  {
    name: "Electricals & Wires",
    slug: "electricals-wires",
    aliases: ["electrical"],
    description: "Flame-retardant copper house wires, modular switch plates, MCBs, distribution boards & conduit pipes.",
    image: "/images/categories/cat-electrical.jpg",
    icon: "Zap",
    order: 15,
  },
  {
    name: "Plumbing & Tanks",
    slug: "plumbing-tanks",
    aliases: ["plumbing"],
    description: "CPVC/UPVC water supply pipes, overhead multi-layer water tanks, pressure booster pumps, ball valves & drainage.",
    image: "/images/categories/cat-plumbing.jpg",
    icon: "Droplets",
    order: 16,
  },
  {
    name: "Sanitaryware & Bath",
    slug: "sanitaryware-bath",
    aliases: ["plumbing-sanitary"],
    description: "Rimless wall-hung water closets, countertop designer basins, brass diverter mixers, overhead showers & luxury bath fittings.",
    image: "/images/categories/cat-sanitaryware-bath.jpg",
    icon: "Sparkles",
    order: 17,
  },
  {
    name: "Doors, Windows & Locks",
    slug: "doors-windows-locks",
    aliases: ["doors-windows"],
    description: "Flush wood doors, UPVC soundproof sliding windows, smart biometric digital locks & mortise handle sets.",
    image: "/images/categories/cat-doors-windows.jpg",
    icon: "DoorOpen",
    order: 18,
  },
  {
    name: "Waterproofing & Adhesives",
    slug: "waterproofing-adhesives",
    aliases: ["adhesives-sealants-waterproofing"],
    description: "Polymer-modified tile adhesives, epoxy grouts, terrace liquid waterproofing membranes & silicone sealants.",
    image: "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
    icon: "ShieldAlert",
    order: 19,
  },
  {
    name: "Solar & Energy",
    slug: "solar-energy",
    description: "High-efficiency monocrystalline solar panels, on-grid/hybrid inverters, lithium solar batteries & mounting kits.",
    image: "/images/categories/cat-solar-energy.jpg",
    icon: "Sun",
    order: 20,
  },
  {
    name: "Fans & Ventilation",
    slug: "fans-ventilation",
    description: "BLDC energy-efficient decorative ceiling fans, low-noise exhaust fans, inline duct fans & ventilation louvers.",
    image: "/images/categories/cat-fans-ventilation.jpg",
    icon: "Wind",
    order: 21,
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    aliases: ["decor-accessories"],
    description: "Luxury wall art, metal planter stands, ambient decorative lighting, floor rugs & curated interior styling pieces.",
    image: "/images/categories/cat-decor-accessories.jpg",
    icon: "Palette",
    order: 22,
  },
];

async function main() {
  console.log("Seeding and Updating 22 Master Categories...");

  for (const item of CATEGORIES_DATA) {
    // Check if category exists by slug
    let existing = await prisma.category.findUnique({
      where: { slug: item.slug },
    });

    // If not found by primary slug, check aliases
    if (!existing && item.aliases && item.aliases.length > 0) {
      for (const alias of item.aliases) {
        existing = await prisma.category.findUnique({
          where: { slug: alias },
        });
        if (existing) break;
      }
    }

    if (existing) {
      console.log(`Updating existing category [${existing.id}] "${existing.name}" -> "${item.name}" (${item.slug})`);
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          image: item.image,
          icon: item.icon,
          order: item.order,
          parentId: null, // Ensure primary category is top-level
        },
      });

      // Update mapped products categoryName / categorySlug
      await prisma.product.updateMany({
        where: { categoryId: existing.id },
        data: {
          categoryName: item.name,
          categorySlug: item.slug,
        },
      });
    } else {
      console.log(`Creating new category "${item.name}" (${item.slug})`);
      await prisma.category.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          image: item.image,
          icon: item.icon,
          order: item.order,
          parentId: null,
        },
      });
    }
  }

  const allCats = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
  });

  console.log("\n✅ All Top-Level Categories in DB (" + allCats.length + "):");
  for (const c of allCats) {
    console.log(`- #${c.order}: ${c.name} (${c.slug}) -> ${c.image}`);
  }
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
