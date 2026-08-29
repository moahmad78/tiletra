import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, Sparkles, ArrowRight, HeartHandshake, Mail, Award, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LEADERSHIP_TEAM } from "@/lib/data/contacts";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About IntriHub | Building & Interior Materials Marketplace Bengaluru",
  description:
    "Learn about IntriHub — India's instant building materials quick-commerce network. Founded in 2026 by Sahil Sheikh in Begur, Bengaluru to deliver factory-direct supplies in 60 minutes.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: "About IntriHub | Everything for Every Space",
    description:
      "India's instant building & interior materials quick commerce marketplace. Factory-direct sourcing with 60-minute site delivery in Bengaluru.",
    url: getCanonicalUrl("/about"),
    type: "website",
    siteName: "IntriHub",
  },
};

export default function AboutPage() {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${BASE_SITE_URL}/about#webpage`,
    name: "About IntriHub",
    url: `${BASE_SITE_URL}/about`,
    description:
      "IntriHub is India's premier quick-commerce marketplace for interior and construction materials, delivering factory-direct supplies in 60 minutes across Bengaluru.",
    mainEntity: {
      "@type": "Organization",
      "@id": `${BASE_SITE_URL}/#organization`,
      name: "IntriHub",
      alternateName: "IntriHub QuickCommerce",
      url: BASE_SITE_URL,
      foundingDate: "2026",
      founder: {
        "@type": "Person",
        name: "Sahil Sheikh",
        jobTitle: "Founder & Lead Architect",
        sameAs: "https://www.instagram.com/sahil_sheikh78/",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
        addressLocality: "Begur, Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560114",
        addressCountry: "IN",
      },
    },
  };

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(aboutPageSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
        <Header />

        {/* Hero */}
        <div className="bg-[#052a51] text-white pt-[110px] md:pt-[168px] pb-16 md:pb-24">
          <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
            <span className="px-3.5 py-1.5 bg-[#F26522]/20 border border-[#F26522]/40 rounded-full text-[#F26522] text-xs font-bold uppercase tracking-wider inline-block mb-4">
              Our Story & Mission • Founded 2026
            </span>
            <h1 className="text-[36px] sm:text-[46px] md:text-[56px] font-black leading-tight max-w-2xl mx-auto">
              Quality Supplies for <span className="text-[#F26522]">Every Space</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
              IntriHub is on a mission to revolutionize interior & construction material procurement for homeowners, architects, and builders. From electricals and plumbing to vitrified tiles, hardware, plywood, and sanitaryware, we deliver factory-fresh supplies in 60 minutes across Bengaluru & Pan-India.
            </p>
          </div>
        </div>

      {/* Story Content */}
      <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-14 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-12">
          {/* Story Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2">Why Intrihub</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#052a51] mb-4">
                Building materials shopping shouldn&apos;t be a headache.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Traditional building material procurement involves multiple middlemen, unclear pricing, high transport breakages, and endless physical showroom trips.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                We started Intrihub in Bangalore to change that — transparent unit pricing, instant room coverage calculator, curated aesthetic designs, and safe freight delivery to your doorstep.
              </p>
            </div>
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-lg bg-gray-100">
              <Image
                src="/placeholders/product.svg"
                alt="Intrihub workspace"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Our Leadership Team */}
          <div>
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="px-3 py-1 bg-blue-50 text-[#052a51] text-[11px] font-black rounded-full uppercase tracking-wider inline-block mb-2">
                Executive Board
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#052a51]">Our Leadership Team</h2>
              <p className="text-sm text-gray-500 mt-2">
                Passionate builders and operators building India&apos;s most reliable interior & construction material commerce network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LEADERSHIP_TEAM.map((member) => (
                <div
                  key={member.name}
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    member.isFounder
                      ? "bg-gradient-to-b from-orange-50/50 via-white to-white border-orange-200/80 shadow-md relative"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Header with avatar / badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                        member.isFounder
                          ? "bg-[#F26522] text-white shadow-md shadow-orange-500/20"
                          : "bg-[#052a51] text-white"
                      }`}>
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>

                      {member.isFounder ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 text-[#F26522] text-[10px] font-black uppercase tracking-wider">
                          Founder & Head
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#052a51] text-[10px] font-black uppercase tracking-wider">
                          Executive Leader
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-gray-900">{member.name}</h3>
                    <p className="text-xs font-bold text-[#F26522] mt-0.5">{member.role}</p>

                    <p className="text-xs text-gray-600 leading-relaxed mt-3">
                      {member.bio}
                    </p>
                  </div>

                  {/* Actions / Direct Contacts */}
                  <div className="pt-5 mt-5 border-t border-gray-100 flex items-center gap-2">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-gray-200/80"
                    >
                      <Mail size={13} className="text-[#F26522]" />
                      <span>{member.email}</span>
                    </a>

                    {member.social && (
                      <a
                        href={member.social}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Instagram`}
                        className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Pillars */}
          <div>
            <h3 className="text-xl font-black text-[#052a51] text-center mb-8">What We Stand For</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Grade-1 Quality",
                  desc: "Zero compromise. Every batch undergoes strict curvature and strength quality tests.",
                },
                {
                  icon: Truck,
                  title: "Safe Pan-India Freight",
                  desc: "Specialized heavy goods packaging ensuring zero breakage in transit.",
                },
                {
                  icon: Sparkles,
                  title: "Curated Aesthetics",
                  desc: "Modern textures, Moroccan encaustic, Italian marble looks, and rustic stone.",
                },
                {
                  icon: HeartHandshake,
                  title: "Direct Support",
                  desc: "Our product specialists help you estimate quantities and select the right materials.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-bold text-[#052a51] text-base mb-2">{title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#052a51] text-white p-8 rounded-2xl text-center flex flex-col items-center">
            <h3 className="text-2xl font-black">Ready to build your dream space?</h3>
            <p className="text-white/70 text-sm mt-2 max-w-md">
              Browse 10,000+ curated products across 20+ categories and get them delivered directly to your site.
            </p>
            <Link
              href="/shop"
              className="mt-6 px-8 h-12 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Browse Shop Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

        <Footer />
      </main>
    </>
  );
}
