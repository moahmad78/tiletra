/**
 * Unified Unit of Sale definitions and category-based defaults
 * Shared across Admin & Vendor product management forms, storefront PDP,
 * cart calculations, and smart estimators.
 */

export interface UnitOfSaleOption {
  value: string;
  label: string;
  categoryHint?: string;
}

export const UNIT_OF_SALE_OPTIONS: UnitOfSaleOption[] = [
  { value: "box", label: "Box (e.g. Tiles, Flooring, Screws)", categoryHint: "tiles-stone" },
  { value: "piece", label: "Piece / pc (e.g. Sanitaryware, Hardware, Switches)", categoryHint: "electrical" },
  { value: "sqft", label: "Sq.ft / sqft (e.g. Granite, Natural Stone, Slabs)", categoryHint: "granite" },
  { value: "litre", label: "Litre (e.g. Paints, Primers, Chemicals)", categoryHint: "paint-finishes" },
  { value: "meter", label: "Meter (e.g. Pipes, Conduits, Aluminum Profiles)", categoryHint: "plumbing" },
  { value: "coil", label: "Coil (e.g. Electrical Wires, Cables)", categoryHint: "electrical-wires" },
  { value: "kg", label: "Kg / Kilogram (e.g. Adhesives, Grout, Cement)", categoryHint: "adhesives" },
  { value: "pack", label: "Pack (e.g. Screws, Fasteners, Hinges)", categoryHint: "hardware" },
  { value: "roll", label: "Roll (e.g. Waterproofing Membranes, Tape)", categoryHint: "waterproofing" },
  { value: "sheet", label: "Sheet (e.g. Plywood, Laminates, Acrylic)", categoryHint: "plywood-boards" },
  { value: "can", label: "Can / Tin (e.g. Solvents, Thinners, Sprays)", categoryHint: "paints" },
  { value: "bottle", label: "Bottle (e.g. Cleaners, Sealants, Silicones)", categoryHint: "chemicals" },
  { value: "set", label: "Set (e.g. Shower Systems, Locksets, Combo Packs)", categoryHint: "sanitaryware" },
];

/**
 * Returns a sensible default UnitOfSale based on the selected category slug or name
 */
export function getDefaultUnitOfSale(categoryIdentifier?: string | null): string {
  if (!categoryIdentifier) return "piece";
  const id = categoryIdentifier.toLowerCase().trim();

  // Tiles & Stone
  if (id.includes("tile") || id === "tiles-stone" || id === "tiles-granite") {
    return "box";
  }

  // Granite / Natural Stone / Marble
  if (id.includes("granite") || id.includes("marble") || id.includes("stone")) {
    return "sqft";
  }

  // Paints & Wall Finishes
  if (id.includes("paint") || id.includes("finish") || id.includes("emulsion")) {
    return "litre";
  }

  // Electrical Wires & Cables
  if (id.includes("wire") || id.includes("cable") || id === "electrical-wires") {
    return "coil";
  }

  // Plywood & Boards / Laminates
  if (id.includes("plywood") || id.includes("laminate") || id.includes("board") || id === "plywood-boards") {
    return "sheet";
  }

  // Adhesives, Grout, Cement
  if (id.includes("adhesive") || id.includes("grout") || id.includes("cement")) {
    return "kg";
  }

  // Hardware & Fasteners
  if (id.includes("hardware") || id.includes("fastener") || id.includes("screw")) {
    return "pack";
  }

  // Default for general items, modular switches, sanitaryware, plumbing fixtures
  return "piece";
}
