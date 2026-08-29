/**
 * Master List of Logistics & Courier Delivery Partners for Construction & Tile Shipments
 * Synchronized across Vendor & Super Admin consoles.
 */

export interface CourierOption {
  id: string;
  name: string;
  category: "heavy_freight" | "express" | "local" | "self";
  tag: string;
  badgeColor: string;
}

export const COURIER_PARTNERS: CourierOption[] = [
  {
    id: "vrl",
    name: "VRL Logistics (Heavy Freight)",
    category: "heavy_freight",
    tag: "Tiles / Pallets",
    badgeColor: "#1E3A8A",
  },
  {
    id: "delhivery",
    name: "Delhivery Surface / Express",
    category: "express",
    tag: "Pan-India Surface",
    badgeColor: "#EA580C",
  },
  {
    id: "safexpress",
    name: "SafeXpress 3PL Cargo",
    category: "heavy_freight",
    tag: "Bulk Tile Crates",
    badgeColor: "#059669",
  },
  {
    id: "tci",
    name: "TCI Express Freight",
    category: "heavy_freight",
    tag: "Commercial Freight",
    badgeColor: "#7C3AED",
  },
  {
    id: "bluedart",
    name: "Blue Dart Express",
    category: "express",
    tag: "Air & Surface",
    badgeColor: "#2563EB",
  },
  {
    id: "dtdc",
    name: "DTDC Express Cargo",
    category: "express",
    tag: "Live Tracking",
    badgeColor: "#DC2626",
  },
  {
    id: "gati",
    name: "GATI KWE Surface",
    category: "heavy_freight",
    tag: "Industrial Logistics",
    badgeColor: "#D97706",
  },
  {
    id: "xpressbees",
    name: "Xpressbees Cargo",
    category: "express",
    tag: "Surface Express",
    badgeColor: "#475569",
  },
  {
    id: "shadowfax",
    name: "Shadowfax Logistics",
    category: "express",
    tag: "Quick Pickup",
    badgeColor: "#0284C7",
  },
  {
    id: "porter",
    name: "Porter / Local Mini Truck (Tata Ace)",
    category: "local",
    tag: "Intracity Direct",
    badgeColor: "#0D9488",
  },
  {
    id: "self_vehicle",
    name: "Store Vehicle / Own Delivery Truck",
    category: "self",
    tag: "Direct Store Dispatch",
    badgeColor: "#16A34A",
  },
  {
    id: "other_transport",
    name: "Other Private Transport / Local Courier",
    category: "local",
    tag: "Custom LR / Transport",
    badgeColor: "#64748B",
  },
];
