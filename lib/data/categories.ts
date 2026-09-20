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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9RLlmd1RH4wni4C7uYNF1CQXf9VpHiewfyJyXq0rYWw&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5w2RDWf2mU_IcDirjnslTJ4m6aPJi2lBeKAwv8q01e_7hXUpnQCIIWwYr&s=10",
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
    image: "https://images.orientbell.com/media/catalog/product//g/o/golden_drift_endless_gloss_600x1200_mm.jpg",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNJ0Sk1jSmapBxUrVmSvUQoxApYHBD7A0LOK6nho4O0g&s=10",
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
    image: "https://www.jkcement.com/wp-content/uploads/2025/11/78.jpg",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx2BF5-Su2S3N7cdSFwwYtv2-pSVoz1icBpc7Lj9-erg&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN08YHKK2bUHAlhoeZ33K7oaq50d9uUGprISveOeHJkQ&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPKOKx7wo05TvUDDxpPJKCzO2wsK093k2GjF94yx_5MA&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD5XYDDF8akC7rrWUzNir-1rSaLrgYGHgHSdAnwbBDVg&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdm_vS-4fKHYxt7Nam11zLkJVRfE70G1UOT39ya68bAA&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6NhkHqSIcWQXTZVvHK0Qzx7tYOSQJDb6k85sxJIQv-w&s=10",
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
    image: "https://5.imimg.com/data5/SELLER/Default/2024/9/452288857/TF/GR/DU/228991454/sanitary-plumbing-services.jpeg",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5ZCTDJvv3k6gTxHnSGRh69Jsty_9JH4iC89O9aqimlA&s",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLPKrpwtEw8BbtEmwVZT3XGzbhqWyJ9BN5NEMIi5Zmew&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKU7OHkdiTIA9bicKkTAeuoQZKAP_XCwp09rpxtq6A0Q&s=10",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6LtVDgqqWU3d8_MLQQErFAB4mD6y7DfDbalvaZ23TmTxnoZgGCrIAy1NB&s=10",
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
    image: "https://m.media-amazon.com/images/I/71AUq34dfvL._AC_UF1000,1000_QL80_.jpg",
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
    image: "https://www.iotics.io/cdn/shop/files/image_42.png?v=1727263318&width=1500",
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
    image: "https://rukmini1.flixcart.com/image/1500/1500/xif0q/smart-door-lock/x/p/k/ozlk01367-ozone-original-imahmx42gfbcgtv5.jpeg?q=70",
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQt79A0WMWgTrfDobxhbDDEjjYe1z7vX7YbJU75qGic43sWPAq1irTAXUc5&s=10",
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
    image: "https://goelworld.com/wp-content/uploads/2025/07/Top-3-Plywood-Grades-for-Building-High-Quality-Furniture-img.webp",
    productCount: 2,
    featured: false,
    parentId: "cat-10",
  },
  {
    id: "cat-sub-adhesives",
    name: "Adhesives, Sealants & Waterproofing",
    slug: "adhesives-sealants-waterproofing",
    description: "Polymer tile adhesive, epoxy grout, sanitary silicone & terrace waterproofing membranes.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2qJjY6yfIuYMwK5pAHRbeqIarh9rZsZy6KIiM-14ETinGwoOmOY8_PmKi&s=10",
    productCount: 0,
    featured: false,
    parentId: "cat-20",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  // Alias support for legacy links
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
