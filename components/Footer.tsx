"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/lib/i18n/client";
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Truck,
  Lock,
  ShieldCheck,
  Package,
  MessageCircle,
  PhoneCall,
  ArrowRight,
} from "lucide-react";

const shopLinksConfig = [
  { key: "categories.electrical", fallback: "Electrical", href: "/shop/electrical" },
  { key: "categories.lighting", fallback: "Lighting", href: "/shop/lighting" },
  { key: "categories.tilesStone", fallback: "Tiles & Stone", href: "/shop/tiles-stone" },
  { key: "categories.paintFinishes", fallback: "Paint & Finishes", href: "/shop/paint-finishes" },
  { key: "categories.falseCeiling", fallback: "False Ceiling", href: "/shop/false-ceiling" },
  { key: "categories.flooring", fallback: "Flooring", href: "/shop/flooring" },
  { key: "categories.doorsWindows", fallback: "Doors & Windows", href: "/shop/doors-windows" },
  { key: "categories.glassMirror", fallback: "Glass & Mirror", href: "/shop/glass-mirror" },
  { key: "categories.hardwareFittings", fallback: "Hardware & Fittings", href: "/shop/hardware-fittings" },
  { key: "categories.furniturePlywood", fallback: "Furniture & Plywood", href: "/shop/furniture" },
  { key: "categories.kitchenWardrobe", fallback: "Kitchen & Wardrobe", href: "/shop/kitchen-wardrobe" },
  { key: "categories.plumbingSanitary", fallback: "Plumbing & Sanitary", href: "/shop/plumbing-sanitary" },
  { key: "categories.wallSurface", fallback: "Wall & Surface", href: "/shop/wall-surface" },
  { key: "categories.decorAccessories", fallback: "Decor & Accessories", href: "/shop/decor-accessories" },
  { key: "categories.curtainsBlinds", fallback: "Curtains & Blinds", href: "/shop/curtains-blinds" },
  { key: "categories.officeCommercial", fallback: "Office & Commercial", href: "/shop/office-commercial" },
  { key: "categories.outdoorLandscape", fallback: "Outdoor & Landscape", href: "/shop/outdoor-landscape" },
  { key: "categories.smartHome", fallback: "Smart Home", href: "/shop/smart-home" },
  { key: "categories.safetyFire", fallback: "Safety & Fire", href: "/shop/safety-fire" },
  { key: "categories.toolsConsumables", fallback: "Tools & Consumables", href: "/shop/tools-consumables" },
  { key: "categories.exploreAllCategories", fallback: "Explore All Categories →", href: "/shop" },
];

const helpLinksConfig = [
  { key: "footer.buyingGuides", fallback: "Buying Guides & Calculators", href: "/guides" },
  { key: "footer.vitrifiedGuide", fallback: "Vitrified Tiles Buying Guide (2026)", href: "/guides/vitrified-tiles-online-buying-guide" },
  { key: "footer.bengaluruChecklist", fallback: "Bengaluru Construction Checklist", href: "/guides/building-material-list-for-house-construction-bengaluru" },
  { key: "footer.contractorChecklist", fallback: "Contractor Material Checklist", href: "/guides/interior-material-checklist-contractors" },
  { key: "footer.electricalGuide", fallback: "Electrical Material Selection Guide", href: "/guides/electrical-material-selection-guide-bengaluru" },
  { key: "footer.designMoodBoards", fallback: "Design Mood Boards & Inspiration", href: "/inspiration" },
  { key: "footer.buildingMaterialsOnline", fallback: "Building Materials Online", href: "/building-materials-online" },
  { key: "footer.forArchitects", fallback: "For Architects", href: "/for-architects" },
  { key: "footer.forInteriorDesigners", fallback: "For Interior Designers", href: "/for-interior-designers" },
  { key: "footer.forContractors", fallback: "For Contractors", href: "/for-contractors" },
  { key: "footer.whyIntriHub20", fallback: "Why IntriHub? (20 Reasons)", href: "/why-intrihub" },
  { key: "footer.bulkProjectOrders", fallback: "Bulk Project Orders", href: "/bulk-orders" },
  { key: "footer.panIndiaDelivery", fallback: "Pan-India Delivery", href: "/pan-india-delivery" },
  { key: "footer.aboutUs", fallback: "About Us", href: "/about" },
  { key: "footer.foundersVision", fallback: "Founder's Vision", href: "/founder" },
  { key: "footer.contactUs", fallback: "Contact Us", href: "/contact" },
  { key: "footer.faqs", fallback: "Frequently Asked Questions", href: "/faq" },
  { key: "footer.shippingPolicy", fallback: "Shipping Policy", href: "/shipping-policy" },
  { key: "footer.returnsReplacements", fallback: "Returns & Replacements", href: "/returns-policy" },
  { key: "footer.termsConditions", fallback: "Terms & Conditions", href: "/terms" },
  { key: "footer.privacyPolicy", fallback: "Privacy Policy", href: "/privacy-policy" },
];

const categoryLandingLinks = [
  { label: "Tiles", href: "/tiles" },
  { label: "Vitrified Tiles", href: "/tiles/vitrified-tiles" },
  { label: "Floor Tiles", href: "/tiles/floor-tiles" },
  { label: "Wall Tiles", href: "/tiles/wall-tiles" },
  { label: "Bathroom Tiles", href: "/tiles/bathroom-tiles" },
  { label: "Plywood", href: "/plywood" },
  { label: "Marine Plywood", href: "/plywood/marine-plywood" },
  { label: "710 Waterproof Ply", href: "/plywood/710-waterproof-plywood" },
  { label: "MDF Board", href: "/plywood/mdf-board" },
  { label: "Electrical Supplies", href: "/electrical" },
  { label: "Wires & Cables", href: "/electrical/wires-and-cables" },
  { label: "Switches & Sockets", href: "/electrical/switches-and-sockets" },
  { label: "Plumbing Materials", href: "/plumbing" },
  { label: "CPVC Pipes", href: "/plumbing/cpvc-pipes" },
  { label: "Architectural Hardware", href: "/hardware" },
  { label: "Door Fittings", href: "/hardware/door-fittings" },
  { label: "Sanitaryware", href: "/sanitaryware" },
  { label: "Wash Basins", href: "/sanitaryware/wash-basin" },
  { label: "Paints & Coatings", href: "/paints" },
  { label: "Furniture Materials", href: "/furniture" },
  { label: "Cement & Concrete", href: "/cement-and-concrete" },
  { label: "Doors & Windows", href: "/doors-and-windows" },
];

const localLandingLinks = [
  { label: "Begur", href: "/construction-material-in-begur" },
  { label: "Bommanahalli", href: "/building-material-in-bommanahalli" },
  { label: "HSR Layout", href: "/interior-material-in-hsr-layout" },
  { label: "Electronic City", href: "/tiles-in-electronic-city" },
  { label: "Koramangala", href: "/construction-material-in-koramangala" },
  { label: "Bangalore Tiles", href: "/tiles-shop-in-bangalore" },
  { label: "Bangalore Plywood", href: "/plywood-dealer-in-bangalore" },
  { label: "Bangalore Electrical", href: "/electrical-shop-in-bangalore" },
  { label: "Building Delivery Bangalore", href: "/building-material-delivery-bangalore" },
  { label: "Interior Supplier Bangalore", href: "/interior-material-supplier-bangalore" },
];

const popularAreaPages = [
  { label: "Whitefield Electrical", href: "/shop/electrical/whitefield" },
  { label: "Koramangala Tiles", href: "/shop/tiles-stone/koramangala" },
  { label: "Begur Central Supplies", href: "/shop/tiles-stone/begur" },
  { label: "HSR Layout Plywood", href: "/shop/plywood/hsr-layout" },
  { label: "Indiranagar Paint & Finishes", href: "/shop/paint-finishes/indiranagar" },
  { label: "Electronic City Tech Park", href: "/shop/electrical/electronic-city" },
  { label: "Sarjapur Road Materials", href: "/shop/tiles-stone/sarjapur-road" },
  { label: "Hebbal Airport Corridor", href: "/shop/tiles-stone/hebbal" },
  { label: "JP Nagar Construction", href: "/shop/tiles-stone/jp-nagar" },
  { label: "All Karnataka Areas & Hubs →", href: "/areas" },
];

const highIntentKeywordLinks = [
  { label: "Vitrified Tiles Bengaluru", href: "/vitrified-tiles-material-provider-bengaluru" },
  { label: "Waterproofing Bengaluru", href: "/waterproofing-material-provider-bengaluru" },
  { label: "Modular Kitchen Karnataka", href: "/modular-kitchen-material-provider-karnataka" },
  { label: "PVC Pipes Bengaluru", href: "/pvc-pipes-plumbing-material-bengaluru" },
  { label: "Engineered Wood Flooring", href: "/engineered-wood-flooring-material-bengaluru" },
  { label: "Electrical Wiring & Switches", href: "/electrical-wiring-switches-provider-bengaluru" },
  { label: "Plywood & Laminates Karnataka", href: "/plywood-laminate-material-provider-karnataka" },
  { label: "Bathroom Fittings Bengaluru", href: "/bathroom-fittings-sanitaryware-bengaluru" },
  { label: "Smart Home Fittings", href: "/smart-home-fittings-provider-bengaluru" },
  { label: "Interior Hardware Bengaluru", href: "/interior-hardware-material-provider-bengaluru" },
  { label: "Exterior Cladding Bengaluru", href: "/exterior-cladding-material-provider-bengaluru" },
  { label: "Roofing Tiles Karnataka", href: "/roofing-tiles-material-provider-karnataka" },
  { label: "Staircase Materials Bengaluru", href: "/staircase-material-provider-bengaluru" },
  { label: "Cabinet & Wardrobe Fittings", href: "/cabinet-wardrobe-material-provider-bengaluru" },
  { label: "Furniture Material Provider", href: "/furniture-material-provider-bengaluru" },
  { label: "Eco-Friendly Materials Bengaluru", href: "/eco-friendly-interior-material-bengaluru" },
  { label: "Fly-Ash Cement Bengaluru", href: "/fly-ash-cement-supplier-bengaluru" },
  { label: "Cool Cement Putty Bengaluru", href: "/cool-cement-putty-bengaluru" },
  { label: "Gypsum Plaster Karnataka", href: "/gypsum-plaster-supplier-karnataka" },
  { label: "Terracotta Finish Bengaluru", href: "/terracotta-finish-material-bengaluru" },
  { label: "False Ceiling Materials", href: "/false-ceiling-material-provider-bengaluru" },
  { label: "Designer Ceilings Karnataka", href: "/designer-ceiling-material-karnataka" },
  { label: "Vitrified Tiles Price Bangalore", href: "/vitrified-tiles-price-in-bangalore" },
  { label: "Plywood Price per Sheet", href: "/plywood-price-per-sheet-bangalore" },
  { label: "Cement Price Bangalore", href: "/cement-price-in-bangalore" },
  { label: "TMT Rebar Price Bangalore", href: "/tmt-bar-price-in-bangalore" },
  { label: "Wall Tiles Price per Sq.Ft", href: "/wall-tiles-price-per-sq-ft" },
  { label: "CPVC Pipe Price List", href: "/cpvc-pipe-price-list" },
  { label: "Electrical Wire Price Meter", href: "/electrical-wire-price-per-meter" },
  { label: "Bathroom Tiles Price Bangalore", href: "/bathroom-tiles-price-in-bangalore" },
  { label: "Matte Tiles Bangalore", href: "/matte-tiles-bangalore" },
  { label: "Terracotta Look Tiles", href: "/terracotta-look-tiles" },
  { label: "Sandstone Effect Tiles", href: "/sandstone-effect-tiles" },
  { label: "Warm Travertine Tiles", href: "/warm-travertine-tiles" },
  { label: "Honey Oak Wood Tiles", href: "/honey-oak-wood-tiles" },
  { label: "E0 Grade Safe Plywood", href: "/e0-grade-plywood" },
  { label: "Plywood Veneer Designs", href: "/plywood-veneer-designs" },
  { label: "Modular Plywood Furniture", href: "/modular-plywood-furniture" },
  { label: "Acoustic Panels Interior", href: "/acoustic-panels-interior" },
  { label: "Nature-Inspired Laminates", href: "/nature-inspired-laminates" },
  { label: "Whitefield Materials", href: "/best-interior-material-whitefield" },
  { label: "Electronic City Materials", href: "/best-interior-material-electronic-city" },
  { label: "Hebbal Materials", href: "/best-interior-material-hebbal" },
  { label: "Mysuru Materials", href: "/best-interior-material-mysuru" },
  { label: "Mangaluru Materials", href: "/best-interior-material-mangaluru" },
  { label: "Construction Material Near Me", href: "/construction-material-provider-near-me-bengaluru" },
  { label: "Electrical Provider Pan-India", href: "/electrical-material-provider-india" },
];

export default function Footer() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Hide footer on full-screen flows (checkout, login, scan camera)
  if (
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/scan")
  ) {
    return null;
  }

  return (
    <footer className="bg-[#052a51] text-white pt-12 md:pt-16 pb-24 md:pb-8 border-t border-white/10">
      <div className="w-full max-w-[1400px] mx-auto px-[16px] sm:px-[20px] md:px-[24px] lg:px-[32px]">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          {/* Col 1: Brand info (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-8">
            <div className="flex items-center gap-3 notranslate" translate="no">
              <Link href="/" aria-label="Intrihub Home" className="inline-flex items-center bg-white px-4 py-2 rounded-2xl shadow-xs notranslate" translate="no">
                <Image
                  src="/logo/intri-web-logo.png"
                  alt="IntriHub"
                  width={150}
                  height={32}
                  unoptimized
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed mb-4 text-white/80">
              <strong className="text-white">{t("footer.buildBetter", "Build Better, We Deliver Faster.")}</strong> {t("footer.brandDescription", "India's complete interior & construction supply platform — tiles, electrical, plumbing, hardware, plywood, granite, aluminum doors & wallpaper delivered directly to your site.")}
            </p>
            {/* Free delivery badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F26522]/20 border border-[#F26522]/30 rounded-full text-[#F26522] text-xs font-bold mb-3">
              <Truck size={14} />
              <span>{t("footer.freeDeliveryBadge", "Free delivery above ₹15,000")}</span>
            </div>

            {/* Socials */}
            <div className="flex gap-2.5 pt-1">
              <a
                href="https://www.instagram.com/intrihub_/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] text-white transition-all hover:scale-110"
                aria-label="Follow IntriHub on Instagram"
                title="Follow IntriHub on Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://www.linkedin.com/company/intrihub"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0077b5] text-white transition-all hover:scale-110"
                aria-label="Connect with IntriHub on LinkedIn"
                title="Connect with IntriHub on LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.46a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
                </svg>
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="https://www.facebook.com/intrihub"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877f2] text-white transition-all hover:scale-110"
                aria-label="Follow IntriHub on Facebook"
                title="Follow IntriHub on Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://wa.me/917090120211"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] text-white transition-all hover:scale-110"
                aria-label="Chat with IntriHub Support on WhatsApp"
                title="Chat with IntriHub Support on WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">{t("footer.shopCategories", "Shop Categories")}</h3>
            <ul className="space-y-2">
              {shopLinksConfig.map(({ key, fallback, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/80 hover:text-[#F26522] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#F26522]/50 group-hover:bg-[#F26522] transition-colors" />
                    {t(key, fallback)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">{t("footer.helpSupport", "Help & Support")}</h3>
            <ul className="space-y-2">
              {helpLinksConfig.map(({ key, fallback, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/80 hover:text-[#F26522] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#F26522]/50 group-hover:bg-[#F26522] transition-colors" />
                    {t(key, fallback)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">{t("footer.contactUs", "Contact Us")}</h3>
            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-center gap-3 select-none notranslate" translate="no">
                <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0">
                  <Phone size={15} />
                </div>
                <div className="flex flex-col justify-center notranslate" translate="no">
                  <span className="font-bold text-white block leading-tight text-xs notranslate" translate="no">{t("footer.intrihubSupport", "Intrihub Support")}</span>
                  <a
                    href="tel:+917090120211"
                    aria-label="Call Intrihub Support at +91 70901 20211"
                    className="text-[#F26522] hover:text-white font-semibold text-xs tracking-wide transition-colors notranslate"
                    translate="no"
                  >
                    +91 70901 20211
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                <Clock size={15} className="text-[#F26522] shrink-0" />
                <span>{t("footer.support247", "24/7 Customer Support")}</span>
              </li>
            </ul>

            {/* Trust badges */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Lock size={13} className="text-[#1E9E6B] shrink-0" />
                <span>{t("footer.securePayments", "Secure payments via Razorpay")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <ShieldCheck size={13} className="text-[#1E9E6B] shrink-0" />
                <span>{t("footer.genuineMaterials", "100% Genuine Project Materials")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Package size={13} className="text-[#F26522] shrink-0" />
                <span>{t("footer.directDispatch", "Direct Site Dispatch & Tracking")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#FF9900] font-semibold pt-1">
                <Truck size={13} className="shrink-0" />
                <Link href="/pan-india-delivery" className="hover:underline flex items-center gap-1">
                  <span>{t("footer.panIndiaAvailable", "Pan-India Delivery Available")}</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Landing Discovery: Browse by Material, Browse by Area & Popular Delivery Zones */}
        <div className="py-6 border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-white/70">
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">{t("footer.browseMaterial", "Browse by Material")}</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {categoryLandingLinks.map(({ label, href }) => (
                <Link key={href} href={href} className="hover:text-[#F26522] transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">{t("footer.deliveryAreas", "Delivery Areas")}</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {localLandingLinks.map(({ label, href }) => (
                <Link key={href} href={href} className="hover:text-[#F26522] transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">{t("footer.popularHubs", "Popular Hubs")}</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {popularAreaPages.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    href === "/areas"
                      ? "text-[#F26522] font-bold hover:underline"
                      : "hover:text-[#F26522] transition-colors"
                  }
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">{t("footer.sourcingMaterials", "Sourcing Materials")}</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {highIntentKeywordLinks.slice(0, 10).map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:text-[#F26522] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* We Deliver Across India Section */}
        <div className="py-6 border-b border-white/10 text-xs text-white/70 bg-white/[0.02] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 rounded-xl my-4">
          <h4 className="mb-2">
            <Link
              href="/pan-india-delivery"
              className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider hover:text-[#F26522] transition-colors inline-flex items-center gap-1.5 group"
            >
              <span>{t("footer.deliverAcrossIndia", "We Deliver Across India")}</span>
              <ArrowRight size={14} className="text-[#F26522] group-hover:translate-x-1 transition-transform" />
            </Link>
          </h4>
          <p className="text-white/80 leading-relaxed mb-2 text-xs sm:text-sm">
            {t("footer.deliverAcrossIndiaDesc", "We deliver building & interior materials with guaranteed 60-minute delivery in Bengaluru; 3-7 days Pan-India (outside Bengaluru).")}
          </p>
          <p className="text-white/50 leading-relaxed text-[11px] sm:text-xs">
            {t("footer.statesList", "Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Delhi (NCR), and other Union Territories.")}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p>© {new Date().getFullYear()} IntriHub. {t("footer.allRightsReserved", "All Rights Reserved.")}</p>
            <LanguageSelector variant="footer" />
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">{t("footer.privacyPolicy", "Privacy Policy")}</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">{t("footer.terms", "Terms")}</Link>
            <span>·</span>
            <Link href="/returns-policy" className="hover:text-white transition-colors">{t("footer.returns", "Returns")}</Link>
            <span>·</span>
            <Link href="/shipping-policy" className="hover:text-white transition-colors">{t("footer.shipping", "Shipping")}</Link>
          </div>
          <p className="flex items-center gap-1.5 flex-wrap justify-center">
            <span>{t("footer.developedBy", "Founded & Developed by")}</span>
            <a
              href="https://www.instagram.com/sahil_sheikh78/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-white hover:text-[#F26522] font-black transition-colors underline underline-offset-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md"
              aria-label="Sahil Sheikh Instagram profile"
            >
              <span>Sahil Sheikh</span>
              <ArrowRight size={11} />
            </a>
          </p>
        </div>

        {/* Official Website Disclaimer */}
        <div className="pt-4 border-t border-white/5 text-center text-[11px] text-white/50 mt-4">
          <p>
            {t("footer.officialWebsiteNotice", "IntriHub's only official website is www.intrihub.com. We are not affiliated with any other website using a similar name.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
