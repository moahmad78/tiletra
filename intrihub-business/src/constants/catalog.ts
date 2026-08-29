/**
 * Intrihub Master Catalog Presets: Units, Colours, Dimensions, Finishes & Materials
 * Synchronized with Database & Multi-Category Storefront
 */

export interface CatalogColour {
  name: string;
  hexCode: string;
  textColor: "light" | "dark";
  categoryHint?: string;
}

export const CATALOG_COLOURS: CatalogColour[] = [
  { name: "White", hexCode: "#FFFFFF", textColor: "dark", categoryHint: "all" },
  { name: "Off White / Ivory", hexCode: "#FAF9F6", textColor: "dark", categoryHint: "paints" },
  { name: "Cream", hexCode: "#FFFDD0", textColor: "dark", categoryHint: "paints" },
  { name: "Beige", hexCode: "#F5F5DC", textColor: "dark", categoryHint: "tiles-stone" },
  { name: "Light Grey", hexCode: "#D3D3D3", textColor: "dark", categoryHint: "all" },
  { name: "Grey", hexCode: "#808080", textColor: "light", categoryHint: "all" },
  { name: "Dark Grey / Charcoal", hexCode: "#4A4A4A", textColor: "light", categoryHint: "all" },
  { name: "Black", hexCode: "#1A1A1A", textColor: "light", categoryHint: "all" },
  { name: "Silver / Chrome", hexCode: "#C0C0C0", textColor: "dark", categoryHint: "hardware" },
  { name: "Gold", hexCode: "#D4AF37", textColor: "dark", categoryHint: "hardware" },
  { name: "Rose Gold", hexCode: "#B76E79", textColor: "light", categoryHint: "hardware" },
  { name: "Antique Brass / Bronze", hexCode: "#CD7F32", textColor: "light", categoryHint: "hardware" },
  { name: "Brown", hexCode: "#8B4513", textColor: "light", categoryHint: "plywood-boards" },
  { name: "Dark Brown / Walnut", hexCode: "#4A2E18", textColor: "light", categoryHint: "plywood-boards" },
  { name: "Natural Wood / Teak", hexCode: "#C19A6B", textColor: "dark", categoryHint: "plywood-boards" },
  { name: "Light Blue", hexCode: "#ADD8E6", textColor: "dark", categoryHint: "paints" },
  { name: "Blue", hexCode: "#0055FF", textColor: "light", categoryHint: "all" },
  { name: "Navy Blue", hexCode: "#001F5B", textColor: "light", categoryHint: "all" },
  { name: "Green", hexCode: "#10B981", textColor: "light", categoryHint: "all" },
  { name: "Dark Green", hexCode: "#1E3F20", textColor: "light", categoryHint: "all" },
  { name: "Yellow", hexCode: "#FBBF24", textColor: "dark", categoryHint: "paints" },
  { name: "Orange", hexCode: "#F97316", textColor: "light", categoryHint: "all" },
  { name: "Red", hexCode: "#EF4444", textColor: "light", categoryHint: "all" },
  { name: "Maroon", hexCode: "#800000", textColor: "light", categoryHint: "paints" },
  { name: "Pink", hexCode: "#EC4899", textColor: "light", categoryHint: "paints" },
  { name: "Purple", hexCode: "#8B5CF6", textColor: "light", categoryHint: "paints" },
  { name: "Transparent / Clear", hexCode: "#E2E8F0", textColor: "dark", categoryHint: "chemicals" },
  { name: "Multicolour", hexCode: "#6366F1", textColor: "light", categoryHint: "all" },
];

export interface CatalogGradient {
  name: string;
  colors: [string, string];
  categoryHint?: string;
}

export const CATALOG_GRADIENTS: CatalogGradient[] = [
  { name: "Black & Gold Vein", colors: ["#111827", "#EAB308"], categoryHint: "tiles-stone" },
  { name: "White & Grey Carrara", colors: ["#FFFFFF", "#94A3B8"], categoryHint: "tiles-stone" },
  { name: "Beige & Warm Gold", colors: ["#F5F5DC", "#D4AF37"], categoryHint: "tiles-stone" },
  { name: "Emerald & Gold", colors: ["#065F46", "#F59E0B"], categoryHint: "tiles-stone" },
  { name: "Royal Blue & Silver", colors: ["#1E3A8A", "#CBD5E1"], categoryHint: "tiles-stone" },
  { name: "Rose Gold & Pearl", colors: ["#B76E79", "#FFF7ED"], categoryHint: "hardware" },
  { name: "Charcoal & Copper", colors: ["#334155", "#C2410C"], categoryHint: "hardware" },
  { name: "Walnut & Bronze", colors: ["#451A03", "#CD7F32"], categoryHint: "plywood-boards" },
  { name: "Teak & Honey Amber", colors: ["#78350F", "#D97706"], categoryHint: "plywood-boards" },
  { name: "Ocean Teal & White", colors: ["#0F766E", "#F0FDFA"], categoryHint: "paints" },
  { name: "Sunset Crimson & Amber", colors: ["#DC2626", "#F59E0B"], categoryHint: "paints" },
  { name: "Olive Moss & Sand", colors: ["#3F6212", "#FEF08A"], categoryHint: "paints" },
  { name: "Slate Grey & Sky Blue", colors: ["#475569", "#38BDF8"], categoryHint: "all" },
  { name: "Midnight Onyx & Platinum", colors: ["#020617", "#E2E8F0"], categoryHint: "all" },
  { name: "Terracotta & Ivory", colors: ["#9A3412", "#FEFCE8"], categoryHint: "tiles-stone" },
  { name: "Champagne & Gold", colors: ["#FEF3C7", "#D4AF37"], categoryHint: "hardware" },
];

export const SPECTRUM_COLORS: string[][] = [
  ["#FF4D4F", "#F5222D", "#CF1322", "#A8071A", "#820014", "#5C0011"],
  ["#FFA940", "#FA8C16", "#D46B08", "#AD4E00", "#873800", "#612500"],
  ["#FFEC3D", "#FADB14", "#D4B106", "#AD8B00", "#876800", "#614700"],
  ["#73D13D", "#52C41A", "#389E0D", "#237804", "#135200", "#092B00"],
  ["#36CFC9", "#13C2C2", "#08979C", "#006D75", "#00474F", "#002329"],
  ["#4096FF", "#1677FF", "#0958D9", "#003EB3", "#002C8C", "#001D66"],
  ["#9254DE", "#722ED1", "#531DAB", "#391085", "#22075E", "#120338"],
  ["#F759AB", "#EB2F96", "#C41D7F", "#9E1068", "#780650", "#520337"],
  ["#FFFFFF", "#F5F5DC", "#D4AF37", "#8B4513", "#4A4A4A", "#111827"],
];

export const CATALOG_UNITS = [
  "box",
  "sqft",
  "piece",
  "kg",
  "meter",
  "coil",
  "pack",
  "roll",
  "litre",
  "can",
  "sheet",
  "slab",
  "bucket",
  "drum",
  "bottle",
  "tube",
  "bag",
  "bundle",
  "set",
  "carton",
  "packet",
  "dozen",
  "ton",
];

export const CATALOG_DIMENSIONS = [
  // Tiles & Slabs
  "600x600 mm (2x2 ft)",
  "600x1200 mm (2x4 ft)",
  "800x1600 mm (2.6x5.2 ft)",
  "300x450 mm (1x1.5 ft)",
  "300x600 mm (1x2 ft)",
  "1200x1800 mm (4x6 ft)",
  "800x800 mm",
  "1200x2400 mm",
  "100x100 mm",
  "200x200 mm",
  "150x600 mm (Plank)",
  "150x900 mm (Wood Plank)",
  // Plywood & Sheet Boards
  "8x4 ft x 6mm",
  "8x4 ft x 9mm",
  "8x4 ft x 12mm",
  "8x4 ft x 16mm",
  "8x4 ft x 18mm",
  "8x4 ft x 19mm",
  "7x4 ft",
  "7x3 ft",
  // Electrical & Wires
  "90 m (Coil)",
  "180 m (Coil)",
  "1.0 sq mm",
  "1.5 sq mm",
  "2.5 sq mm",
  "4.0 sq mm",
  "6.0 sq mm",
  "10.0 sq mm",
  // Plumbing & Pipes
  "3 m (Pipe)",
  "6 m (Pipe)",
  "0.5 inch (15mm)",
  "0.75 inch (20mm)",
  "1.0 inch (25mm)",
  "1.25 inch (32mm)",
  "1.5 inch (40mm)",
  "2.0 inch (50mm)",
  "3.0 inch (75mm)",
  "4.0 inch (110mm)",
  // Volume & Packaging Weights
  "200 ml",
  "500 ml",
  "1 Litre",
  "4 Litre",
  "10 Litre",
  "20 Litre (Bucket)",
  "1 kg",
  "5 kg",
  "20 kg (Bag)",
  "50 kg (Bag)",
  "Custom Size",
];

export const CATALOG_FINISHES = [
  "Glossy",
  "Matt / Matte",
  "High Gloss",
  "Carving",
  "Satin",
  "Rustic",
  "Polished",
  "Wood Finish",
  "Marble Look",
  "Stone Texture",
  "Metallic",
  "Sugar Finish",
  "Lappato",
  "Full Body Vitrified",
  "Anti-Skid",
  "Smooth",
  "Semi-Gloss",
  "Eggshell",
];

export const CATALOG_MATERIALS = [
  "Glazed Vitrified (GVT)",
  "Polished Vitrified (PVT)",
  "Double Charge",
  "Ceramic",
  "Porcelain",
  "Natural Marble",
  "Granite",
  "Quartz",
  "Brass",
  "Stainless Steel (SS 304)",
  "CPVC / UPVC",
  "Copper",
  "Solid Wood",
  "Commercial Ply (MR)",
  "Waterproof Ply (BWP / BWR)",
  "MDF / HDF",
  "Acrylic",
  "Aluminum",
  "Standard Construction",
];

export function resolveColorHex(colorName: string): string {
  if (!colorName) return "#64748B";
  const trimmed = colorName.trim();
  if (trimmed.startsWith("#") && (trimmed.length === 4 || trimmed.length === 7)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();

  // Match in CATALOG_COLOURS
  const found = CATALOG_COLOURS.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      lower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(lower)
  );
  if (found) return found.hexCode;

  // Extended color dictionary
  const EXTENDED_MAP: Record<string, string> = {
    white: "#FFFFFF",
    ivory: "#FFFFF0",
    cream: "#FFFDD0",
    beige: "#F5F5DC",
    grey: "#808080",
    gray: "#808080",
    charcoal: "#36454F",
    black: "#1A1A1A",
    silver: "#C0C0C0",
    chrome: "#E8E8E8",
    gold: "#FFD700",
    golden: "#DAA520",
    bronze: "#CD7F32",
    copper: "#B87333",
    brass: "#B5A642",
    brown: "#8B4513",
    walnut: "#5C4033",
    teak: "#B38B6D",
    oak: "#DEB887",
    mahogany: "#C04000",
    wood: "#C19A6B",
    blue: "#2563EB",
    navy: "#000080",
    sky: "#87CEEB",
    cyan: "#00FFFF",
    teal: "#008080",
    turquoise: "#40E0D0",
    green: "#16A34A",
    emerald: "#50C878",
    olive: "#808000",
    lime: "#32CD32",
    mint: "#98FF98",
    forest: "#228B22",
    yellow: "#FACC15",
    lemon: "#FFF44F",
    mustard: "#FFDB58",
    amber: "#FFBF00",
    orange: "#EA580C",
    peach: "#FFE5B4",
    coral: "#FF7F50",
    terracotta: "#E2725B",
    rust: "#B7410E",
    red: "#DC2626",
    crimson: "#DC143C",
    ruby: "#E0115F",
    maroon: "#800000",
    burgundy: "#800020",
    wine: "#722F37",
    pink: "#EC4899",
    rose: "#FF007F",
    magenta: "#FF00FF",
    purple: "#9333EA",
    violet: "#8F00FF",
    lavender: "#E6E6FA",
    indigo: "#4B0082",
    clear: "#E2E8F0",
    transparent: "#CBD5E1",
    multi: "#6366F1",
    multicolor: "#6366F1",
    multicolour: "#6366F1",
  };

  for (const [key, hex] of Object.entries(EXTENDED_MAP)) {
    if (lower.includes(key)) return hex;
  }

  // Consistent fallback hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}
