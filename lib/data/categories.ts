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
};

export const categories: Category[] = [
  // ── 1. ELECTRICAL ──────────────────────────────────
  {
    id: "cat-1",
    name: "Electrical",
    slug: "electrical",
    description: "Certified wires, modular switches, MCBs, distribution boards & conduit piping.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    productCount: 2,
    featured: true,
    icon: "Zap",
  },
  // ── 2. LIGHTING ────────────────────────────────────
  {
    id: "cat-2",
    name: "Lighting",
    slug: "lighting",
    description: "Decorative chandeliers, pendant lights, recessed COB downlights, LED strips & profile lights.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    productCount: 0,
    featured: true,
    icon: "Sun",
  },
  // ── 3. TILES & STONE ───────────────────────────────
  {
    id: "cat-3",
    name: "Tiles & Stone",
    slug: "tiles-stone",
    description: "Vitrified tiles, ceramic, Italian marble, polished granite slabs & stone cladding.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    productCount: 6,
    featured: true,
    icon: "Grid",
  },
  // ── 4. PAINT & FINISHES ────────────────────────────
  {
    id: "cat-4",
    name: "Paint & Finishes",
    slug: "paint-finishes",
    description: "Luxury interior emulsions, exterior weatherproof paints, primers, textures & wood polishes.",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    productCount: 0,
    featured: true,
    icon: "Palette",
  },
  // ── 5. FALSE CEILING ───────────────────────────────
  {
    id: "cat-5",
    name: "False Ceiling",
    slug: "false-ceiling",
    description: "Gypsum false ceiling boards, POP molding plaster, GI channel grids & acoustic ceiling tiles.",
    image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
    productCount: 2,
    featured: false,
    parentId: "cat-10",
  },
  {
    id: "cat-sub-adhesives",
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
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
