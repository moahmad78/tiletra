"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Truck,
  Lock,
  ShieldCheck,
  Package,
  ArrowRight,
  Zap,
  Building2,
} from "lucide-react";
import {
  PHONE_DISPLAY,
  PHONE_TEL,
  COMPANY_NAME,
  CIN,
  REGISTERED_OFFICE_STRING,
  EMAIL,
} from "@/lib/siteConfig";

// Essential Help & Support Links (Strictly non-duplicate; Policies are in the bottom bar)
const helpLinksConfig = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Buying Guides & Checklists", href: "/guides" },
  { label: "Bulk Project Orders", href: "/bulk-orders" },
  { label: "Why IntriHub? (20 Reasons)", href: "/why-intrihub" },
  { label: "Frequently Asked Questions (FAQ)", href: "/faq" },
  { label: "Founder's Vision", href: "/founder" },
  { label: "Pan-India Delivery Scope", href: "/pan-india-delivery" },
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
          {/* Col 1: Brand info, Highlights & Social Icons (Spans 2 cols on md and lg) */}
          <div className="md:col-span-2 lg:col-span-2 space-y-4 pr-0 lg:pr-8">
            {/* Logo: No rounded border radius, tighter padding, larger display */}
            <div className="flex items-center gap-3 notranslate" translate="no">
              <Link
                href="/"
                aria-label="Intrihub Home"
                className="inline-flex items-center bg-white px-2 py-0.5 rounded-none shadow-xs notranslate"
                translate="no"
              >
                <Image
                  src="/logo/intri-web-logo.png"
                  alt="IntriHub QuickCommerce"
                  width={220}
                  height={52}
                  unoptimized
                  priority
                  className="h-11 sm:h-12 w-auto object-contain"
                />
              </Link>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-white/80 max-w-lg">
              <strong className="text-white">Every Material. Every Space.</strong> India&apos;s complete interior &amp; construction supply platform — tiles, electrical, plumbing, hardware, plywood, granite, aluminum doors &amp; wallpaper delivered directly to your site.
            </p>

            {/* Service & Trust Highlights to gracefully fill column space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Zap size={15} className="text-[#FF9900] shrink-0" />
                <span className="text-xs text-white/90 font-medium">60-Min Express Site Dispatch</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <ShieldCheck size={15} className="text-[#1E9E6B] shrink-0" />
                <span className="text-xs text-white/90 font-medium">100% Genuine Project Materials</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Building2 size={15} className="text-[#F26522] shrink-0" />
                <span className="text-xs text-white/90 font-medium">Direct Factory Sourcing</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Truck size={15} className="text-[#38BDF8] shrink-0" />
                <span className="text-xs text-white/90 font-medium">Pan-India Freight Logistics</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="pt-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
                Connect With Us
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/917090120211"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-[#25D366] shadow-xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.076-2.003-.464-1.503-.621-2.463-2.148-2.538-2.247-.074-.099-.607-.808-.607-1.543s.385-1.096.521-1.246c.137-.149.301-.186.402-.186.103 0 .205.002.296.006.096.004.224-.036.351.269.13.313.447 1.09.486 1.17.04.079.066.173.013.279-.052.106-.079.172-.157.264-.078.093-.165.207-.235.279-.08.082-.163.171-.07.33.092.158.409.675.877 1.091.603.536 1.11.701 1.269.78.159.079.252.066.345-.041.093-.106.398-.463.504-.622.106-.159.212-.132.358-.079.146.053.929.438 1.088.518.159.079.265.119.305.185.04.066.04.384-.104.789zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.76.459 3.474 1.333 4.989l-1.417 5.176 5.31-1.393c1.46.793 3.111 1.228 4.774 1.228 5.514 0 10-4.486 10-10 0-5.514-4.486-10-10-10z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/intrihub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow IntriHub on Instagram"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-[#E4405F] shadow-xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/intrihub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect on LinkedIn"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-[#0A66C2] shadow-xs"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/intrihub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Like IntriHub on Facebook"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-[#1877F2] shadow-xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com/@intrihub"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Subscribe on YouTube"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-[#FF0000] shadow-xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  href="https://x.com/intrihub"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow IntriHub on X"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 hover:bg-black shadow-xs"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Help & Support (Essential Non-Duplicate Links Only) */}
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
          <p className="text-white/50 leading-relaxed text-[11px] sm:text-xs pt-1.5">
            Karnataka, Tamil Nadu, Kerala, Telangana, Andhra Pradesh, Goa, Delhi (NCR), Uttar Pradesh, Haryana, Punjab, Rajasthan, Uttarakhand, Himachal Pradesh, West Bengal, Bihar, Odisha, Jharkhand, Assam, Sikkim, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Maharashtra, Gujarat, Madhya Pradesh, Chhattisgarh, and other Union Territories.
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
