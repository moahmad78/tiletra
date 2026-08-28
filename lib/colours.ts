/**
 * Universal Colour & Texture Swatch Platform for IntriHub
 * Supports standard construction colours, hex codes, secondary accents,
 * and texture swatches for stone, marble, wood, granite, and tiles.
 */

export interface ManagedColour {
  name: string;
  hexCode: string;
  secondaryHex?: string;
  categoryHint?: string;
  isTexture?: boolean;
  swatchImage?: string;
  textColor: string; // "light" | "dark" for contrast badge rendering
}

export const MANAGED_COLOURS: ManagedColour[] = [
  { name: "White", hexCode: "#FFFFFF", textColor: "dark", categoryHint: "all" },
  { name: "Off White / Ivory", hexCode: "#FAF9F6", textColor: "dark", categoryHint: "paints" },
  { name: "Cream", hexCode: "#FFFDD0", textColor: "dark", categoryHint: "paints" },
  { name: "Beige", hexCode: "#F5F5DC", textColor: "dark", categoryHint: "tiles-stone" },
  { name: "Light Grey", hexCode: "#D3D3D3", textColor: "dark", categoryHint: "all" },
  { name: "Grey", hexCode: "#808080", textColor: "light", categoryHint: "all" },
  { name: "Dark Grey", hexCode: "#4A4A4A", textColor: "light", categoryHint: "all" },
  { name: "Black", hexCode: "#1A1A1A", textColor: "light", categoryHint: "all" },
  { name: "Silver", hexCode: "#C0C0C0", textColor: "dark", categoryHint: "hardware" },
  { name: "Gold", hexCode: "#D4AF37", textColor: "dark", categoryHint: "hardware" },
  { name: "Rose Gold", hexCode: "#B76E79", textColor: "light", categoryHint: "hardware" },
  { name: "Antique Brass", hexCode: "#CD7F32", textColor: "light", categoryHint: "hardware" },
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
  { name: "Transparent / Clear", hexCode: "#E2E8F0", secondaryHex: "#FFFFFF", textColor: "dark", categoryHint: "chemicals" },
  { name: "Multicolour", hexCode: "#6366F1", secondaryHex: "#EC4899", textColor: "light", categoryHint: "all" },
];

/**
 * Normalizes colour name and resolves its Hex code and display properties
 */
export function resolveColour(colorName?: string | null): {
  name: string;
  hexCode: string;
  textColor: string;
  isStandard: boolean;
} {
  if (!colorName || typeof colorName !== "string") {
    return { name: "Standard", hexCode: "#808080", textColor: "light", isStandard: false };
  }

  const clean = colorName.trim();
  const lower = clean.toLowerCase();

  const found = MANAGED_COLOURS.find(
    (c) => c.name.toLowerCase() === lower || c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
  );

  if (found) {
    return {
      name: found.name,
      hexCode: found.hexCode,
      textColor: found.textColor,
      isStandard: true,
    };
  }

  // Fallbacks for common custom names
  if (lower.includes("white") || lower.includes("ivory") || lower.includes("pearl")) {
    return { name: clean, hexCode: "#F8F9FA", textColor: "dark", isStandard: false };
  }
  if (lower.includes("black") || lower.includes("galaxy") || lower.includes("nero")) {
    return { name: clean, hexCode: "#18181B", textColor: "light", isStandard: false };
  }
  if (lower.includes("grey") || lower.includes("gray") || lower.includes("steel") || lower.includes("ash")) {
    return { name: clean, hexCode: "#71717A", textColor: "light", isStandard: false };
  }
  if (lower.includes("gold") || lower.includes("brass") || lower.includes("bronze")) {
    return { name: clean, hexCode: "#D4AF37", textColor: "dark", isStandard: false };
  }
  if (lower.includes("wood") || lower.includes("teak") || lower.includes("oak") || lower.includes("walnut") || lower.includes("brown")) {
    return { name: clean, hexCode: "#8B5A2B", textColor: "light", isStandard: false };
  }
  if (lower.includes("blue")) {
    return { name: clean, hexCode: "#2563EB", textColor: "light", isStandard: false };
  }
  if (lower.includes("green")) {
    return { name: clean, hexCode: "#16A34A", textColor: "light", isStandard: false };
  }
  if (lower.includes("red")) {
    return { name: clean, hexCode: "#DC2626", textColor: "light", isStandard: false };
  }
  if (lower.includes("yellow")) {
    return { name: clean, hexCode: "#EAB308", textColor: "dark", isStandard: false };
  }

  return { name: clean, hexCode: "#A1A1AA", textColor: "dark", isStandard: false };
}
