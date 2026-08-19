import { prisma } from "../lib/prisma";

const TAXONOMY_CATEGORIES = [
  {
    name: "Tiles & Flooring",
    slug: "floor-tiles",
    description: "Premium vitrified, ceramic, and porcelain floor & wall tiles for every space.",
    image: "/placeholders/product.svg",
    order: 1,
    icon: "Grid",
  },
  {
    name: "Electrical",
    slug: "electrical",
    description: "Certified wires, modular switches, MCBs, conduit pipes & distribution boards.",
    image: "/placeholders/product.svg",
    order: 2,
    icon: "Zap",
  },
  {
    name: "Plumbing & Sanitaryware",
    slug: "plumbing",
    description: "CPVC/UPVC pipes, brass mixer taps, sanitaryware, washbasins, toilets & bath fittings.",
    image: "/placeholders/product.svg",
    order: 3,
    icon: "Droplets",
  },
  {
    name: "Wall Finishes & Paint",
    slug: "wall-finishes-paint",
    description: "Interior & exterior emulsion paints, designer vinyl wallpapers, and 3D fluted wall panels.",
    image: "/placeholders/product.svg",
    order: 4,
    icon: "Palette",
  },
  {
    name: "Plywood & Laminates",
    slug: "plywood",
    description: "BWP marine grade plywood, commercial ply, MDF boards, veneers & high gloss laminates.",
    image: "/placeholders/product.svg",
    order: 5,
    icon: "Layers",
  },
  {
    name: "Hardware & Fasteners",
    slug: "hardware",
    description: "Stainless steel screws, architectural hinges, mortise & smart digital locks, drawer channels.",
    image: "/placeholders/product.svg",
    order: 6,
    icon: "Wrench",
  },
  {
    name: "Granite & Stone",
    slug: "granite",
    description: "Polished South Indian granite slabs, Italian marble, step treads & kitchen countertops.",
    image: "/placeholders/product.svg",
    order: 7,
    icon: "Sparkles",
  },
  {
    name: "Ceiling & POP",
    slug: "ceiling-pop",
    description: "False ceiling gypsum boards, POP plaster, GI channel grids & acoustic ceiling tiles.",
    image: "/placeholders/product.svg",
    order: 8,
    icon: "Square",
  },
  {
    name: "Doors, Windows & Aluminum",
    slug: "aluminum-doors",
    description: "Solid flush doors, anodized aluminum window sections, sliding profiles & window fittings.",
    image: "/placeholders/product.svg",
    order: 9,
    icon: "DoorOpen",
  },
  {
    name: "Lighting",
    slug: "lighting",
    description: "Decorative chandeliers, recessed COB spotlights, LED strip lights & track lighting.",
    image: "/placeholders/product.svg",
    order: 10,
    icon: "Sun",
  },
  {
    name: "Furniture & Modular Fittings",
    slug: "furniture-modular-fittings",
    description: "Wardrobe lift fittings, modular kitchen wire baskets, soft-close tandem boxes & flap stays.",
    image: "/placeholders/product.svg",
    order: 11,
    icon: "Package",
  },
  {
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    description: "Polymer tile adhesives, epoxy grouts, silicone sealants & terrace waterproofing membranes.",
    image: "/placeholders/product.svg",
    order: 12,
    icon: "Shield",
  },
  {
    name: "Glass & Glazing",
    slug: "glass-glazing",
    description: "Toughened glass partitions, designer LED vanity mirrors, shower cubicles & spider fittings.",
    image: "/placeholders/product.svg",
    order: 13,
    icon: "Maximize",
  },
  {
    name: "HVAC & Ventilation",
    slug: "hvac-ventilation",
    description: "Heavy-duty exhaust fans, fresh air ducting, linear slot diffusers & ventilation louvers.",
    image: "/placeholders/product.svg",
    order: 14,
    icon: "Wind",
  },
  {
    name: "Curtains, Blinds & Window Treatments",
    slug: "curtains-blinds",
    description: "Motorized curtain tracks, roller & zebra blinds, blackout drapes and architectural rods.",
    image: "/placeholders/product.svg",
    order: 15,
    icon: "Sliders",
  },
  {
    name: "Security & Safety",
    slug: "security-safety",
    description: "Smart WiFi CCTV cameras, biometric door locks, fire extinguishers & video doorbells.",
    image: "/placeholders/product.svg",
    order: 16,
    icon: "Lock",
  },
  {
    name: "Outdoor & Landscaping",
    slug: "outdoor-landscaping",
    description: "Anti-skid outdoor pavers, high-density artificial turf, garden fencing & exterior decking.",
    image: "/placeholders/product.svg",
    order: 17,
    icon: "Trees",
  },
];

async function main() {
  console.log("Seeding all 17 taxonomy categories to Neon PostgreSQL...");

  for (const cat of TAXONOMY_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.category.update({
        where: { slug: cat.slug },
        data: {
          name: cat.name,
          description: cat.description,
          image: cat.image,
          order: cat.order,
          icon: cat.icon,
        },
      });
      console.log(`Updated category: ${cat.name} (${cat.slug})`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          order: cat.order,
          icon: cat.icon,
        },
      });
      console.log(`Created category: ${cat.name} (${cat.slug})`);
    }
  }

  // Also ensure wallpaper alias category exists
  const wallpaperCat = await prisma.category.findUnique({ where: { slug: "wallpaper" } });
  if (wallpaperCat) {
    await prisma.category.update({
      where: { slug: "wallpaper" },
      data: {
        name: "Wallpaper & Wall Finishes",
        description: "Textured vinyl wallpapers & 3D fluted panels",
        order: 18,
      },
    });
  }

  console.log("SUCCESS: All 17 taxonomy categories are in Neon PostgreSQL!");
}

main()
  .catch((e) => {
    console.error("Error seeding categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
