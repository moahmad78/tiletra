"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import { categories, type Category } from "@/lib/data/categories";

const TOP_CATEGORIES = categories.filter((c) => !c.parentId);

const CATEGORY_SUBCATS: Record<string, { name: string; slug: string; desc: string }[]> = {
  "electrical": [
    { name: "House Wires & Cables", slug: "electrical", desc: "FR & FRLS Copper Wires (90m Coils)" },
    { name: "Modular Switches & Sockets", slug: "electrical", desc: "16A/6A switches, plates & frames" },
    { name: "MCBs & Distribution Boards", slug: "electrical", desc: "Circuit breakers & isolators" },
    { name: "Conduit Pipes & Fittings", slug: "electrical", desc: "PVC flexible & rigid electrical pipes" },
  ],
  "lighting": [
    { name: "Decorative Chandeliers & Pendants", slug: "lighting", desc: "Modern dining & living room chandeliers" },
    { name: "COB Downlights & Spotlights", slug: "lighting", desc: "Anti-glare focused architectural lights" },
    { name: "LED Strip & Profile Lights", slug: "lighting", desc: "Cove lighting & slim aluminum profiles" },
    { name: "Outdoor & Gate Lights", slug: "lighting", desc: "IP65 waterproof garden & bollard lights" },
  ],
  "tiles-stone": [
    { name: "Living Room Floor Tiles", slug: "tiles-stone", desc: "Vitrified large format 800x800mm & GVT" },
    { name: "Granite & Marble Slabs", slug: "tiles-stone", desc: "South Indian granite & Italian marble" },
    { name: "Bathroom Wall & Floor", slug: "bathroom-tiles", desc: "Waterproof anti-skid ceramic tiles" },
    { name: "Kitchen Subway & Splashbacks", slug: "kitchen-tiles", desc: "Glossy subway & decorative mosaics" },
  ],
  "paint-finishes": [
    { name: "Interior Luxury Emulsions", slug: "paint-finishes", desc: "Washable velvet sheen & matte wall paints" },
    { name: "Exterior Weatherproof Coats", slug: "paint-finishes", desc: "Anti-fungal exterior acrylic emulsion" },
    { name: "Wall Primers & Putty", slug: "paint-finishes", desc: "Waterproof white cement wall putty" },
    { name: "Wood & Metal Enamel Polishes", slug: "paint-finishes", desc: "PU wood polish & rust-resistant enamels" },
  ],
  "false-ceiling": [
    { name: "Gypsum Ceiling Boards", slug: "false-ceiling", desc: "Standard 12.5mm moisture-resistant boards" },
    { name: "POP Molding Plaster", slug: "false-ceiling", desc: "Super fine grade ceiling casting plaster" },
    { name: "GI Channel Grids & Tees", slug: "false-ceiling", desc: "Main lines, perimeter & intermediate tees" },
    { name: "Acoustic Ceiling Tiles", slug: "false-ceiling", desc: "Sound-absorbing mineral fiber 600x600mm" },
  ],
  "flooring": [
    { name: "Wooden Laminate Planks", slug: "flooring", desc: "AC4 high traffic click-lock wooden flooring" },
    { name: "SPC / LVP Waterproof Flooring", slug: "flooring", desc: "Stone plastic composite rigid core planks" },
    { name: "Engineered Hardwood", slug: "flooring", desc: "Real wood multi-ply architectural flooring" },
    { name: "Heavy-Duty Vinyl Flooring Rolls", slug: "flooring", desc: "Commercial anti-bacterial sheet flooring" },
  ],
  "doors-windows": [
    { name: "Solid Core Flush Doors", slug: "doors-windows", desc: "Pine core 32mm laminated flush doors" },
    { name: "Aluminum Window Sections", slug: "doors-windows", desc: "2-track & 3-track sliding profiles" },
    { name: "UPVC Casement Windows", slug: "doors-windows", desc: "Double glazed acoustic noise-proof windows" },
    { name: "Window Mesh & Louvers", slug: "doors-windows", desc: "Ventilator & balcony security screens" },
  ],
  "glass-mirror": [
    { name: "Toughened Glass Partitions", slug: "glass-mirror", desc: "10mm/12mm frameless office & shower glass" },
    { name: "LED Touch Vanity Mirrors", slug: "glass-mirror", desc: "Defogger smart illuminated bathroom mirrors" },
    { name: "Sliding Glass Shower Cubicles", slug: "glass-mirror", desc: "Complete modular glass enclosure kits" },
    { name: "Spider & Patch Glass Fittings", slug: "glass-mirror", desc: "Stainless steel architectural glass hardware" },
  ],
  "hardware-fittings": [
    { name: "Self-Drilling & Drywall Screws", slug: "hardware-fittings", desc: "SS 304 star & hex drive screws" },
    { name: "Door & Cabinet Hinges", slug: "hardware-fittings", desc: "Soft-close hydraulic & butt hinges" },
    { name: "Mortise Locks & Handles", slug: "hardware-fittings", desc: "High security handles & Euro cylinders" },
    { name: "Drawer Slides & Channels", slug: "hardware-fittings", desc: "Telescopic slides & soft-close runners" },
  ],
  "furniture": [
    { name: "Living Room Sofas & Chairs", slug: "furniture", desc: "Luxury fabric & leatherette ergonomic seats" },
    { name: "Plywood & MDF Boards", slug: "plywood", desc: "BWP Marine 710 grade ply & HDHMR boards" },
    { name: "Decorative Surface Laminates", slug: "plywood", desc: "1mm high-gloss & suede laminates" },
    { name: "Dining & Study Tables", slug: "furniture", desc: "Solid wood & metal frame workstations" },
  ],
  "kitchen-wardrobe": [
    { name: "Modular Kitchen Wire Baskets", slug: "kitchen-wardrobe", desc: "SS 304 corner units, thali & cup saucers" },
    { name: "Soft-Close Tandem Boxes", slug: "kitchen-wardrobe", desc: "Slim metal drawer box systems" },
    { name: "Wardrobe Lifts & Organizers", slug: "kitchen-wardrobe", desc: "Hydraulic wardrobe lift & trouser racks" },
    { name: "Tall Pantries & Flap Stays", slug: "kitchen-wardrobe", desc: "Overhead lift-up systems & pullouts" },
  ],
  "plumbing-sanitary": [
    { name: "CPVC & UPVC Water Pipes", slug: "plumbing-sanitary", desc: "Hot & cold plumbing pipes & fittings" },
    { name: "Brass Mixer Taps & Faucets", slug: "plumbing-sanitary", desc: "Wall mixers, basin pillars & shower arms" },
    { name: "Washbasins & Water Closets", slug: "plumbing-sanitary", desc: "Wall-hung & one-piece ceramic closets" },
    { name: "Sanitaryware & Drain Traps", slug: "plumbing-sanitary", desc: "Drain traps, angle valves & health faucets" },
  ],
  "wall-surface": [
    { name: "Designer Non-Woven Wallpapers", slug: "wall-surface", desc: "57 sq.ft washable textured luxury rolls" },
    { name: "3D Charcoal Fluted Wall Panels", slug: "wall-surface", desc: "Acoustic luxury interior wall slats" },
    { name: "PVC Marble Sheet Panels", slug: "wall-surface", desc: "UV marble sheets for TV units & lobbies" },
    { name: "Exterior WPC Wall Cladding", slug: "wall-surface", desc: "Weatherproof exterior architectural louvers" },
  ],
  "decor-accessories": [
    { name: "Wall Art & Metal Murals", slug: "decor-accessories", desc: "Contemporary abstract & geometric wall art" },
    { name: "Architectural Planters & Vases", slug: "decor-accessories", desc: "Ceramic & brass floor standing planters" },
    { name: "Rugs & Floor Carpets", slug: "decor-accessories", desc: "Hand-tufted wool & soft microfiber rugs" },
    { name: "Table Accents & Clocks", slug: "decor-accessories", desc: "Minimalist desktop decor & timepieces" },
  ],
  "curtains-blinds": [
    { name: "Motorized Smart Curtain Tracks", slug: "curtains-blinds", desc: "WiFi & remote controlled drapery tracks" },
    { name: "Roller & Zebra Blinds", slug: "curtains-blinds", desc: "Blackout & light filtering fabric blinds" },
    { name: "Blackout Drapery Fabrics", slug: "curtains-blinds", desc: "Thermal insulated sound-dampening drapes" },
    { name: "Architectural Curtain Rods", slug: "curtains-blinds", desc: "Brass & matte black designer finial rods" },
  ],
  "office-commercial": [
    { name: "Modular Workstations & Pods", slug: "office-commercial", desc: "2-seater & 4-seater shared office desks" },
    { name: "Ergonomic Task Chairs", slug: "office-commercial", desc: "High-back mesh breathable desk chairs" },
    { name: "Acoustic Desk Screens", slug: "office-commercial", desc: "Sound-absorbing privacy partitions" },
    { name: "Conference & Meeting Tables", slug: "office-commercial", desc: "8-12 seater boardroom tables with wire boxes" },
  ],
  "outdoor-landscape": [
    { name: "Heavy-Duty Parking Pavers", slug: "outdoor-landscape", desc: "Interlocking concrete & stone paving tiles" },
    { name: "High-Density Artificial Turf", slug: "outdoor-landscape", desc: "35mm UV-resistant balcony & lawn grass" },
    { name: "WPC Exterior Decking Tiles", slug: "outdoor-landscape", desc: "Waterproof interlocking wooden deck tiles" },
    { name: "Garden Fencing & Boundary Mesh", slug: "outdoor-landscape", desc: "Weatherproof perimeter garden fencing" },
  ],
  "smart-home": [
    { name: "Smart Touch Switches & Panels", slug: "smart-home", desc: "WiFi & Zigbee glass touch wall switches" },
    { name: "Smart WiFi Curtain Motors", slug: "smart-home", desc: "App & voice controlled automatic drapes" },
    { name: "Smart Scene Controllers", slug: "smart-home", desc: "Multi-device wireless ambient remote hubs" },
    { name: "Smart Sensor Kits", slug: "smart-home", desc: "Motion, temperature & door opening sensors" },
  ],
  "safety-fire": [
    { name: "Biometric Smart Door Locks", slug: "safety-fire", desc: "Fingerprint, passcode & RFID entry locks" },
    { name: "Smart WiFi CCTV Cameras", slug: "safety-fire", desc: "360° night vision indoor & outdoor cameras" },
    { name: "Video Door Phones & Intercom", slug: "safety-fire", desc: "HD two-way intercom & door cameras" },
    { name: "ABC Fire Extinguishers & Alarms", slug: "safety-fire", desc: "ISI certified fire safety equipment" },
  ],
  "tools-consumables": [
    { name: "Power Drills & Cutters", slug: "tools-consumables", desc: "Cordless drills, angle grinders & tile cutters" },
    { name: "Tile Adhesives & Grouts", slug: "adhesives-sealants-waterproofing", desc: "Type 2 & 4 high bond glue & epoxy grouts" },
    { name: "Silicones & Gap Fillers", slug: "adhesives-sealants-waterproofing", desc: "Sanitary silicone & waterproof sealants" },
    { name: "Measuring Tapes & Levels", slug: "tools-consumables", desc: "Laser distance meters & spirit bubble levels" },
  ],
};

export default function CategoryNavBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number }>({ left: 16 });
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = 280;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  const handleMouseEnterItem = (cat: Category, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    const btnRect = e.currentTarget.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect() || { left: 0, width: 1400 };

    // Calculate left relative to parent container, bounded so it doesn't overflow right edge
    const desiredLeft = btnRect.left - parentRect.left;
    const boundedLeft = Math.max(16, Math.min(desiredLeft, parentRect.width - 420));

    setDropdownPos({ left: boundedLeft });
    setActiveCategory(cat);
  };

  const handleMouseLeaveItem = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 180);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleDropdownMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 180);
  };

  const subcats = activeCategory ? (CATEGORY_SUBCATS[activeCategory.slug] || []) : [];
  const hasSubcats = subcats.length > 0;

  return (
    <div
      ref={containerRef}
      className="hidden md:block bg-white border-b border-gray-200 shadow-2xs relative z-40 select-none"
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[44px] text-xs font-bold text-[#052a51] gap-3">
          {/* 1. Category Scroll Section with Functional Left & Right Arrows */}
          <div className="relative flex-1 min-w-0 flex items-center">
            {/* Left Scroll Arrow */}
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll categories left"
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all z-10 mr-1 ${
                canScrollLeft
                  ? "border-gray-300 text-[#052a51] hover:bg-gray-100 hover:border-[#F26522] hover:text-[#F26522] shadow-2xs cursor-pointer"
                  : "border-transparent text-gray-300 cursor-not-allowed opacity-0 pointer-events-none"
              }`}
            >
              <ChevronLeft size={14} />
            </button>

            {/* Horizontally Scrollable Category Items Track */}
            <nav
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto scrollbar-none scroll-smooth flex-1 min-w-0 py-1"
            >
              {TOP_CATEGORIES.map((cat) => {
                const isActive = activeCategory?.slug === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    href={`/shop/${cat.slug}`}
                    onMouseEnter={(e) => handleMouseEnterItem(cat, e)}
                    onMouseLeave={handleMouseLeaveItem}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap text-[12px] font-bold shrink-0 ${
                      isActive
                        ? "text-[#F26522] bg-[#F26522]/10"
                        : "text-[#052a51] hover:text-[#F26522] hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown
                      size={11}
                      className={`transition-transform ${
                        isActive ? "rotate-180 text-[#F26522]" : "text-gray-400 group-hover:text-[#F26522]"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right Scroll Arrow */}
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll categories right"
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all z-10 ml-1 ${
                canScrollRight
                  ? "border-gray-300 text-[#052a51] hover:bg-gray-100 hover:border-[#F26522] hover:text-[#F26522] shadow-2xs cursor-pointer"
                  : "border-transparent text-gray-300 cursor-not-allowed opacity-0 pointer-events-none"
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 2. Right Side Dedicated Fixed Slot */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 shrink-0">
            {/* Explore All Supplies CTA */}
            <Link
              href="/shop"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#052a51] hover:bg-[#F26522] text-white transition-all text-xs font-bold shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Flame size={13} className="text-[#F26522] group-hover:text-white" />
              <span>Explore All Supplies</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Generalized Mega-Menu Dropdown (Rendered in Outer Container - Zero CSS Clipping) */}
      {activeCategory && (
        <div
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          style={{ left: `${dropdownPos.left}px` }}
          className="absolute top-full w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header: Category Name + Short Description + Top All CTA */}
          <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="pr-3">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-[#052a51] text-sm">{activeCategory.name}</h4>
                {activeCategory.productCount > 0 && (
                  <span className="bg-[#F26522]/10 text-[#F26522] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {activeCategory.productCount} Items
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                {activeCategory.description}
              </p>
            </div>
            <Link
              href={`/shop/${activeCategory.slug}`}
              className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1 shrink-0 bg-[#F26522]/5 px-2.5 py-1 rounded-lg hover:bg-[#F26522]/10 transition-colors"
            >
              Browse All <ArrowRight size={11} />
            </Link>
          </div>

          {/* Body: Generalized Subcategories or Simple Single-CTA Variant */}
          {hasSubcats ? (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-1 mb-1">
                Popular Categories & Products
              </span>
              <div className="grid grid-cols-1 gap-1">
                {subcats.map((sub, idx) => (
                  <Link
                    key={idx}
                    href={`/shop/${sub.slug}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F26522]/5 transition-colors group/item"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#052a51] group-hover/item:text-[#F26522] transition-colors">
                        {sub.name}
                      </p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{sub.desc}</p>
                    </div>
                    <ArrowUpRight
                      size={13}
                      className="text-gray-300 group-hover/item:text-[#F26522] transition-colors shrink-0 ml-2"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            /* Simpler Variant for categories without subcategories */
            <div className="py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-white">
                  <Image
                    src={activeCategory.image || "/placeholders/category.svg"}
                    alt={activeCategory.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#052a51]">Explore {activeCategory.name}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">
                    Direct-from-manufacturer supplies delivered to site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer CTA: Prominent Generalized CTA */}
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <Link
              href={`/shop/${activeCategory.slug}`}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#052a51] hover:bg-[#F26522] text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <span>View All {activeCategory.name} Supplies</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
