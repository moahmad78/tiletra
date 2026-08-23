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
};

export const categories: Category[] = [
  // ── 1. ELECTRICAL ──────────────────────────────────
  {
    id: "cat-1",
    name: "Electrical",
    slug: "electrical",
    description: "Certified wires, modular switches, MCBs, distribution boards & conduit piping.",
    image: "/placeholders/product.svg",
    productCount: 2,
    featured: true,
    icon: "Zap",
    calculatorType: "length_to_units",
  },
  // ── 2. LIGHTING ────────────────────────────────────
  {
    id: "cat-2",
    name: "Lighting",
    slug: "lighting",
    description: "Decorative chandeliers, pendant lights, recessed COB downlights, LED strips & profile lights.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Sun",
    calculatorType: "none",
  },
  // ── 3. TILES & STONE ───────────────────────────────
  {
    id: "cat-3",
    name: "Tiles & Stone",
    slug: "tiles-stone",
    description: "Vitrified tiles, ceramic, Italian marble, polished granite slabs & stone cladding.",
    image: "/placeholders/product.svg",
    productCount: 6,
    featured: true,
    icon: "Grid",
    calculatorType: "area_to_boxes",
  },
  // ── 4. PAINT & FINISHES ────────────────────────────
  {
    id: "cat-4",
    name: "Paint & Finishes",
    slug: "paint-finishes",
    description: "Luxury interior emulsions, exterior weatherproof paints, primers, textures & wood polishes.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Palette",
    calculatorType: "area_to_volume",
  },
  // ── 5. FALSE CEILING ───────────────────────────────
  {
    id: "cat-5",
    name: "False Ceiling",
    slug: "false-ceiling",
    description: "Gypsum false ceiling boards, POP molding plaster, GI channel grids & acoustic ceiling tiles.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Square",
  },
  // ── 6. FLOORING ────────────────────────────────────
  {
    id: "cat-6",
    name: "Flooring",
    slug: "flooring",
    description: "Wooden laminate flooring, SPC/LVP waterproof planks, engineered hardwood & vinyl rolls.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Layers",
  },
  // ── 7. DOORS & WINDOWS ─────────────────────────────
  {
    id: "cat-7",
    name: "Doors & Windows",
    slug: "doors-windows",
    description: "Solid flush doors, UPVC/aluminum window sections, sliding profiles & hardware kits.",
    image: "/placeholders/product.svg",
    productCount: 1,
    featured: true,
    icon: "DoorOpen",
  },
  // ── 8. GLASS & MIRROR ──────────────────────────────
  {
    id: "cat-8",
    name: "Glass & Mirror",
    slug: "glass-mirror",
    description: "Toughened partition glass, LED smart touch vanity mirrors, shower cubicles & glass fittings.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Maximize",
  },
  // ── 9. HARDWARE & FITTINGS ─────────────────────────
  {
    id: "cat-9",
    name: "Hardware & Fittings",
    slug: "hardware-fittings",
    description: "SS 304 screws, soft-close hydraulic hinges, mortise locks, handles & drawer slides.",
    image: "/placeholders/product.svg",
    productCount: 2,
    featured: true,
    icon: "Wrench",
  },
  // ── 10. FURNITURE ──────────────────────────────────
  {
    id: "cat-10",
    name: "Furniture",
    slug: "furniture",
    description: "Living room, dining & bedroom furniture, ergonomic seating, study tables & storage.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Armchair",
  },
  // ── 11. KITCHEN & WARDROBE ─────────────────────────
  {
    id: "cat-11",
    name: "Kitchen & Wardrobe",
    slug: "kitchen-wardrobe",
    description: "Modular kitchen wire baskets, tandem drawer boxes, pantry units & wardrobe organizers.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Package",
  },
  // ── 12. PLUMBING & SANITARY ────────────────────────
  {
    id: "cat-12",
    name: "Plumbing & Sanitary",
    slug: "plumbing-sanitary",
    description: "CPVC/UPVC pipes, brass mixer faucets, washbasins, ceramic water closets & bath fittings.",
    image: "/placeholders/product.svg",
    productCount: 2,
    featured: true,
    icon: "Droplets",
  },
  // ── 13. WALL & SURFACE ─────────────────────────────
  {
    id: "cat-13",
    name: "Wall & Surface",
    slug: "wall-surface",
    description: "Designer non-woven wallpapers, 3D charcoal fluted wall slats, louvers & PVC wall panels.",
    image: "/placeholders/product.svg",
    productCount: 1,
    featured: true,
    icon: "Wallpaper",
  },
  // ── 14. DECOR & ACCESSORIES ────────────────────────
  {
    id: "cat-14",
    name: "Decor & Accessories",
    slug: "decor-accessories",
    description: "Wall art, metal planters, decorative vases, table accents, rugs & ambient interior styling.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Sparkles",
  },
  // ── 15. CURTAINS & BLINDS ──────────────────────────
  {
    id: "cat-15",
    name: "Curtains & Blinds",
    slug: "curtains-blinds",
    description: "Motorized smart curtain tracks, zebra & roller blinds, blackout fabrics and designer rods.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Sliders",
  },
  // ── 16. OFFICE & COMMERCIAL ────────────────────────
  {
    id: "cat-16",
    name: "Office & Commercial",
    slug: "office-commercial",
    description: "Workstations, acoustic desk dividers, office conference tables, reception desks & task chairs.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Building",
  },
  // ── 17. OUTDOOR & LANDSCAPE ────────────────────────
  {
    id: "cat-17",
    name: "Outdoor & Landscape",
    slug: "outdoor-landscape",
    description: "Heavy-duty parking pavers, 35mm UV artificial turf, outdoor composite decking & fencing.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Trees",
  },
  // ── 18. SMART HOME ─────────────────────────────────
  {
    id: "cat-18",
    name: "Smart Home",
    slug: "smart-home",
    description: "Smart touch switches, WiFi curtain motors, voice-controlled ambient lighting & smart hubs.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Cpu",
  },
  // ── 19. SAFETY & FIRE ──────────────────────────────
  {
    id: "cat-19",
    name: "Safety & Fire",
    slug: "safety-fire",
    description: "Smart biometric door locks, HD WiFi CCTV cameras, fire extinguishers & smoke detectors.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "ShieldAlert",
  },
  // ── 20. TOOLS & CONSUMABLES ────────────────────────
  {
    id: "cat-20",
    name: "Tools & Consumables",
    slug: "tools-consumables",
    description: "Power tools, measuring tapes, diamond cutting blades, safety gear, fasteners & site supplies.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: true,
    icon: "Hammer",
  },

  // ── SUBCATEGORIES ──────────────────────────────────
  {
    id: "cat-sub-plywood",
    name: "Plywood & Laminates",
    slug: "plywood",
    description: "BWP marine ply, commercial MR plywood, MDF, HDHMR boards & decorative laminates.",
    image: "/placeholders/product.svg",
    productCount: 2,
    featured: false,
    parentId: "cat-10",
  },
  {
    id: "cat-sub-adhesives",
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "/placeholders/product.svg",
    productCount: 0,
    featured: false,
    parentId: "cat-20",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  // Alias support for legacy links
  if (slug === "floor-tiles" || slug === "granite") return categories.find((c) => c.slug === "tiles-stone");
  if (slug === "plumbing") return categories.find((c) => c.slug === "plumbing-sanitary");
  if (slug === "hardware") return categories.find((c) => c.slug === "hardware-fittings");
  if (slug === "ceiling-pop") return categories.find((c) => c.slug === "false-ceiling");
  if (slug === "aluminum-doors") return categories.find((c) => c.slug === "doors-windows");
  if (slug === "glass-glazing") return categories.find((c) => c.slug === "glass-mirror");
  if (slug === "wallpaper") return categories.find((c) => c.slug === "wall-surface");
  if (slug === "security-safety") return categories.find((c) => c.slug === "safety-fire");
  if (slug === "outdoor-landscaping") return categories.find((c) => c.slug === "outdoor-landscape");
  if (slug === "wall-finishes-paint") return categories.find((c) => c.slug === "paint-finishes");

  return categories.find((c) => c.slug === slug);
}
