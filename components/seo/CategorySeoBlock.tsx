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
export default function CategorySeoBlock({ categorySlug, categoryName }: CategorySeoBlockProps) {
  const seo = getCategorySeo(categorySlug);

  // Cross-link categories (filter out self + missing slugs)
  const crossLinkCategories = seo.crossLinks
    .map((slug) => allCategories.find((c) => c.slug === slug))
    .filter(Boolean) as typeof allCategories;

  return (
    <section className="mt-12 border-t border-gray-200 pt-10 space-y-10">
      {/* ── SEO Prose Block ── */}
      <div className="max-w-4xl">
        <h2 className="text-2xl font-black text-[#052a51] mb-5 leading-tight">
          {seo.seoHeading}
        </h2>
        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-gray-700 space-y-4">
          {seo.seoContent.split("\n\n").map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      </div>

      {/* ── Shop by Area ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-[#F26522]" />
          <h3 className="text-lg font-black text-[#052a51]">
            Shop {categoryName} by Area — Bangalore
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
