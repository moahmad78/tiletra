import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO_LOCATIONS } from "@/lib/data/seo-locations";
import { categories as allCategories } from "@/lib/data/categories";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { MapPin, Truck, Clock, ShieldCheck, ArrowRight, Building, CheckCircle2 } from "lucide-react";

export const revalidate = 86400; // 24 hours ISR

export const metadata: Metadata = {
  title: "Areas We Serve — Express Building & Interior Materials Delivery across Karnataka | IntriHub",
  description:
    "Explore all serviceable delivery locations across Bengaluru and Karnataka. Factory-direct tiles, electrical wires, plumbing pipes, plywood, and hardware with express site dispatch.",
  alternates: {
    canonical: getCanonicalUrl("/areas"),
  },
  openGraph: {
    title: "Areas We Serve Across Karnataka | IntriHub QuickCommerce",
    description:
      "Find your locality in Bangalore or Karnataka. Express site delivery for construction & interior fit-out materials.",
    url: getCanonicalUrl("/areas"),
    siteName: "IntriHub",
    images: [{ url: `${BASE_SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "IntriHub Serviceable Areas" }],
  },
};

export default function AreasWeServePage() {
  // Group locations by region
  const bangaloreLocations = SEO_LOCATIONS.filter((l) => l.city === "Bengaluru");
  const karnatakaCities = SEO_LOCATIONS.filter((l) => l.city !== "Bengaluru");

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Areas We Serve", url: "/areas" },
  ]);

  // Featured categories for cross-linking
  const featuredCategories = allCategories.filter((c) => c.featured && c.productCount > 0);

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="areas-breadcrumbs-schema" />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F26522]/10 text-[#F26522] text-xs font-bold mb-4">
              <Truck size={14} /> Quick-Commerce Supply Coverage
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#052A51] tracking-tight">
              Areas We Serve Across Karnataka &amp; Pan-India
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-4 leading-relaxed">
              IntriHub operates a direct factory-to-site supply network. Delivering verified tiles, granite, electrical cables, plumbing pipes, plywood, and hardware with express dispatch directly to your job site.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <p className="text-xl font-black text-[#052A51]">Same-Day</p>
                <p className="text-xs text-gray-500">Bengaluru Dispatch</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <p className="text-xl font-black text-[#F26522]">100%</p>
                <p className="text-xs text-gray-500">GST ITC Compliant</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <p className="text-xl font-black text-[#052A51]">Zero</p>
                <p className="text-xs text-gray-500">Local Dealer Markups</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <p className="text-xl font-black text-emerald-600">22 Hubs</p>
                <p className="text-xs text-gray-500">Pan-Karnataka Freight</p>
              </div>
            </div>
          </div>

          {/* Section 1: Bengaluru Delivery Zones */}
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <MapPin size={22} className="text-[#F26522]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#052A51]">
                Bengaluru Quick-Commerce Delivery Zones
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bangaloreLocations.map((loc) => (
                <div
                  key={loc.slug}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-black text-[#052A51]">{loc.name}</h3>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {loc.dispatchWindow}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 mb-3">{loc.area} • {loc.pincodes.join(", ")}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                      {loc.localContext}
                    </p>

                    {/* Sub-areas */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {loc.serviceableSubAreas.slice(0, 4).map((sub, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category Quick Links */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Browse Supplies in {loc.name}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {featuredCategories.slice(0, 3).map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/shop/${cat.slug}/${loc.slug}`}
                          className="text-xs font-bold text-[#052A51] hover:text-[#F26522] bg-gray-50 hover:bg-[#F26522]/5 px-2.5 py-1 rounded-lg border border-gray-200/60 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      <Link
                        href={`/shop/tiles-stone/${loc.slug}`}
                        className="text-xs font-bold text-[#F26522] hover:underline px-1 py-1 flex items-center gap-0.5"
                      >
                        <span>More</span> <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Karnataka Major Cities Expansion */}
          {karnatakaCities.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
                <Building size={22} className="text-[#052A51]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#052A51]">
                  Karnataka Regional Hubs &amp; Major Cities
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {karnatakaCities.map((city) => (
                  <div
                    key={city.slug}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs hover:border-[#052A51]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-base font-black text-[#052A51] mb-1">{city.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{city.area} • {city.pincodes[0]}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{city.localContext}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">Scheduled Freight</span>
                      <Link
                        href={`/shop/tiles-stone/${city.slug}`}
                        className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
                      >
                        <span>View Catalog</span> <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/90 shadow-xs max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[#052A51] mb-6 text-center">
              Frequently Asked Questions About Delivery &amp; Coverage
            </h2>
            <div className="space-y-3">
              <details className="group rounded-2xl border border-gray-200 bg-gray-50/50 p-4 open:bg-white transition-colors">
                <summary className="font-bold text-sm text-gray-800 cursor-pointer list-none flex items-center justify-between">
                  <span>How does IntriHub achieve 20 to 60 minute delivery in Bengaluru?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  We operate a specialized heavy-materials quick-commerce dark store network centered in Begur and regional partner hubs across South, East, and North Bangalore, dispatching verified inventory immediately upon order confirmation.
                </p>
              </details>

              <details className="group rounded-2xl border border-gray-200 bg-gray-50/50 p-4 open:bg-white transition-colors">
                <summary className="font-bold text-sm text-gray-800 cursor-pointer list-none flex items-center justify-between">
                  <span>Do you deliver to towns and cities outside of Bengaluru?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  Yes, we provide scheduled regional truckload and container freight across Mysuru, Mangaluru, Hubballi-Dharwad, Belagavi, and all major Karnataka districts with safe palletized packaging and GST tax invoicing.
                </p>
              </details>

              <details className="group rounded-2xl border border-gray-200 bg-gray-50/50 p-4 open:bg-white transition-colors">
                <summary className="font-bold text-sm text-gray-800 cursor-pointer list-none flex items-center justify-between">
                  <span>Are batch dye-lot colors guaranteed if re-ordering tiles?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  Yes, our warehouse tracks exact manufacturer run numbers and dye lots. If your site falls short by a few boxes, we match the original run code to prevent visible shade discrepancies.
                </p>
              </details>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
}
