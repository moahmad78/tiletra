"use client";

import React from "react";
import {
  Zap,
  Lightbulb,
  LayoutGrid,
  Paintbrush,
  Square,
  Layers,
  DoorOpen,
  Sparkles,
  Wrench,
  Armchair,
  UtensilsCrossed,
  Droplets,
  Wallpaper,
  Palette,
  Sliders,
  Building2,
  Trees,
  Cpu,
  ShieldAlert,
  Hammer,
  Boxes,
  ShieldCheck,
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
  granite: LayoutGrid,
  "paint-finishes": Paintbrush,
  "false-ceiling": Square,
  flooring: Layers,
  "doors-windows": DoorOpen,
  "glass-mirror": Sparkles,
  "hardware-fittings": Wrench,
  hardware: Wrench,
  furniture: Armchair,
  "kitchen-wardrobe": UtensilsCrossed,
  "plumbing-sanitary": Droplets,
  plumbing: Droplets,
  "wall-surface": Wallpaper,
  wallpaper: Wallpaper,
  "decor-accessories": Palette,
  "curtains-blinds": Sliders,
  "office-commercial": Building2,
  "outdoor-landscape": Trees,
  "smart-home": Cpu,
  "safety-fire": ShieldAlert,
  "tools-consumables": Hammer,
  plywood: Boxes,
  "adhesives-sealants-waterproofing": ShieldCheck,
};

export function CategoryIcon({ slugOrName, size = 20, className = "", ...props }: CategoryIconProps) {
  const normalizedKey = (slugOrName || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "");

  const Component = ICON_MAP[normalizedKey] || LayoutGrid;

  return <Component size={size} className={className} {...props} />;
}
