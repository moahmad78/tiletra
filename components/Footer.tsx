"use client";

import Link from "next/link";
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
import RotatingFooterContact from "@/components/RotatingFooterContact";

const shopLinks = [
  { label: "Electrical", href: "/shop/electrical" },
  { label: "Lighting", href: "/shop/lighting" },
  { label: "Tiles & Stone", href: "/shop/tiles-stone" },
  { label: "Paint & Finishes", href: "/shop/paint-finishes" },
  { label: "False Ceiling", href: "/shop/false-ceiling" },
  { label: "Flooring", href: "/shop/flooring" },
  { label: "Doors & Windows", href: "/shop/doors-windows" },
  { label: "Hardware & Fittings", href: "/shop/hardware-fittings" },
  { label: "Furniture & Plywood", href: "/shop/furniture" },
  { label: "Kitchen & Wardrobe", href: "/shop/kitchen-wardrobe" },
  { label: "Plumbing & Sanitary", href: "/shop/plumbing-sanitary" },
  { label: "Wall & Surface", href: "/shop/wall-surface" },
  { label: "Explore All 20 Categories →", href: "/shop" },
];

const helpLinks = [
  { label: "Buying Guides & Calculators", href: "/guides" },
  { label: "For Architects", href: "/for-architects" },
  { label: "For Interior Designers", href: "/for-interior-designers" },
  { label: "For Contractors", href: "/for-contractors" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Replacements", href: "/returns-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Frequently Asked Questions", href: "/faq" },
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
    <>
      {/* ── DESKTOP & TABLET FOOTER (md:block) ── */}
      <footer className="bg-[#052a51] text-white pt-16 pb-8 border-t border-white/10 hidden md:block">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
          {/* Main 4-column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
            {/* Col 1: Brand info (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-8">
              <div className="flex items-center gap-3">
                <Link href="/" className="inline-flex items-center bg-white px-4 py-2 rounded-2xl shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo/intri-web-logo.png"
                    alt="Intrihub Logo"
                    width={150}
                    height={32}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
              </div>
              <p className="text-sm leading-relaxed mb-4 text-white/80">
                <strong>Everything for Every Space.</strong> India's complete interior & construction supply platform — tiles, electrical, plumbing, hardware, plywood, granite, aluminum doors & wallpaper delivered directly to your site.
              </p>
              {/* Free delivery badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F26522]/20 border border-[#F26522]/30 rounded-full text-[#F26522] text-xs font-bold mb-5">
                <Truck size={14} />
                <span>Free delivery above ₹15,000</span>
              </div>

              {/* Socials */}
              <div className="flex gap-2.5">
                <a
                  href="https://www.instagram.com/intrihub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] text-white transition-all hover:scale-110"
                  aria-label="Instagram"
                  title="Follow IntriHub on Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/intrihub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0077b5] text-white transition-all hover:scale-110"
                  aria-label="LinkedIn"
                  title="Connect with IntriHub on LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.46a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/intrihub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877f2] text-white transition-all hover:scale-110"
                  aria-label="Facebook"
                  title="Follow IntriHub on Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/919264920211"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] text-white transition-all hover:scale-110"
                  aria-label="WhatsApp Support"
                  title="Chat with IntriHub Support on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Shop Categories */}
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Shop Categories</h3>
              <ul className="space-y-2.5">
                {shopLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs hover:text-[#F26522] transition-colors flex items-center gap-2 group"
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
              <h3 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Help & Info</h3>
              <ul className="space-y-3">
                {helpLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm hover:text-[#F26522] transition-colors flex items-center gap-2 group"
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
              <h3 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Contact Us</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <RotatingFooterContact />
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[#F26522] shrink-0" />
                  <span>Mon – Sat: 8:00 AM – 8:00 PM</span>
                </li>
              </ul>

              {/* Trust badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Lock size={14} className="text-[#1E9E6B] shrink-0" />
                  <span>Secure payments via Razorpay</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck size={14} className="text-[#1E9E6B] shrink-0" />
                  <span>100% Genuine Project Materials</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Package size={14} className="text-[#F26522] shrink-0" />
                  <span>Direct Site Dispatch & Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} IntriHub. All Rights Reserved.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/returns-policy" className="hover:text-white transition-colors">Returns</Link>
              <span>·</span>
              <Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link>
            </div>
            <p className="flex items-center gap-1.5 flex-wrap justify-center">
              <span>Founded & Developed by</span>
              <a
                href="https://www.instagram.com/sahil_sheikh78/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#F26522] font-black transition-colors underline underline-offset-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md"
              >
                <span>Sahil Sheikh</span>
                <ArrowRight size={11} />
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ── MOBILE VIEWPORT FOOTER ── */}
      <footer className="md:hidden bg-[#031b34] text-white px-4 py-8 border-t border-white/10 text-center space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-white/80 leading-relaxed max-w-xs mx-auto">
            <strong>IntriHub</strong> — India&apos;s instant building & interior materials marketplace. Direct factory delivery within 60 minutes.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <a
              href="https://wa.me/919264920211"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <MessageCircle size={14} className="text-[#1E9E6B]" />
              <span>WhatsApp Desk</span>
            </a>
            <a
              href="tel:+919264920211"
              className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PhoneCall size={14} className="text-[#F26522]" />
              <span>+91 92649 20211</span>
            </a>
          </div>

          <div className="text-[11px] text-white/60 space-y-1">
            <p className="font-bold text-white/90">Intrihub Registered Office</p>
            <p>41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114</p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] text-white/50 pt-2 border-t border-white/10">
            <Link href="/about" className="hover:text-white">About Intrihub</Link>
            <span>•</span>
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>

          <div className="text-[10px] text-white/40 pt-2">
            <p>© {new Date().getFullYear()} IntriHub QuickCommerce. All Rights Reserved.</p>
            <p className="mt-1">
              Founded & Developed by{" "}
              <a
                href="https://www.instagram.com/sahil_sheikh78/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#F26522] font-bold underline"
              >
                Sahil Sheikh
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
