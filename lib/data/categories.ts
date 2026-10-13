export type CalculatorType = "none" | "area_to_boxes" | "area_to_volume" | "length_to_units" | string;

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured: boolean;
  icon?: string;
  parentId?: string | null;
  calculatorType?: CalculatorType;
  calculatorInputType?: "area" | "length" | "none";
  attributeSchema?: any;
  children?: any[];
};

export const categories: Category[] = [
  // ── 1. CEMENT & CONCRETE ─────────────────────────────
  {
    id: "cat-cement-concrete",
    name: "Cement & Concrete",
    slug: "cement-concrete",
    description: "OPC/PPC grade cement bags, ready-mix concrete, admixtures, curing compounds & site mixes.",
    image: "/images/categories/cat-cement-concrete.jpg",
    productCount: 4,
    featured: true,
    icon: "Package",
    calculatorType: "none",
  },
  // ── 2. STEEL & REBAR ─────────────────────────────────
  {
    id: "cat-steel-rebar",
    name: "Steel & Rebar",
    slug: "steel-rebar",
    description: "Fe 550D TMT reinforcement bars, MS angles, binding wire, steel mesh & structural beams.",
    image: "/images/categories/cat-steel-rebar.jpg",
    productCount: 2,
    featured: true,
    icon: "Layers",
    calculatorType: "none",
  },
  // ── 3. BRICKS & BLOCKS ───────────────────────────────
  {
    id: "cat-bricks-blocks",
    name: "Bricks & Blocks",
    slug: "bricks-blocks",
    description: "Red kiln-burnt clay bricks, lightweight AAC fly-ash blocks, concrete solid blocks & pavers.",
    image: "/images/categories/cat-bricks-blocks.jpg",
    productCount: 3,
    featured: true,
    icon: "Square",
    calculatorType: "none",
  },
  // ── 4. SAND & AGGREGATES ─────────────────────────────
  {
    id: "cat-sand-aggregates",
    name: "Sand & Aggregates",
    slug: "sand-aggregates",
    description: "Manufactured M-sand, plastering P-sand, 10mm/20mm coarse aggregate gravel & stone dust.",
    image: "/images/categories/cat-sand-aggregates.jpg",
    productCount: 2,
    featured: true,
    icon: "Boxes",
    calculatorType: "none",
  },
  // ── 5. ROOFING & SHEETS ──────────────────────────────
  {
    id: "cat-roofing-sheets",
    name: "Roofing & Sheets",
    slug: "roofing-sheets",
    description: "Color coated profile roofing sheets, galvanized GI corrugated sheets, polycarbonate & FRP panels.",
    image: "/images/categories/cat-roofing-sheets.jpg",
    productCount: 2,
    featured: true,
    icon: "Building",
    calculatorType: "none",
  },
  // ── 6. SITE TOOLS & SAFETY ───────────────────────────
  {
    id: "cat-site-tools-safety",
    name: "Site Tools & Safety",
    slug: "site-tools-safety",
    description: "Construction safety helmets, high-vis vests, steel-toe boots, scaffolding, power tools & mason trowels.",
    image: "/images/categories/cat-tools-consumables.jpg",
    productCount: 3,
    featured: true,
    icon: "ShieldAlert",
    calculatorType: "none",
  },
  // ── 7. TILES & FLOORING ──────────────────────────────
  {
    id: "cat-tiles-flooring",
    name: "Tiles & Flooring",
    slug: "tiles-flooring",
    description: "Vitrified floor tiles, glazed wall tiles, natural marble, polished granite & SPC planks.",
    image: "/images/categories/cat-tiles-stone.jpg",
    productCount: 12,
    featured: true,
    icon: "Grid",
    calculatorType: "none",
  },
  // ── 8. PLYWOOD, LAMINATES & SURFACES ─────────────────
  {
    id: "cat-plywood-laminates-surfaces",
    name: "Plywood, Laminates & Surfaces",
    slug: "plywood-laminates-surfaces",
    description: "BWP marine plywood, commercial MR ply, decorative sunmica laminates, veneers & acrylic sheets.",
    image: "/images/categories/cat-plywood.jpg",
    productCount: 4,
    featured: true,
    icon: "Layers",
    calculatorType: "none",
  },
  // ── 9. HARDWARE & FASTENERS ──────────────────────────
  {
    id: "cat-hardware-fasteners",
    name: "Hardware & Fasteners",
    slug: "hardware-fasteners",
    description: "SS 304 screws, anchor bolts, hydraulic soft-close hinges, drawer channels & precision fasteners.",
    image: "/images/categories/cat-hardware.webp",
    productCount: 5,
    featured: true,
    icon: "Wrench",
    calculatorType: "none",
  },
  // ── 10. LIGHTS & LIGHTING ────────────────────────────
  {
    id: "cat-lights-lighting",
    name: "Lights & Lighting",
    slug: "lights-lighting",
    description: "Architectural recessed COB downlights, LED magnetic tracks, profile strip lights, chandeliers & smart fixtures.",
    image: "/images/categories/cat-lighting.jpg",
    productCount: 6,
    featured: true,
    icon: "Sun",
    calculatorType: "none",
  },
  // ── 11. KITCHEN & WARDROBE FITTINGS ──────────────────
  {
    id: "cat-kitchen-wardrobe-fittings",
    name: "Kitchen & Wardrobe Fittings",
    slug: "kitchen-wardrobe-fittings",
    description: "Modular kitchen tandem drawers, SS wire pull-out baskets, corner carousels & wardrobe organizers.",
    image: "/images/categories/cat-kitchen-wardrobe.jpg",
    productCount: 3,
    featured: true,
    icon: "Package",
    calculatorType: "none",
  },
  // ── 12. PAINTS & FINISHES ────────────────────────────
  {
    id: "cat-paint-finishes",
    name: "Paints & Finishes",
    slug: "paint-finishes",
    description: "Luxury interior emulsions, exterior weatherproof paints, acrylic wall putty, primers & wood coatings.",
    image: "/images/categories/cat-paint-finishes.jpg",
    productCount: 8,
    featured: true,
    icon: "Palette",
    calculatorType: "none",
  },
  // ── 13. GLASS, MIRRORS & PROFILES ────────────────────
  {
    id: "cat-glass-mirrors-profiles",
    name: "Glass, Mirrors & Profiles",
    slug: "glass-mirrors-profiles",
    description: "Toughened architectural partition glass, LED smart touch vanity mirrors, shower enclosures & aluminum glass profiles.",
    image: "/images/categories/cat-glass-mirror.jpg",
    productCount: 4,
    featured: true,
    icon: "Maximize",
    calculatorType: "none",
  },
  // ── 14. CEILING & DRYWALL ────────────────────────────
  {
    id: "cat-ceiling-drywall",
    name: "Ceiling & Drywall",
    slug: "ceiling-drywall",
    description: "Gypsum plasterboards, POP false ceiling molding plaster, GI perimeter channels & acoustic panels.",
    image: "/images/categories/cat-false-ceiling.jpg",
    productCount: 3,
    featured: true,
    icon: "Square",
    calculatorType: "none",
  },
  // ── 15. ELECTRICALS & WIRES ──────────────────────────
  {
    id: "cat-electricals-wires",
    name: "Electricals & Wires",
    slug: "electricals-wires",
    description: "Flame-retardant copper house wires, modular switch plates, MCBs, distribution boards & conduit pipes.",
    image: "/images/categories/cat-electrical.jpg",
    productCount: 5,
    featured: true,
    icon: "Zap",
    calculatorType: "none",
  },
  // ── 16. PLUMBING & TANKS ─────────────────────────────
  {
    id: "cat-plumbing-tanks",
    name: "Plumbing & Tanks",
    slug: "plumbing-tanks",
    description: "CPVC/UPVC water supply pipes, overhead multi-layer water tanks, pressure booster pumps, ball valves & drainage.",
    image: "/images/categories/cat-plumbing.jpg",
    productCount: 6,
    featured: true,
    icon: "Droplets",
    calculatorType: "none",
  },
  // ── 17. SANITARYWARE & BATH ──────────────────────────
  {
    id: "cat-sanitaryware-bath",
    name: "Sanitaryware & Bath",
    slug: "sanitaryware-bath",
    description: "Rimless wall-hung water closets, countertop designer basins, brass diverter mixers, overhead showers & luxury bath fittings.",
    image: "/images/categories/cat-sanitaryware-bath.jpg",
    productCount: 7,
    featured: true,
    icon: "Sparkles",
    calculatorType: "none",
  },
  // ── 18. DOORS, WINDOWS & LOCKS ───────────────────────
  {
    id: "cat-doors-windows-locks",
    name: "Doors, Windows & Locks",
    slug: "doors-windows-locks",
    description: "Flush wood doors, UPVC soundproof sliding windows, smart biometric digital locks & mortise handle sets.",
    image: "/images/categories/cat-doors-windows.jpg",
    productCount: 4,
    featured: true,
    icon: "DoorOpen",
    calculatorType: "none",
  },
  // ── 19. WATERPROOFING & ADHESIVES ────────────────────
  {
    id: "cat-waterproofing-adhesives",
    name: "Waterproofing & Adhesives",
    slug: "waterproofing-adhesives",
    description: "Polymer-modified tile adhesives, epoxy grouts, terrace liquid waterproofing membranes & silicone sealants.",
    image: "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
    productCount: 14,
    featured: true,
    icon: "ShieldAlert",
    calculatorType: "none",
  },
  // ── 20. SOLAR & ENERGY ───────────────────────────────
  {
    id: "cat-solar-energy",
    name: "Solar & Energy",
    slug: "solar-energy",
    description: "High-efficiency monocrystalline solar panels, on-grid/hybrid inverters, lithium solar batteries & mounting kits.",
    image: "/images/categories/cat-solar-energy.jpg",
    productCount: 3,
    featured: true,
    icon: "Sun",
    calculatorType: "none",
  },
  // ── 21. FANS & VENTILATION ───────────────────────────
  {
    id: "cat-fans-ventilation",
    name: "Fans & Ventilation",
    slug: "fans-ventilation",
    description: "BLDC energy-efficient decorative ceiling fans, low-noise exhaust fans, inline duct fans & ventilation louvers.",
    image: "/images/categories/cat-fans-ventilation.jpg",
    productCount: 4,
    featured: true,
    icon: "Wind",
    calculatorType: "none",
  },
  // ── 22. HOME DECOR ───────────────────────────────────
  {
    id: "cat-home-decor",
    name: "Home Decor",
    slug: "home-decor",
    description: "Luxury wall art, metal planter stands, ambient decorative lighting, floor rugs & curated interior styling pieces.",
    image: "/images/categories/cat-decor-accessories.jpg",
    productCount: 5,
    featured: true,
    icon: "Palette",
    calculatorType: "none",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "floor-tiles" || slug === "tiles-stone" || slug === "granite" || slug === "flooring") {
    return categories.find((c) => c.slug === "tiles-flooring");
  }
  if (slug === "electrical") {
    return categories.find((c) => c.slug === "electricals-wires");
  }
  if (slug === "lighting") {
    return categories.find((c) => c.slug === "lights-lighting");
  }
  if (slug === "plumbing") {
    return categories.find((c) => c.slug === "plumbing-tanks");
  }
  if (slug === "plumbing-sanitary") {
    return categories.find((c) => c.slug === "sanitaryware-bath");
  }
  if (slug === "hardware" || slug === "hardware-fittings") {
    return categories.find((c) => c.slug === "hardware-fasteners");
  }
  if (slug === "ceiling-pop" || slug === "false-ceiling") {
    return categories.find((c) => c.slug === "ceiling-drywall");
  }
  if (slug === "doors-windows" || slug === "aluminum-doors") {
    return categories.find((c) => c.slug === "doors-windows-locks");
  }
  if (slug === "glass-mirror" || slug === "glass-glazing") {
    return categories.find((c) => c.slug === "glass-mirrors-profiles");
  }
  if (slug === "plywood" || slug === "wall-surface" || slug === "wallpaper") {
    return categories.find((c) => c.slug === "plywood-laminates-surfaces");
  }
  if (slug === "adhesives-sealants-waterproofing") {
    return categories.find((c) => c.slug === "waterproofing-adhesives");
  }
  if (slug === "kitchen-wardrobe") {
    return categories.find((c) => c.slug === "kitchen-wardrobe-fittings");
  }
  if (slug === "decor-accessories" || slug === "curtains-blinds") {
    return categories.find((c) => c.slug === "home-decor");
  }
  if (slug === "tools-consumables" || slug === "safety-fire") {
    return categories.find((c) => c.slug === "site-tools-safety");
  }

  return categories.find((c) => c.slug === slug);
}
