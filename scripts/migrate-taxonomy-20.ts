import { prisma } from "../lib/prisma";

interface NewCategoryDef {
  name: string;
  slug: string;
  order: number;
  description: string;
  image: string;
  icon?: string;
  parentSlug?: string;
}

const NEW_20_TAXONOMY: NewCategoryDef[] = [
  {
    name: "Electrical",
    slug: "electrical",
    order: 1,
    description: "Certified wires, modular switches, MCBs, distribution boards & conduit piping.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    icon: "Zap",
  },
  {
    name: "Lighting",
    slug: "lighting",
    order: 2,
    description: "Decorative chandeliers, pendant lights, recessed COB downlights, LED strips & profile lights.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    icon: "Sun",
  },
  {
    name: "Tiles & Stone",
    slug: "tiles-stone",
    order: 3,
    description: "Vitrified tiles, ceramic, Italian marble, polished granite slabs & stone cladding.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    icon: "Grid",
  },
  {
    name: "Paint & Finishes",
    slug: "paint-finishes",
    order: 4,
    description: "Luxury interior emulsions, exterior weatherproof paints, primers, textures & wood polishes.",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    icon: "Palette",
  },
  {
    name: "False Ceiling",
    slug: "false-ceiling",
    order: 5,
    description: "Gypsum false ceiling boards, POP molding plaster, GI channel grids & acoustic ceiling tiles.",
    image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
    icon: "Square",
  },
  {
    name: "Flooring",
    slug: "flooring",
    order: 6,
    description: "Wooden laminate flooring, SPC/LVP waterproof planks, engineered hardwood & vinyl rolls.",
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80",
    icon: "Layers",
  },
  {
    name: "Doors & Windows",
    slug: "doors-windows",
    order: 7,
    description: "Solid flush doors, UPVC/aluminum window sections, sliding profiles & hardware kits.",
    image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80",
    icon: "DoorOpen",
  },
  {
    name: "Glass & Mirror",
    slug: "glass-mirror",
    order: 8,
    description: "Toughened partition glass, LED smart touch vanity mirrors, shower cubicles & glass fittings.",
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80",
    icon: "Maximize",
  },
  {
    name: "Hardware & Fittings",
    slug: "hardware-fittings",
    order: 9,
    description: "SS 304 screws, soft-close hydraulic hinges, mortise locks, handles & drawer slides.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80",
    icon: "Wrench",
  },
  {
    name: "Furniture",
    slug: "furniture",
    order: 10,
    description: "Living room, dining & bedroom furniture, ergonomic seating, study tables & storage.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    icon: "Armchair",
  },
  {
    name: "Kitchen & Wardrobe",
    slug: "kitchen-wardrobe",
    order: 11,
    description: "Modular kitchen wire baskets, tandem drawer boxes, pantry units & wardrobe organizers.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
    icon: "Package",
  },
  {
    name: "Plumbing & Sanitary",
    slug: "plumbing-sanitary",
    order: 12,
    description: "CPVC/UPVC pipes, brass mixer faucets, washbasins, ceramic water closets & bath fittings.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    icon: "Droplets",
  },
  {
    name: "Wall & Surface",
    slug: "wall-surface",
    order: 13,
    description: "Designer non-woven wallpapers, 3D charcoal fluted wall slats, louvers & PVC wall panels.",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
    icon: "Wallpaper",
  },
  {
    name: "Decor & Accessories",
    slug: "decor-accessories",
    order: 14,
    description: "Wall art, metal planters, decorative vases, table accents, rugs & ambient interior styling.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
    icon: "Sparkles",
  },
  {
    name: "Curtains & Blinds",
    slug: "curtains-blinds",
    order: 15,
    description: "Motorized smart curtain tracks, zebra & roller blinds, blackout fabrics and designer rods.",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
    icon: "Sliders",
  },
  {
    name: "Office & Commercial",
    slug: "office-commercial",
    order: 16,
    description: "Workstations, acoustic desk dividers, office conference tables, reception desks & task chairs.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    icon: "Building",
  },
  {
    name: "Outdoor & Landscape",
    slug: "outdoor-landscape",
    order: 17,
    description: "Heavy-duty parking pavers, 35mm UV artificial turf, outdoor composite decking & fencing.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    icon: "Trees",
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    order: 18,
    description: "Smart touch switches, WiFi curtain motors, voice-controlled ambient lighting & smart hubs.",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
    icon: "Cpu",
  },
  {
    name: "Safety & Fire",
    slug: "safety-fire",
    order: 19,
    description: "Smart biometric door locks, HD WiFi CCTV cameras, fire extinguishers & smoke detectors.",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
    icon: "ShieldAlert",
  },
  {
    name: "Tools & Consumables",
    slug: "tools-consumables",
    order: 20,
    description: "Power tools, measuring tapes, diamond cutting blades, safety gear, fasteners & site supplies.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    icon: "Hammer",
  },
  // Subcategories
  {
    name: "Plywood & Laminates",
    slug: "plywood",
    order: 21,
    description: "BWP marine ply, commercial MR plywood, MDF, HDHMR boards & decorative laminates.",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
    icon: "Layers",
    parentSlug: "furniture",
  },
  {
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    order: 22,
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    icon: "Shield",
    parentSlug: "tools-consumables",
  },
];

async function migrateTaxonomy() {
  console.log("=== STARTING 20-CATEGORY TAXONOMY MIGRATION ===");

  // 1. Audit existing categories and product associations
  const existingCategories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: { select: { id: true, name: true, categoryId: true } },
    },
  });

  console.log(`Found ${existingCategories.length} existing categories in DB:`);
  for (const c of existingCategories) {
    console.log(`- ${c.name} (${c.slug}): ${c._count.products} products attached`);
  }

  // 2. Ensure all top-level categories exist first
  const categoryMap = new Map<string, string>(); // slug -> categoryId

  for (const cat of NEW_20_TAXONOMY.filter((c) => !c.parentSlug)) {
    let rec = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!rec) {
      rec = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          order: cat.order,
          icon: cat.icon,
        },
      });
      console.log(`Created new top-level category: ${cat.name} (${cat.slug})`);
    } else {
      rec = await prisma.category.update({
        where: { slug: cat.slug },
        data: {
          name: cat.name,
          description: cat.description,
          image: cat.image,
          order: cat.order,
          icon: cat.icon,
        },
      });
      console.log(`Updated top-level category: ${cat.name} (${cat.slug}) [Order: ${cat.order}]`);
    }
    categoryMap.set(cat.slug, rec.id);
  }

  // 3. Upsert subcategories with parentId
  for (const sub of NEW_20_TAXONOMY.filter((c) => c.parentSlug)) {
    const parentId = categoryMap.get(sub.parentSlug!);
    let rec = await prisma.category.findUnique({ where: { slug: sub.slug } });
    if (!rec) {
      rec = await prisma.category.create({
        data: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          image: sub.image,
          order: sub.order,
          icon: sub.icon,
          parentId: parentId || null,
        },
      });
      console.log(`Created subcategory: ${sub.name} (${sub.slug}) under ${sub.parentSlug}`);
    } else {
      rec = await prisma.category.update({
        where: { slug: sub.slug },
        data: {
          name: sub.name,
          description: sub.description,
          image: sub.image,
          order: sub.order,
          icon: sub.icon,
          parentId: parentId || null,
        },
      });
      console.log(`Updated subcategory: ${sub.name} (${sub.slug}) under ${sub.parentSlug}`);
    }
    categoryMap.set(sub.slug, rec.id);
  }

  // 4. Reassign products from old slugs to new slugs
  const reassignments: { fromSlug: string; toSlug: string }[] = [
    { fromSlug: "floor-tiles", toSlug: "tiles-stone" },
    { fromSlug: "granite", toSlug: "tiles-stone" },
    { fromSlug: "plumbing", toSlug: "plumbing-sanitary" },
    { fromSlug: "hardware", toSlug: "hardware-fittings" },
    { fromSlug: "ceiling-pop", toSlug: "false-ceiling" },
    { fromSlug: "aluminum-doors", toSlug: "doors-windows" },
    { fromSlug: "glass-glazing", toSlug: "glass-mirror" },
    { fromSlug: "furniture-modular-fittings", toSlug: "kitchen-wardrobe" },
    { fromSlug: "security-safety", toSlug: "safety-fire" },
    { fromSlug: "outdoor-landscaping", toSlug: "outdoor-landscape" },
    { fromSlug: "wall-finishes-paint", toSlug: "paint-finishes" },
    { fromSlug: "wallpaper", toSlug: "wall-surface" },
  ];

  for (const { fromSlug, toSlug } of reassignments) {
    const targetId = categoryMap.get(toSlug);
    if (!targetId) continue;

    const oldCat = await prisma.category.findUnique({
      where: { slug: fromSlug },
      include: { products: true },
    });

    if (oldCat && oldCat.id !== targetId) {
      if (oldCat.products.length > 0) {
        console.log(`Reassigning ${oldCat.products.length} products from ${fromSlug} to ${toSlug}...`);
        await prisma.product.updateMany({
          where: { categoryId: oldCat.id },
          data: { categoryId: targetId },
        });
        console.log(`-> Successfully reassigned ${oldCat.products.length} products to ${toSlug}!`);
      }

      // Check if oldCat slug is NOT in the new 20 categories list
      const isStillInNew = NEW_20_TAXONOMY.some((c) => c.slug === fromSlug);
      if (!isStillInNew) {
        console.log(`Cleaning up decommissioned category record: ${fromSlug}`);
        await prisma.category.delete({ where: { id: oldCat.id } });
      }
    }
  }

  // Also remove HVAC if it exists
  const hvac = await prisma.category.findUnique({ where: { slug: "hvac-ventilation" } });
  if (hvac) {
    console.log("Removing deprecated HVAC category...");
    await prisma.product.updateMany({
      where: { categoryId: hvac.id },
      data: { categoryId: categoryMap.get("tools-consumables") || categoryMap.get("electrical")! },
    });
    await prisma.category.delete({ where: { id: hvac.id } });
  }

  console.log("=== VERIFYING FINAL CATEGORIES & PRODUCT COUNTS ===");
  const finalCategories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  for (const c of finalCategories) {
    console.log(`[Order ${c.order}] ${c.name} (${c.slug}) -> ${c._count.products} products`);
  }

  console.log("=== TAXONOMY MIGRATION FINISHED SUCCESSFULLY ===");
}

migrateTaxonomy()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
