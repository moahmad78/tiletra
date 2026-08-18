"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Flame } from "lucide-react";
import { categories } from "@/lib/data/categories";

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
    { name: "Bathroom Wall & Floor", slug: "tiles-stone", desc: "Waterproof anti-skid ceramic tiles" },
    { name: "Kitchen Subway & Splashbacks", slug: "tiles-stone", desc: "Glossy subway & decorative mosaics" },
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 shadow-2xs relative z-40 select-none">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[44px] text-xs font-bold text-[#052a51] gap-3">
          
          {/* 1. Category Scroll Section with Functional Left & Right Arrows */}
          <div className="relative flex-1 min-w-0 flex items-center">
            {/* Functional Left Scroll Arrow */}
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
              {TOP_CATEGORIES.map((cat, idx) => {
                const subcats = CATEGORY_SUBCATS[cat.slug] || [];
                const isHovered = activeMenu === cat.slug;
                // Align right if dropdown is towards the right side of the list
                const isRightAligned = idx > TOP_CATEGORIES.length - 4;

                return (
                  <div
                    key={cat.slug}
                    className="relative group shrink-0"
                    onMouseEnter={() => setActiveMenu(cat.slug)}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Link
                      href={`/shop/${cat.slug}`}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap text-[12px] font-bold ${
                        isHovered
                          ? "text-[#F26522] bg-[#F26522]/10"
                          : "text-[#052a51] hover:text-[#F26522] hover:bg-gray-50"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <ChevronDown
                        size={11}
                        className={`text-gray-400 transition-transform ${
                          isHovered ? "rotate-180 text-[#F26522]" : "group-hover:text-[#F26522]"
                        }`}
                      />
                    </Link>

                    {/* Rich Category Mega-Menu Dropdown */}
                    {isHovered && (
                      <div
                        className={`absolute top-full w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                          isRightAligned ? "right-0" : "left-0"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5">
                          <div>
                            <h4 className="font-black text-[#052a51] text-sm">{cat.name}</h4>
                            <p className="text-[11px] text-gray-500 line-clamp-1">{cat.description}</p>
                          </div>
                          <Link
                            href={`/shop/${cat.slug}`}
                            className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1 shrink-0"
                          >
                            All <ArrowRight size={11} />
                          </Link>
                        </div>

                        <div className="space-y-1">
                          {subcats.map((sub, sIdx) => (
                            <Link
                              key={sIdx}
                              href={`/shop/${sub.slug}`}
                              className="block p-2 rounded-xl hover:bg-[#F26522]/5 transition-colors group/item"
                            >
                              <p className="text-xs font-bold text-[#052a51] group-hover/item:text-[#F26522]">
                                {sub.name}
                              </p>
                              <p className="text-[10px] text-gray-400 line-clamp-1">{sub.desc}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Functional Right Scroll Arrow */}
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

          {/* 2. Right Side Fixed Slot (Zero overlap guaranteed) */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 shrink-0">
            {/* Room Inspiration Quick Link */}
            <Link
              href="/inspiration"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#F26522] hover:bg-[#F26522]/10 transition-colors whitespace-nowrap font-black text-[12px] shrink-0"
            >
              <Sparkles size={13} className="shrink-0" />
              <span>Inspiration</span>
            </Link>

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
    </div>
  );
}
