"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
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
  { label: "FAQ", href: "/faq" },
  { label: "Track My Order", href: "/account/orders" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Refunds", href: "/returns-policy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/product");

  return (
    <>
      <footer className="bg-[#02152b] text-white/70 pt-[60px] pb-[30px] border-t border-white/10 hidden md:block">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">

          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand & Founder Info */}
            <div className="lg:col-span-1 pr-4">
              <div className="mb-5">
                <Link href="/" className="inline-flex items-center bg-white px-3.5 py-1.5 rounded-2xl shadow-2xs hover:opacity-95 transition-opacity">
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
                🚚 Free delivery above ₹15,000
              </div>

              {/* Socials */}
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/intrihub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] text-white transition-all hover:scale-110"
                  aria-label="Instagram"
                  title="Follow Intrihub on Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/917870935277"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] text-white transition-all hover:scale-110"
                  aria-label="WhatsApp Support"
                  title="Chat with Intrihub Support on WhatsApp"
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
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#F26522] shrink-0 mt-0.5">
                    <MapPin size={15} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-white text-xs">Our Office</span>
                    <span className="text-white/70 text-xs leading-relaxed mt-0.5">Begur, Bengaluru, Karnataka 560114</span>
                  </div>
                </li>
                <li>
                  <a href="mailto:support@intrihub.com" className="flex items-center gap-3 hover:text-white transition-colors break-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#F26522] shrink-0">
                      <Mail size={15} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-bold text-white text-xs">Customer Support</span>
                      <span className="text-white/70 text-xs mt-0.5">support@intrihub.com</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="mailto:info@intrihub.com" className="flex items-center gap-3 hover:text-white transition-colors break-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-400 shrink-0">
                      <Mail size={15} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-bold text-white text-xs">General / Corporate Info</span>
                      <span className="text-white/70 text-xs mt-0.5">info@intrihub.com</span>
                    </div>
                  </a>
                </li>
              </ul>

              {/* Trust badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-400">🔒</span>
                  <span>Secure payments via Razorpay</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>✅</span>
                  <span>100% Genuine Project Materials</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>📦</span>
                  <span>Direct Site Dispatch & Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} Intrihub Technologies. All Rights Reserved.</p>
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
              <span>Founded & Developed with ❤️ by</span>
              <a
                href="https://www.instagram.com/sahil_sheikh78/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#F26522] font-black transition-colors underline underline-offset-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md"
              >
                <span>Sahil Sheikh</span>
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
