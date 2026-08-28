/**
 * Universal Unit of Sale (UOM) & Packaging Conversion Engine for IntriHub
 * Supports complete building, construction, electrical, and interior product lines.
 */

export type UomCategory = "count" | "packaging" | "length" | "area" | "volume" | "weight";

export interface UnitOfSaleOption {
  value: string;
  label: string;
  shortName: string;
  category: UomCategory;
  defaultBaseUnit?: string;
  supportsDecimals?: boolean;
  categoryHint?: string;
}

export const UNIVERSAL_UOM_OPTIONS: UnitOfSaleOption[] = [
  // ── Packaging Units ──
  { value: "box", label: "Box (e.g. Tiles, Screws, Flooring)", shortName: "Box", category: "packaging", defaultBaseUnit: "sqft" },
  { value: "packet", label: "Packet (e.g. Small Fasteners, Washers)", shortName: "Pkt", category: "packaging", defaultBaseUnit: "piece" },
  { value: "pack", label: "Pack (e.g. Hinges, Handles, Fittings)", shortName: "Pack", category: "packaging", defaultBaseUnit: "piece" },
  { value: "carton", label: "Carton / Master Box (Bulk Supplies)", shortName: "Ctn", category: "packaging", defaultBaseUnit: "piece" },
  { value: "bag", label: "Bag (e.g. Cement, Grout, Wall Putty)", shortName: "Bag", category: "packaging", defaultBaseUnit: "kg" },
  { value: "bucket", label: "Bucket (e.g. Emulsion Paint, Adhesives)", shortName: "Bucket", category: "packaging", defaultBaseUnit: "litre" },
  { value: "can", label: "Can / Tin (e.g. Enamel, Thinners, Primer)", shortName: "Can", category: "packaging", defaultBaseUnit: "litre" },
  { value: "drum", label: "Drum (Bulk Construction Chemicals)", shortName: "Drum", category: "packaging", defaultBaseUnit: "litre" },
  { value: "bottle", label: "Bottle (Cleaners, Sealants)", shortName: "Btl", category: "packaging", defaultBaseUnit: "litre" },
  { value: "tube", label: "Tube (Silicone Sealants, Adhesives)", shortName: "Tube", category: "packaging", defaultBaseUnit: "ml" },
  { value: "bundle", label: "Bundle (Rebar, Conduit Pipes, Timber)", shortName: "Bndl", category: "packaging", defaultBaseUnit: "piece" },
  { value: "roll", label: "Roll (e.g. Wires, Waterproofing, Mesh)", shortName: "Roll", category: "packaging", defaultBaseUnit: "meter" },
  { value: "sheet", label: "Sheet (e.g. Plywood, Laminates, Acrylic)", shortName: "Sheet", category: "packaging", defaultBaseUnit: "sqft" },
  { value: "slab", label: "Slab (e.g. Granite, Marble, Quartz)", shortName: "Slab", category: "packaging", defaultBaseUnit: "sqft" },
  { value: "tile", label: "Tile (Single Individual Tile)", shortName: "Tile", category: "packaging", defaultBaseUnit: "piece" },
  { value: "load", label: "Load / Truckload (Aggregates, Sand)", shortName: "Load", category: "packaging", defaultBaseUnit: "cuft" },

  // ── Count Units ──
  { value: "piece", label: "Piece / pc (e.g. Switches, Sockets, Hardware)", shortName: "pc", category: "count" },
  { value: "set", label: "Set (e.g. Locksets, Faucet Sets)", shortName: "Set", category: "count" },
  { value: "pair", label: "Pair (e.g. Gloves, Bearing Hinges)", shortName: "Pair", category: "count" },
  { value: "dozen", label: "Dozen (12 pcs)", shortName: "Dzn", category: "count" },

  // ── Area Units ──
  { value: "sqft", label: "Sq.Ft / Square Feet (Granite, Stone)", shortName: "sq ft", category: "area", supportsDecimals: true },
  { value: "sqm", label: "Sq.M / Square Meter", shortName: "sq m", category: "area", supportsDecimals: true },

  // ── Length Units ──
  { value: "meter", label: "Meter (Pipes, Profiles, Strips)", shortName: "m", category: "length", supportsDecimals: true },
  { value: "running_meter", label: "Running Meter (r.m.)", shortName: "r.m.", category: "length", supportsDecimals: true },
  { value: "feet", label: "Feet (Timber, Aluminum Channels)", shortName: "ft", category: "length", supportsDecimals: true },
  { value: "coil", label: "Coil (Standard 90m Wire Roll)", shortName: "Coil", category: "length", defaultBaseUnit: "meter" },

  // ── Volume Units ──
  { value: "litre", label: "Litre (Paints, Wood Polish)", shortName: "L", category: "volume", supportsDecimals: true },
  { value: "ml", label: "Millilitre (Hardener, Solvents)", shortName: "ml", category: "volume" },
  { value: "cuft", label: "Cubic Feet (Sand, Stone, Timber)", shortName: "cu ft", category: "volume", supportsDecimals: true },

  // ── Weight Units ──
  { value: "kg", label: "Kilogram / kg (Grout, Tile Adhesive)", shortName: "kg", category: "weight", supportsDecimals: true },
  { value: "gram", label: "Gram (Precision Hardware)", shortName: "g", category: "weight" },
  { value: "ton", label: "Tonne / Ton (Structural Steel, Cement)", shortName: "Ton", category: "weight", supportsDecimals: true },
];

export const UNIT_OF_SALE_OPTIONS = UNIVERSAL_UOM_OPTIONS;

/**
 * Returns recommended Selling Units filtered by category
 */
export function getRecommendedUnitsForCategory(categorySlug?: string | null): UnitOfSaleOption[] {
  if (!categorySlug) return UNIVERSAL_UOM_OPTIONS;
  const slug = categorySlug.toLowerCase().trim();

  if (slug.includes("tile") || slug === "tiles-stone" || slug === "tiles-granite") {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["box", "sqft", "sqm", "piece", "slab"].includes(u.value));
  }

  if (slug.includes("granite") || slug.includes("marble") || slug.includes("stone")) {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["sqft", "slab", "sqm", "piece"].includes(u.value));
  }

  if (slug.includes("plywood") || slug.includes("laminate") || slug.includes("board") || slug === "plywood-boards") {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["sheet", "sqft", "piece", "bundle"].includes(u.value));
  }

  if (slug.includes("wire") || slug.includes("cable") || slug === "electrical-wires") {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["coil", "roll", "meter", "bundle"].includes(u.value));
  }

  if (slug.includes("switch") || slug.includes("electrical") || slug === "electrical") {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["piece", "set", "pack", "box"].includes(u.value));
  }

  if (slug.includes("paint") || slug.includes("finish") || slug.includes("emulsion")) {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["litre", "bucket", "can", "drum", "ml"].includes(u.value));
  }

  if (slug.includes("screw") || slug.includes("hardware") || slug.includes("fastener")) {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["box", "packet", "pack", "piece", "dozen"].includes(u.value));
  }

  if (slug.includes("adhesive") || slug.includes("chemical") || slug.includes("cement") || slug.includes("grout")) {
    return UNIVERSAL_UOM_OPTIONS.filter((u) => ["kg", "bag", "bucket", "can", "tube", "bottle"].includes(u.value));
  }

  return UNIVERSAL_UOM_OPTIONS;
}

/**
 * Returns default UnitOfSale for a category
 */
export function getDefaultUnitOfSale(categoryIdentifier?: string | null): string {
  if (!categoryIdentifier) return "piece";
  const id = categoryIdentifier.toLowerCase().trim();

  if (id.includes("tile") || id === "tiles-stone" || id === "tiles-granite") return "box";
  if (id.includes("granite") || id.includes("marble") || id.includes("stone")) return "sqft";
  if (id.includes("paint") || id.includes("finish") || id.includes("emulsion")) return "litre";
  if (id.includes("wire") || id.includes("cable") || id === "electrical-wires") return "coil";
  if (id.includes("plywood") || id.includes("laminate") || id.includes("board")) return "sheet";
  if (id.includes("adhesive") || id.includes("grout") || id.includes("cement")) return "kg";
  if (id.includes("screw") || id.includes("hardware") || id.includes("fastener")) return "box";

  return "piece";
}

/**
 * Calculates equivalent base unit price (e.g. ₹1350/box with 4.5 sqft/box -> ₹300/sqft)
 */
export function calculateEquivalentUnitPrice(
  sellingPrice: number,
  conversionRatio?: number | null,
  baseUnit?: string | null
): { price: number; formatted: string } | null {
  if (!sellingPrice || !conversionRatio || conversionRatio <= 0) return null;
  const unitPrice = Math.round((sellingPrice / conversionRatio) * 100) / 100;
  const unitLabel = baseUnit ? formatBaseUnitName(baseUnit) : "unit";

  return {
    price: unitPrice,
    formatted: `₹${unitPrice.toLocaleString("en-IN")} / ${unitLabel}`,
  };
}

export function formatBaseUnitName(unit: string): string {
  const lower = unit.toLowerCase().trim();
  switch (lower) {
    case "sqft":
    case "sq.ft":
    case "sq_ft":
      return "Sq Ft";
    case "sqm":
    case "sq.m":
      return "Sq M";
    case "meter":
    case "m":
      return "Meter";
    case "litre":
    case "l":
      return "Litre";
    case "kg":
      return "Kg";
    case "piece":
    case "pc":
      return "Piece";
    case "sheet":
      return "Sheet";
    case "roll":
      return "Roll";
    default:
      return unit.charAt(0).toUpperCase() + unit.slice(1);
  }
}
