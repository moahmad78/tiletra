/**
 * Mobile colour and swatch resolver
 */

export const MOBILE_MANAGED_COLOURS: Record<string, string> = {
  white: "#FFFFFF",
  "off white": "#FAF9F6",
  ivory: "#FFFFF0",
  cream: "#FFFDD0",
  beige: "#F5F5DC",
  grey: "#808080",
  gray: "#808080",
  "light grey": "#D3D3D3",
  "dark grey": "#4A4A4A",
  black: "#1A1A1A",
  silver: "#C0C0C0",
  gold: "#D4AF37",
  "rose gold": "#B76E79",
  brown: "#8B4513",
  walnut: "#4A2E18",
  teak: "#C19A6B",
  blue: "#2563EB",
  "navy blue": "#001F5B",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#FBBF24",
  orange: "#F97316",
  standard: "#CBD5E1",
};

export function resolveMobileColour(name?: string | null, customHex?: string | null): { hex: string; isLight: boolean } {
  if (customHex && customHex.startsWith("#")) {
    const isLight = ["#ffffff", "#fff", "#faf9f6", "#fffff0", "#fffdd0", "#f5f5dc", "#d3d3d3", "#fbbf24"].includes(customHex.toLowerCase());
    return { hex: customHex, isLight };
  }

  if (!name) return { hex: "#CBD5E1", isLight: true };
  const lower = name.toLowerCase().trim();

  for (const [key, hex] of Object.entries(MOBILE_MANAGED_COLOURS)) {
    if (lower.includes(key) || key.includes(lower)) {
      const isLight = ["white", "off white", "ivory", "cream", "beige", "light grey", "yellow"].includes(key);
      return { hex, isLight };
    }
  }

  return { hex: "#94A3B8", isLight: true };
}
