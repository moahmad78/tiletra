"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";

const shopLinks = [
  { label: "Floor Tiles", href: "/shop/floor-tiles" },
  { label: "Wall Tiles", href: "/shop/wall-tiles" },
  { label: "Bathroom Tiles", href: "/shop/bathroom-tiles" },
  { label: "Kitchen Tiles", href: "/shop/kitchen-tiles" },
  { label: "Outdoor Tiles", href: "/shop/outdoor-tiles" },
  { label: "Designer Tiles", href: "/shop/designer-tiles" },
];

const helpLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Track My Order", href: "/account/orders" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Refunds", href: "/returns-policy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  return (
    <>
      <footer className="bg-[#02152b] text-white/70 pt-[60px] pb-[30px] border-t border-white/10 hidden md:block">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">

          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="lg:col-span-1 pr-4">
              <div className="mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Tiletra/logo/web-logo.png"
                  alt="Tiletra"
                  className="h-12 opacity-100"
                />
              </div>
              <p className="text-sm leading-relaxed mb-6">
                India's premium D2C tile store. 200+ curated designs — floor, wall, bathroom, kitchen, outdoor & designer tiles delivered to your door.
              </p>
              {/* Free delivery badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F26522]/20 border border-[#F26522]/30 rounded-full text-[#F26522] text-xs font-bold mb-6">
                🚚 Free delivery above ₹15,000
              </div>
              {/* Socials */}
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/sahil_sheikh78/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F26522] text-white transition-all hover:scale-110"
                  aria-label="Instagram"
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
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 text-white transition-all hover:scale-110"
                  aria-label="YouTube"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <polygon points="10 15 15 12 10 9 10 15"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Shop Categories */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Shop</h4>
              <ul className="space-y-3">
                {shopLinks.map(({ label, href }) => (
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

            {/* Help */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Help & Info</h4>
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
              <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#F26522] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Begur, Bengaluru, Karnataka 560114</span>
                </li>
                <li>
                  <a href="tel:+917870935277" className="flex items-center gap-3 hover:text-white transition-colors">
                    <Phone size={16} className="text-[#F26522] shrink-0" />
                    +91 78709 35277
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@tiletra.in" className="flex items-center gap-3 hover:text-white transition-colors break-all">
                    <Mail size={16} className="text-[#F26522] shrink-0" />
                    hello@tiletra.in
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
                  <span>Quality guaranteed tiles</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>📦</span>
                  <span>3–7 day pan-India delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Tiletra. All Rights Reserved.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/returns-policy" className="hover:text-white transition-colors">Returns</Link>
              <span>·</span>
              <Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link>
            </div>
            <p className="flex items-center gap-1">
              Made with ❤️ in Bangalore
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp — above bottom tab bar on mobile */}
      <a
        href="https://wa.me/917870935277"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[80px] right-4 md:bottom-6 md:right-6 z-40 w-[50px] h-[50px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all group"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat on WhatsApp
        </span>
      </a>
    </>
  );
}
