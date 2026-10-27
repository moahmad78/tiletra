"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import {
  PHONE_DISPLAY,
  PHONE_TEL,
  SOCIAL_LINKS,
  COMPANY_NAME,
  CIN,
  REGISTERED_OFFICE_STRING,
  EMAIL,
} from "@/lib/siteConfig";

function InstagramIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const shopLinksConfig = [
  { label: "Electrical", href: "/shop/electrical" },
  { label: "Lighting", href: "/shop/lighting" },
  { label: "Tiles & Stone", href: "/shop/tiles-stone" },
  { label: "Paint & Finishes", href: "/shop/paint-finishes" },
  { label: "False Ceiling", href: "/shop/false-ceiling" },
  { label: "Flooring", href: "/shop/flooring" },
  { label: "Doors & Windows", href: "/shop/doors-windows" },
  { label: "Glass & Mirror", href: "/shop/glass-mirror" },
  { label: "Hardware & Fittings", href: "/shop/hardware-fittings" },
  { label: "Furniture & Plywood", href: "/shop/furniture" },
  { label: "Kitchen & Wardrobe", href: "/shop/kitchen-wardrobe" },
  { label: "Plumbing & Sanitary", href: "/shop/plumbing-sanitary" },
  { label: "Wall & Surface", href: "/shop/wall-surface" },
  { label: "Decor & Accessories", href: "/shop/decor-accessories" },
  { label: "Curtains & Blinds", href: "/shop/curtains-blinds" },
  { label: "Office & Commercial", href: "/shop/office-commercial" },
  { label: "Outdoor & Landscape", href: "/shop/outdoor-landscape" },
  { label: "Smart Home", href: "/shop/smart-home" },
  { label: "Safety & Fire", href: "/shop/safety-fire" },
  { label: "Tools & Consumables", href: "/shop/tools-consumables" },
  { label: "Explore All Categories →", href: "/shop" },
];

const helpLinksConfig = [
  { label: "Buying Guides & Calculators", href: "/guides" },
  { label: "Vitrified Tiles Buying Guide (2026)", href: "/guides/vitrified-tiles-online-buying-guide" },
  { label: "Bengaluru Construction Checklist", href: "/guides/building-material-list-for-house-construction-bengaluru" },
  { label: "Contractor Material Checklist", href: "/guides/interior-material-checklist-contractors" },
  { label: "Electrical Material Selection Guide", href: "/guides/electrical-material-selection-guide-bengaluru" },
  { label: "Design Mood Boards & Inspiration", href: "/inspiration" },
  { label: "Building Materials Online", href: "/building-materials-online" },
  { label: "For Architects", href: "/for-architects" },
  { label: "For Interior Designers", href: "/for-interior-designers" },
  { label: "For Contractors", href: "/for-contractors" },
  { label: "Why IntriHub? (20 Reasons)", href: "/why-intrihub" },
  { label: "Bulk Project Orders", href: "/bulk-orders" },
  { label: "Pan-India Delivery", href: "/pan-india-delivery" },
  { label: "About Us", href: "/about" },
  { label: "Founder's Vision", href: "/founder" },
  { label: "Contact Us", href: "/contact" },
  { label: "Frequently Asked Questions", href: "/faq" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Replacements", href: "/returns-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
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
              <strong className="text-white">Every Material. Every Space.</strong> India&apos;s complete interior &amp; construction supply platform — tiles, electrical, plumbing, hardware, plywood, granite, aluminum doors &amp; wallpaper delivered directly to your site.
            </p>

            {/* Follow Us (Dynamically driven by siteConfig.SOCIAL_LINKS) */}
            {SOCIAL_LINKS.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Follow Us</span>
                <div className="flex gap-2.5">
                  {SOCIAL_LINKS.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] text-white transition-all hover:scale-110"
                      aria-label={`Follow IntriHub on ${link}`}
                    >
                      <ExternalLink size={15} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">Shop Categories</h3>
            <ul className="space-y-2">
              {shopLinksConfig.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/80 hover:text-[#F26522] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#F26522]/50 group-hover:bg-[#F26522] transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">Help &amp; Support</h3>
            <ul className="space-y-2">
              {helpLinksConfig.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/80 hover:text-[#F26522] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#F26522]/50 group-hover:bg-[#F26522] transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">Contact Us</h3>
            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-center gap-3 select-none notranslate" translate="no">
                <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0">
                  <Phone size={15} />
                </div>
                <div className="flex flex-col justify-center notranslate" translate="no">
                  <span className="font-bold text-white block leading-tight text-xs notranslate" translate="no">Intrihub Support</span>
                  <a
                    href={PHONE_TEL}
                    aria-label={`Call IntriHub Support at ${PHONE_DISPLAY}`}
                    className="text-[#F26522] hover:text-white font-semibold text-xs tracking-wide transition-colors notranslate"
                    translate="no"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3 select-none">
                <div className="w-8 h-8 rounded-full bg-[#F26522]/20 flex items-center justify-center text-[#F26522] shrink-0">
                  <Mail size={15} />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-white block leading-tight text-xs">Support Email</span>
                  <a
                    href={`mailto:${EMAIL}`}
                    aria-label={`Email IntriHub Support at ${EMAIL}`}
                    className="text-[#F26522] hover:text-white font-semibold text-xs tracking-wide transition-colors"
                  >
                    {EMAIL}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                <Clock size={15} className="text-[#F26522] shrink-0" />
                <span>24/7 Customer Support</span>
              </li>
            </ul>

            {/* Trust badges */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Lock size={13} className="text-[#1E9E6B] shrink-0" />
                <span>Secure payments via Razorpay</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <ShieldCheck size={13} className="text-[#1E9E6B] shrink-0" />
                <span>100% Genuine Project Materials</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Package size={13} className="text-[#F26522] shrink-0" />
                <span>Direct Site Dispatch &amp; Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#FF9900] font-semibold pt-1">
                <Truck size={13} className="shrink-0" />
                <Link href="/pan-india-delivery" className="hover:underline flex items-center gap-1">
                  <span>Pan-India Delivery Available</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Landing Discovery: Browse by Material, Browse by Area & Popular Delivery Zones */}
        <div className="py-6 border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-white/70">
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">Browse by Material</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {categoryLandingLinks.map(({ label, href }) => (
                <Link key={href} href={href} className="hover:text-[#F26522] transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">Delivery Areas</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {localLandingLinks.map(({ label, href }) => (
                <Link key={href} href={href} className="hover:text-[#F26522] transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">Popular Hubs</h4>
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
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5">Sourcing Materials</h4>
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
              <span>We Deliver Across India</span>
              <ArrowRight size={14} className="text-[#F26522] group-hover:translate-x-1 transition-transform" />
            </Link>
          </h4>
          <p className="text-white/80 leading-relaxed mb-2 text-xs sm:text-sm">
            We deliver building &amp; interior materials with guaranteed 60-minute delivery in Bengaluru; 3-7 days Pan-India (outside Bengaluru).
          </p>
          <p className="text-white/50 leading-relaxed text-[11px] sm:text-xs">
            Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Delhi (NCR), and other Union Territories.
          </p>
        </div>

        {/* Corporate Legal & Registered Office Info */}
        <div className="py-5 border-t border-white/10 text-xs text-white/80 bg-white/[0.03] rounded-2xl px-5 sm:px-6 my-4 border border-white/10 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-white font-black tracking-wide text-xs sm:text-sm">
                {COMPANY_NAME}
              </span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="text-white/80 font-medium text-[11px] sm:text-xs">
                CIN: <strong className="text-white font-mono tracking-wider">{CIN}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/70">
              <span>Support: <a href={`mailto:${EMAIL}`} className="text-[#F26522] hover:underline font-semibold">{EMAIL}</a></span>
              <span>•</span>
              <a href={PHONE_TEL} className="text-[#F26522] hover:underline font-semibold">{PHONE_DISPLAY}</a>
            </div>
          </div>
          <div className="flex items-start gap-2 text-[11px] sm:text-xs text-white/70 leading-relaxed">
            <MapPin size={14} className="text-[#F26522] shrink-0 mt-0.5" />
            <p>
              <strong className="text-white font-semibold">Official Registered Office:</strong> {REGISTERED_OFFICE_STRING}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="font-semibold text-white/80">© 2026 IntriHub Private Limited. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/returns-policy" className="hover:text-white transition-colors">Returns</Link>
            <span>·</span>
            <Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link>
          </div>
          {SOCIAL_LINKS.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap justify-center text-xs">
              <span className="text-white/80 font-medium">Follow us:</span>
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#F26522] transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Official Website Disclaimer */}
        <div className="pt-4 border-t border-white/5 text-center text-[11px] text-white/50 mt-4">
          <p>
            IntriHub&apos;s only official website is www.intrihub.com. We are not affiliated with any other website using a similar name.
          </p>
        </div>
      </div>
    </footer>
  );
}
