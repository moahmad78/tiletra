"use client";

import React from "react";
import {
  Zap,
  Lightbulb,
  LayoutGrid,
  Paintbrush,
  PanelTop,
  Layers,
  DoorOpen,
  DoorClosed,
  Sparkles,
  Wrench,
  Armchair,
  UtensilsCrossed,
  Droplets,
  Wallpaper,
  Palette,
  Blinds,
  Building2,
  Trees,
  Cpu,
  ShieldAlert,
  Hammer,
  Boxes,
  ShieldCheck,
  Gem,
  Brush,
  Nut,
  Pipette,
  Sun,
  Flame,
  Maximize,
  Package,
  LucideProps,
} from "lucide-react";

export interface CategoryIconProps extends LucideProps {
  slugOrName: string;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // Slugs & normalized names
  electrical: Zap,
  lighting: Lightbulb,
  "tiles-stone": LayoutGrid,
  "floor-tiles": LayoutGrid,
  granite: Gem,
  "paint-finishes": Paintbrush,
  "false-ceiling": PanelTop,
  flooring: Layers,
  "doors-windows": DoorOpen,
  "aluminum-doors": DoorClosed,
  "glass-mirror": Sparkles,
  "hardware-fittings": Wrench,
  hardware: Nut,
  furniture: Armchair,
  "kitchen-wardrobe": UtensilsCrossed,
  "plumbing-sanitary": Droplets,
  plumbing: Pipette,
  "wall-surface": Brush,
  wallpaper: Wallpaper,
  "decor-accessories": Palette,
  "curtains-blinds": Blinds,
  "office-commercial": Building2,
  "outdoor-landscape": Trees,
  "smart-home": Cpu,
  "safety-fire": Flame,
  "tools-consumables": Hammer,
  plywood: Boxes,
  "adhesives-sealants-waterproofing": ShieldCheck,

  // Direct icon field names in DB
  zap: Zap,
  sun: Sun,
  grid: LayoutGrid,
  palette: Palette,
  layers: Layers,
  square: PanelTop,
  dooropen: DoorOpen,
  sparkles: Sparkles,
  maximize: Maximize,
  wrench: Wrench,
  armchair: Armchair,
  package: Package,
  droplets: Droplets,
  building: Building2,
  trees: Trees,
  cpu: Cpu,
  shieldalert: ShieldAlert,
  hammer: Hammer,
  shield: ShieldCheck,
};

export function CategoryIcon({ slugOrName, size = 20, className = "", ...props }: CategoryIconProps) {
  const normalizedKey = (slugOrName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]/g, "");

  const Component = ICON_MAP[normalizedKey] || LayoutGrid;

  return <Component size={size} className={className} {...props} />;
}
