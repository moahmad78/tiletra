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
};

export const categories: Category[] = [
  // ── 1. ELECTRICAL ──────────────────────────────────
  {
    id: "cat-1",
    name: "Electrical",
    slug: "electrical",
    description: "Certified wires, modular switches, MCBs, distribution boards & conduit piping.",
    image: "/images/categories/cat-electrical.jpg",
    productCount: 2,
    featured: true,
    icon: "Zap",
    calculatorType: "none",
  },
  // ── 2. LIGHTING ────────────────────────────────────
  {
    id: "cat-2",
    name: "Lighting",
    slug: "lighting",
    description: "Decorative chandeliers, pendant lights, recessed COB downlights, LED strips & profile lights.",
    image: "/images/categories/cat-lighting.jpg",
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
    image: "/images/categories/cat-tiles-stone.jpg",
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
    image: "/images/categories/cat-paint-finishes.jpg",
    productCount: 0,
    featured: true,
    icon: "Palette",
    calculatorType: "none",
  },
  // ── 5. FALSE CEILING ───────────────────────────────
  {
    id: "cat-5",
    name: "False Ceiling",
    slug: "false-ceiling",
    description: "Gypsum false ceiling boards, POP molding plaster, GI channel grids & acoustic ceiling tiles.",
    image: "/images/categories/cat-false-ceiling.jpg",
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
    image: "/images/categories/cat-flooring.jpg",
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
    image: "/images/categories/cat-doors-windows.jpg",
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
    image: "/images/categories/cat-glass-mirror.jpg",
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
    image: "/images/categories/cat-hardware-fittings.jpg",
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
    image: "/images/categories/cat-furniture.jpg",
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
    image: "/images/categories/cat-kitchen-wardrobe.jpg",
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
    image: "/images/categories/cat-plumbing-sanitary.jpg",
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
    image: "/images/categories/cat-wall-surface.jpg",
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
    image: "/images/categories/cat-decor-accessories.jpg",
    productCount: 0,
    featured: true,
    icon: "Palette",
  },
  // ── 15. CURTAINS & BLINDS ──────────────────────────
  {
    id: "cat-15",
    name: "Curtains & Blinds",
    slug: "curtains-blinds",
    description: "Motorized smart curtain tracks, zebra & roller blinds, blackout fabrics and designer rods.",
    image: "/images/categories/cat-curtains-blinds.jpg",
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
    image: "/images/categories/cat-office-commercial.jpg",
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
    image: "/images/categories/cat-outdoor-landscape.jpg",
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
    image: "/images/categories/cat-smart-home.jpg",
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
    image: "/images/categories/cat-safety-fire.jpg",
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
    image: "/images/categories/cat-tools-consumables.jpg",
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
    image: "/images/categories/cat-plywood.jpg",
    productCount: 2,
    featured: false,
    parentId: "cat-10",
  },
  {
    id: "cat-sub-adhesives",
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
    productCount: 0,
    featured: false,
    parentId: "cat-20",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "floor-tiles" || slug === "granite" || slug === "outdoor-tiles") return categories.find((c) => c.slug === "tiles-stone");
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
