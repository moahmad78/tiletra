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

const helpLinksConfig = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Buying Guides & Checklists", href: "/guides" },
  { label: "Bulk Project Orders", href: "/bulk-orders" },
  { label: "Frequently Asked Questions", href: "/faq" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns & Replacements", href: "/returns-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
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
        {/* Main Grid: Clean 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-10 border-b border-white/10">
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
            <p className="text-xs sm:text-sm leading-relaxed text-white/80 max-w-lg">
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

          {/* Col 2: Help & Support (Essential Links Only) */}
          <div>
            <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-[2px] mb-4">Help &amp; Support</h3>
            <ul className="space-y-2.5">
              {helpLinksConfig.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs sm:text-sm text-white/80 hover:text-[#F26522] transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F26522]/50 group-hover:bg-[#F26522] transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact Us & Trust Badges */}
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
            <div className="mt-5 space-y-2 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/75">
                <Lock size={13} className="text-[#1E9E6B] shrink-0" />
                <span>Secure payments via Razorpay</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/75">
                <ShieldCheck size={13} className="text-[#1E9E6B] shrink-0" />
                <span>100% Genuine Project Materials</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/75">
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

        {/* We Deliver Across India Section */}
        <div className="py-5 border-b border-white/10 text-xs text-white/70 bg-white/[0.02] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 rounded-xl my-4">
          <h4 className="mb-1.5">
            <Link
              href="/pan-india-delivery"
              className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider hover:text-[#F26522] transition-colors inline-flex items-center gap-1.5 group"
            >
              <span>We Deliver Across India</span>
              <ArrowRight size={14} className="text-[#F26522] group-hover:translate-x-1 transition-transform" />
            </Link>
          </h4>
          <p className="text-white/80 leading-relaxed text-xs sm:text-sm">
            We deliver building &amp; interior materials with guaranteed 60-minute delivery in Bengaluru; 3-7 days Pan-India (outside Bengaluru).
          </p>
        </div>

        {/* Corporate Legal & Registered Office Info */}
        <div className="py-4 border-t border-white/10 text-xs text-white/80 bg-white/[0.03] rounded-2xl px-5 sm:px-6 my-4 border border-white/10 space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
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
