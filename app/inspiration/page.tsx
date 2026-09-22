import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass, Palette } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Interior Design Inspiration & Trending Materials | IntriHub",
  description:
    "Explore architectural mood boards, trending surface finishes, and designer material inspirations for residential and commercial spaces across Bengaluru.",
  alternates: {
    canonical: getCanonicalUrl("/inspiration"),
  },
  openGraph: {
    title: "Interior Design Inspiration & Trending Materials | IntriHub",
    description:
      "Explore architectural mood boards, trending surface finishes, and designer material inspirations for residential and commercial spaces.",
    url: getCanonicalUrl("/inspiration"),
    type: "website",
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "IntriHub Material Inspiration",
      },
    ],
  },
};

const trendingFinishes = [
  {
    slug: "matte-tiles-bangalore",
    title: "Matte Tiles in Bangalore",
    category: "Surface Finishes",
    description: "Modern tactile matte surfaces offering subtle light diffusion, anti-skid safety, and refined Scandinavian minimalism.",
    badge: "Architectural Favorite",
  },
  {
    slug: "terracotta-look-tiles",
    title: "Terracotta Look Tiles",
    category: "Tiles & Stone",
    description: "Warm, sun-baked clay aesthetics combining rustic South Indian heritage with the zero-porosity durability of vitrified porcelain.",
    badge: "Biophilic Trend",
  },
  {
    slug: "sandstone-effect-tiles",
    title: "Sandstone Effect Tiles",
    category: "Tiles & Stone",
    description: "Natural sedimentary grain textures ideal for organic living spaces, serene courtyards, and light-filled verandas.",
    badge: "Organic Texture",
  },
  {
    slug: "warm-travertine-tiles",
    title: "Warm Travertine Tiles",
    category: "Luxury Surfaces",
    description: "Roman cross-cut vein textures in creamy beige and earthy ivory, delivering understated Mediterranean opulence.",
    badge: "Classic Luxury",
  },
  {
    slug: "honey-oak-wood-tiles",
    title: "Honey Oak Wood Tiles",
    category: "Flooring",
    description: "Warm timber plank vitrified tiles that replicate natural European oak grains without the risk of water damage or termite rot.",
    badge: "Timeless Flooring",
  },
  {
    slug: "e0-grade-plywood",
    title: "E0 Grade Safe Plywood",
    category: "Sustainable Panels",
    description: "Zero-formaldehyde emission engineered panels engineered for child-safe bedrooms, medical suites, and healthy residential interiors.",
    badge: "Health & Safety",
  },
  {
    slug: "plywood-veneer-designs",
    title: "Plywood Veneer Designs",
    category: "Bespoke Millwork",
    description: "Quarter-cut and crown-cut natural timber veneers offering striking flitch patterns for bespoke cabinetry and feature walls.",
    badge: "Artisan Joinery",
  },
  {
    slug: "modular-plywood-furniture",
    title: "Modular Furniture Materials",
    category: "Joinery & Hardware",
    description: "Calibrated BWP core panels and precision joinery hardware designed for durable modular kitchens and ergonomic workspaces.",
    badge: "Modern Living",
  },
  {
    slug: "acoustic-panels-interior",
    title: "Acoustic Panels Interior",
    category: "Acoustics & Walls",
    description: "Slat wall wooden acoustic baffles with sound-absorbing recycled felt backing to dampen flutter echo in open-plan spaces.",
    badge: "Sound Architecture",
  },
  {
    slug: "nature-inspired-laminates",
    title: "Nature-Inspired Laminates",
    category: "Laminates & Veneers",
    description: "Super-matte tactile laminates reproducing natural stone, linen fabrics, and oxidized metals with anti-fingerprint thermal healing.",
    badge: "Surface Innovation",
  },
];

const designThemes = [
  {
    title: "Warm Scandinavian Minimalism",
    desc: "Neutral pale palettes, honey oak flooring, matte white surfaces, and tactile linen laminates that maximize ambient daylight.",
    color: "from-amber-500/10 to-orange-500/10",
  },
  {
    title: "Modern Biophilic & Terracotta",
    desc: "Earthy clay tiles, natural timber slats, and indoor greenery integration creating grounding, stress-reducing domestic environments.",
    color: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Contemporary Industrial Chic",
    desc: "Exposed brick slips, textured concrete finishes, matte black electrical switches, and linear acoustic slatted walls.",
    color: "from-slate-500/10 to-gray-500/10",
  },
];

export default function InspirationPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Inspiration & Trends", url: "/inspiration" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#021830] text-white rounded-3xl p-6 sm:p-10 md:p-14 mb-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#F26522]/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles size={14} />
                Design Mood Boards &amp; Surface Trends
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Architectural Material Inspiration
              </h1>
              <p className="text-sm sm:text-base text-gray-300 mt-4 leading-relaxed">
                Discover trending textures, biophilic surfaces, and contemporary material pairings. Sourced direct from certified manufacturers and delivered on-site across Bengaluru.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href="/shop"
                  className="px-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs transition-all shadow-xs"
                >
                  Explore All Materials
                </Link>
                <Link
                  href="/guides"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15"
                >
                  Read Buying Guides
                </Link>
              </div>
            </div>
          </div>

          {/* Section: Trending Finishes (Internal Links to all 10 Trend Pages) */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#052A51] flex items-center gap-2">
                  <Palette size={22} className="text-[#F26522]" />
                  Trending Finishes &amp; Surface Aesthetics
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Click to explore technical specifications, design guides, and direct sourcing rates for each trend.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trendingFinishes.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs hover:border-[#F26522] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#F26522] border border-orange-200">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#052A51] group-hover:text-[#F26522] transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#052A51] group-hover:text-[#F26522] transition-colors">
                    <span>View Specifications &amp; Pricing</span>
                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Section: Architectural Design Concepts */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-black text-[#052A51] mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
              <Compass size={22} className="text-[#052A51]" />
              Curated Architectural Themes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {designThemes.map((theme, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border border-gray-200 bg-gradient-to-br ${theme.color} flex flex-col justify-between`}
                >
                  <div>
                    <h3 className="text-base font-black text-[#052A51] mb-2">{theme.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{theme.desc}</p>
                  </div>
                  <div className="pt-4 mt-4">
                    <Link
                      href="/shop"
                      className="text-xs font-bold text-[#052A51] hover:text-[#F26522] inline-flex items-center gap-1"
                    >
                      <span>Explore Theme Catalog</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
}
