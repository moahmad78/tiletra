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
    image: "/placeholders/product.svg",
    icon: "Zap",
  },
  {
    name: "Lighting",
    slug: "lighting",
    order: 2,
    description: "Decorative chandeliers, pendant lights, recessed COB downlights, LED strips & profile lights.",
    image: "/placeholders/product.svg",
    icon: "Sun",
  },
  {
    name: "Tiles & Stone",
    slug: "tiles-stone",
    order: 3,
    description: "Vitrified tiles, ceramic, Italian marble, polished granite slabs & stone cladding.",
    image: "/placeholders/product.svg",
    icon: "Grid",
  },
  {
    name: "Paint & Finishes",
    slug: "paint-finishes",
    order: 4,
    description: "Luxury interior emulsions, exterior weatherproof paints, primers, textures & wood polishes.",
    image: "/placeholders/product.svg",
    icon: "Palette",
  },
  {
    name: "False Ceiling",
    slug: "false-ceiling",
    order: 5,
    description: "Gypsum false ceiling boards, POP molding plaster, GI channel grids & acoustic ceiling tiles.",
    image: "/placeholders/product.svg",
    icon: "Square",
  },
  {
    name: "Flooring",
    slug: "flooring",
    order: 6,
    description: "Wooden laminate flooring, SPC/LVP waterproof planks, engineered hardwood & vinyl rolls.",
    image: "/placeholders/product.svg",
    icon: "Layers",
  },
  {
    name: "Doors & Windows",
    slug: "doors-windows",
    order: 7,
    description: "Solid flush doors, UPVC/aluminum window sections, sliding profiles & hardware kits.",
    image: "/placeholders/product.svg",
    icon: "DoorOpen",
  },
  {
    name: "Glass & Mirror",
    slug: "glass-mirror",
    order: 8,
    description: "Toughened partition glass, LED smart touch vanity mirrors, shower cubicles & glass fittings.",
    image: "/placeholders/product.svg",
    icon: "Maximize",
  },
  {
    name: "Hardware & Fittings",
    slug: "hardware-fittings",
    order: 9,
    description: "SS 304 screws, soft-close hydraulic hinges, mortise locks, handles & drawer slides.",
    image: "/placeholders/product.svg",
    icon: "Wrench",
  },
  {
    name: "Furniture",
    slug: "furniture",
    order: 10,
    description: "Living room, dining & bedroom furniture, ergonomic seating, study tables & storage.",
    image: "/placeholders/product.svg",
    icon: "Armchair",
  },
  {
    name: "Kitchen & Wardrobe",
    slug: "kitchen-wardrobe",
    order: 11,
    description: "Modular kitchen wire baskets, tandem drawer boxes, pantry units & wardrobe organizers.",
    image: "/placeholders/product.svg",
    icon: "Package",
  },
  {
    name: "Plumbing & Sanitary",
    slug: "plumbing-sanitary",
    order: 12,
    description: "CPVC/UPVC pipes, brass mixer faucets, washbasins, ceramic water closets & bath fittings.",
    image: "/placeholders/product.svg",
    icon: "Droplets",
  },
  {
    name: "Wall & Surface",
    slug: "wall-surface",
    order: 13,
    description: "Designer non-woven wallpapers, 3D charcoal fluted wall slats, louvers & PVC wall panels.",
    image: "/placeholders/product.svg",
    icon: "Wallpaper",
  },
  {
    name: "Decor & Accessories",
    slug: "decor-accessories",
    order: 14,
    description: "Wall art, metal planters, decorative vases, table accents, rugs & ambient interior styling.",
    image: "/placeholders/product.svg",
    icon: "Sparkles",
  },
  {
    name: "Curtains & Blinds",
    slug: "curtains-blinds",
    order: 15,
    description: "Motorized smart curtain tracks, zebra & roller blinds, blackout fabrics and designer rods.",
    image: "/placeholders/product.svg",
    icon: "Sliders",
  },
  {
    name: "Office & Commercial",
    slug: "office-commercial",
    order: 16,
    description: "Workstations, acoustic desk dividers, office conference tables, reception desks & task chairs.",
    image: "/placeholders/product.svg",
    icon: "Building",
  },
  {
    name: "Outdoor & Landscape",
    slug: "outdoor-landscape",
    order: 17,
    description: "Heavy-duty parking pavers, 35mm UV artificial turf, outdoor composite decking & fencing.",
    image: "/placeholders/product.svg",
    icon: "Trees",
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    order: 18,
    description: "Smart touch switches, WiFi curtain motors, voice-controlled ambient lighting & smart hubs.",
    image: "/placeholders/product.svg",
    icon: "Cpu",
  },
  {
    name: "Safety & Fire",
    slug: "safety-fire",
    order: 19,
    description: "Smart biometric door locks, HD WiFi CCTV cameras, fire extinguishers & smoke detectors.",
    image: "/placeholders/product.svg",
    icon: "ShieldAlert",
  },
  {
    name: "Tools & Consumables",
    slug: "tools-consumables",
    order: 20,
    description: "Power tools, measuring tapes, diamond cutting blades, safety gear, fasteners & site supplies.",
    image: "/placeholders/product.svg",
    icon: "Hammer",
  },
  // Subcategories
  {
    name: "Plywood & Laminates",
    slug: "plywood",
    order: 21,
    description: "BWP marine ply, commercial MR plywood, MDF, HDHMR boards & decorative laminates.",
    image: "/placeholders/product.svg",
    icon: "Layers",
    parentSlug: "furniture",
  },
  {
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    order: 22,
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "/placeholders/product.svg",
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
