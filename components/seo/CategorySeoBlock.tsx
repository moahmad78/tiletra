import Link from "next/link";
import { getCategorySeo } from "@/lib/data/category-seo";
import { SEO_LOCATIONS } from "@/lib/data/seo-locations";
import { categories as allCategories } from "@/lib/data/categories";
import { ChevronRight, MapPin, ArrowRight } from "lucide-react";

interface CategorySeoBlockProps {
  categorySlug: string;
  categoryName: string;
}

/**
 * SEO content block placed BELOW the product grid on /shop/[category] pages.
 * Never above the fold — products must be the first thing users see.
 */
const CATEGORY_HUBS_DATA: Record<
  string,
  {
    guide?: { title: string; href: string; badge: string; desc: string };
    subcategories?: Array<{ label: string; href: string }>;
    priceGuides?: Array<{ label: string; href: string }>;
  }
> = {
  "tiles-stone": {
    guide: {
      title: "Vitrified Tiles Online: Complete Buying Guide for Indian Homes (2026)",
      href: "/guides/vitrified-tiles-online-buying-guide",
      badge: "Technical Buying Guide",
      desc: "GVT, PGVT, double charge or full body? Learn size selection, surface finishes, and 7 essential pre-order checks.",
    },
    subcategories: [
      { label: "Vitrified Tiles Online", href: "/tiles/vitrified-tiles" },
      { label: "Floor Tiles Collection", href: "/tiles/floor-tiles" },
      { label: "Wall Tiles for Living & Kitchen", href: "/tiles/wall-tiles" },
      { label: "Anti-Skid Bathroom Tiles", href: "/tiles/bathroom-tiles" },
    ],
    priceGuides: [
      { label: "Vitrified Tiles Price in Bangalore", href: "/vitrified-tiles-price-in-bangalore" },
      { label: "Wall Tiles Price per Sq.Ft", href: "/wall-tiles-price-per-sq-ft" },
      { label: "Bathroom Tiles Price Guide", href: "/bathroom-tiles-price-in-bangalore" },
    ],
  },
  furniture: {
    subcategories: [
      { label: "Marine Grade Plywood", href: "/plywood/marine-plywood" },
      { label: "IS:710 Waterproof BWP Plywood", href: "/plywood/710-waterproof-plywood" },
      { label: "MDF & Interior Boards", href: "/plywood/mdf-board" },
    ],
    priceGuides: [
      { label: "Plywood Price per Sheet in Bangalore", href: "/plywood-price-per-sheet-bangalore" },
    ],
  },
  electrical: {
    subcategories: [
      { label: "FRLS Electrical Wires & Power Cables", href: "/electrical/wires-and-cables" },
      { label: "Modular Switches & Wall Sockets", href: "/electrical/switches-and-sockets" },
    ],
    priceGuides: [
      { label: "Electrical Wire Price per Meter", href: "/electrical-wire-price-per-meter" },
    ],
  },
  "plumbing-sanitary": {
    subcategories: [
      { label: "CPVC High-Pressure Water Pipes", href: "/plumbing/cpvc-pipes" },
      { label: "Ceramic Wash Basins & Sanitaryware", href: "/sanitaryware/wash-basin" },
    ],
    priceGuides: [
      { label: "CPVC Pipe Price List Bangalore", href: "/cpvc-pipe-price-list" },
    ],
  },
  "hardware-fittings": {
    subcategories: [
      { label: "Architectural Hardware & Door Fittings", href: "/hardware/door-fittings" },
    ],
  },
};

export default function CategorySeoBlock({ categorySlug, categoryName }: CategorySeoBlockProps) {
  const seo = getCategorySeo(categorySlug);
  const hubData = CATEGORY_HUBS_DATA[categorySlug];

  // Cross-link categories (filter out self + missing slugs)
  const crossLinkCategories = seo.crossLinks
    .map((slug) => allCategories.find((c) => c.slug === slug))
    .filter(Boolean) as typeof allCategories;

  const guide = hubData?.guide || (seo.guideLink ? {
    title: seo.guideLink.title,
    href: seo.guideLink.href,
    badge: "Official Buying Guide",
    desc: `Learn specifications, size selection, and installation best practices for ${categoryName}.`,
  } : undefined);

  return (
    <section className="mt-12 border-t border-gray-200 pt-10 space-y-10">
      {/* ── Featured Technical Buying Guide Link ── */}
      {guide && (
        <div className="bg-gradient-to-br from-[#052A51] to-[#093A6D] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md border border-blue-900/40">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF9900]">
              {guide.badge}
            </span>
            <h3 className="text-xl sm:text-2xl font-black">{guide.title}</h3>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">{guide.desc}</p>
          </div>
          <Link
            href={guide.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-md self-start sm:self-center"
          >
            <span>Read Buying Guide</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* ── Sub-category Sections & Crawlable Links (per SEO spec) ── */}
      {seo.subCategoryH2s && seo.subCategoryH2s.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-black text-[#052a51]">
            Explore {categoryName} Sub-Categories
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {seo.subCategoryH2s.map((subName) => (
              <span
                key={subName}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 shadow-2xs"
              >
                {subName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Popular Subcategories & Specific Materials ── */}
      {hubData?.subcategories && hubData.subcategories.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-[#052a51] mb-3">
            Popular {categoryName} Specifications &amp; Quick Links
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {hubData.subcategories.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 hover:border-[#F26522] hover:text-[#052a51] hover:bg-[#F26522]/5 transition-all shadow-2xs"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Price Intent Guides ── */}
      {hubData?.priceGuides && hubData.priceGuides.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-[#052a51] mb-3">
            Current {categoryName} Market Price Guides &amp; Estimation Tools
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {hubData.priceGuides.map((pg) => (
              <Link
                key={pg.href}
                href={pg.href}
                className="px-4 py-2 rounded-xl border border-blue-200/80 bg-blue-50/50 text-xs font-bold text-[#052a51] hover:border-[#052a51] hover:bg-blue-100/60 transition-all shadow-2xs"
              >
                📊 {pg.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── SEO Prose Block (150-250 words unique intro copy) ── */}
      <div className="max-w-4xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-black text-[#052a51] mb-4 leading-tight">
          {seo.h1 || seo.seoHeading}
        </h2>
        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-gray-700 space-y-4">
          {seo.introContent.split("\n\n").map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      </div>

      {/* ── Shop by Area ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-[#F26522]" />
          <h3 className="text-lg font-black text-[#052a51]">
            Shop {categoryName} by Delivery Area — Bengaluru &amp; Karnataka Hubs
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SEO_LOCATIONS.map((loc) => (
            <Link
              key={loc.slug}
              href={`/shop/${categorySlug}/${loc.slug}`}
              className="group flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#F26522]/40 hover:bg-[#F26522]/5 transition-all"
            >
              <span className="text-[13px] font-bold text-gray-800 group-hover:text-[#052a51] leading-tight">
                {loc.name}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">{loc.area}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Category FAQs ── */}
      {seo.faqs.length > 0 && (
        <div className="max-w-3xl">
          <h3 className="text-lg font-black text-[#052a51] mb-4">
            Frequently Asked Questions — {categoryName} in Bangalore
          </h3>
          <div className="space-y-4">
            {seo.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-gray-200 bg-white overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-bold text-[14px] text-gray-800 select-none hover:bg-gray-50 transition-colors">
                  {faq.question}
                  <ChevronRight
                    size={16}
                    className="text-gray-400 shrink-0 transition-transform group-open:rotate-90"
                  />
                </summary>
                <div className="px-5 pb-4 text-[14px] text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ── Cross-Category Links ── */}
      {crossLinkCategories.length > 0 && (
        <div>
          <h3 className="text-base font-black text-gray-700 mb-3">
            Need something else for your project?
          </h3>
          <div className="flex flex-wrap gap-3">
            {crossLinkCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-700 hover:border-[#052a51]/30 hover:bg-[#052a51]/5 hover:text-[#052a51] transition-all"
              >
                {cat.name}
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
