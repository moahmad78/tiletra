import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Truck,
  Sparkles,
  Layers,
  Ruler,
  Compass,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Vitrified Tiles Online Buying Guide 2026",
  description:
    "GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.",
  alternates: {
    canonical: `${BASE_SITE_URL}/guides/vitrified-tiles-online-buying-guide`,
  },
  openGraph: {
    title: "Vitrified Tiles Online Buying Guide 2026 | IntriHub",
    description:
      "GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.",
    url: `${BASE_SITE_URL}/guides/vitrified-tiles-online-buying-guide`,
    type: "article",
    publishedTime: "2026-09-29T00:00:00.000Z",
    modifiedTime: "2026-09-29T00:00:00.000Z",
    authors: ["IntriHub"],
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/categories/cat-tiles-stone.jpg`,
        width: 1200,
        height: 630,
        alt: "Vitrified Tiles Online Complete Buying Guide for Indian Homes 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitrified Tiles Online: Buying Guide for Indian Homes 2026",
    description:
      "GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.",
    images: [`${BASE_SITE_URL}/images/categories/cat-tiles-stone.jpg`],
  },
};

const guideFaqs = [
  {
    question: "What is the primary difference between GVT and PGVT tiles?",
    answer:
      "Glazed Vitrified Tiles (GVT) feature a digitally printed decorative surface with a satin, matte, or carved texture, offering moderate light reflection and superior slip resistance. Polished Glazed Vitrified Tiles (PGVT) receive an additional high-precision nano-polishing process over the glaze, producing an ultra-glossy, mirror-like surface ideal for luxury living rooms and executive lounges.",
  },
  {
    question: "Which vitrified tile size is best for living room floors in Indian homes?",
    answer:
      "For standard Indian apartment living rooms (150 to 300 sq.ft), large-format 600x1200mm (2x4 ft) or 800x1600mm tiles are optimal. They minimize visible grout joints by up to 55% compared to conventional 2x2 ft tiles, creating an expansive, seamless marble-slab aesthetic that visually enlarges compact urban spaces.",
  },
  {
    question: "How much extra tile quantity should I order for cutting and wastage?",
    answer:
      "Always order a 10% wastage buffer for regular parallel grid laying patterns. If you are specifying complex diagonal layouts, herringbone patterns, or working in rooms with multiple curved alcoves and plumbing cutouts, allocate a 12% to 15% cutting allowance. Ordering adequate quantity in a single production batch guarantees consistent shade tonality and dimensional calibration.",
  },
  {
    question: "Can vitrified tiles be laid directly over existing mosaic or marble flooring?",
    answer:
      "Yes, vitrified tiles can be successfully installed over existing clean, sound mosaic or terrazzo flooring using high-bond Type 2 polymer-modified tile-on-tile adhesive (such as C2TE formulation). This technique avoids noisy, time-consuming floor dismantling while maintaining rigid structural adhesion.",
  },
  {
    question: "What is IntriHub's delivery timeline for vitrified tile orders?",
    answer:
      "IntriHub delivers with guaranteed 60-minute delivery in Bengaluru; 3-7 days Pan-India (outside Bengaluru). Orders are dispatched in heavy-duty palletized crates with reinforced edge protectors to ensure zero transit breakage directly to your construction or renovation site.",
  },
];

export default function VitrifiedTilesBuyingGuidePage() {
  const pageUrl = `${BASE_SITE_URL}/guides/vitrified-tiles-online-buying-guide`;

  // Unified single application/ld+json graph schema
  const unifiedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        isPartOf: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        headline: "Vitrified Tiles Online: Complete Buying Guide for Indian Homes (2026)",
        description:
          "GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.",
        image: [`${BASE_SITE_URL}/images/categories/cat-tiles-stone.jpg`],
        datePublished: "2026-09-29T00:00:00.000Z",
        dateModified: "2026-09-29T00:00:00.000Z",
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "IntriHub",
          url: BASE_SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
          },
        },
        publisher: {
          "@type": "Organization",
          name: "IntriHub",
          url: BASE_SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BASE_SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides",
            item: `${BASE_SITE_URL}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Vitrified Tiles Online Buying Guide",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: guideFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchema) }}
      />

      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <article className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 flex-wrap"
          >
            <Link href="/" className="hover:text-[#052A51] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link href="/guides" className="hover:text-[#052A51] transition-colors">
              Guides
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-[280px] sm:max-w-md">
              Vitrified Tiles Online Buying Guide
            </span>
          </nav>

          {/* Article Header Card */}
          <header className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#052A51]/10 text-[#052A51] text-xs font-bold uppercase tracking-wider mb-4">
              <Layers size={13} />
              Tiles &amp; Flooring Technical Guide
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Vitrified Tiles Online: Complete Buying Guide for Indian Homes (2026)
            </h1>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#052A51] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  I
                </div>
                <div>
                  <p className="font-bold text-slate-900">IntriHub Materials Engineering Team</p>
                  <p className="text-xs text-slate-500">Surface Engineering &amp; Sourcing Desk</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#FF9900]" />
                  Sep 29, 2026
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#052A51]" />
                  9 min read
                </span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden mt-6 bg-slate-100 border border-slate-200 shadow-xs">
              <Image
                src="/images/categories/cat-tiles-stone.jpg"
                alt="Vitrified Tiles Online Complete Buying Guide for Indian Homes 2026"
                width={1200}
                height={630}
                priority={true}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Excerpt */}
            <div className="mt-8 p-5 bg-gradient-to-r from-[#052A51]/5 to-transparent border-l-4 border-[#052A51] rounded-r-2xl">
              <p className="text-base sm:text-lg text-slate-700 font-medium italic leading-relaxed">
                GVT, PGVT, double charge or full body? Learn how to pick size, finish and thickness, and order vitrified tiles online from IntriHub in Bengaluru.
              </p>
            </div>
          </header>

          {/* Main Article Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-10 text-slate-800 space-y-12">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                1. What are vitrified tiles?
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Vitrified tiles are engineered ceramic surfaces produced through hydraulic pressing of a refined mineral mixture comprising 40% silica, 30% feldspar, and 30% kaolin clay, fired in industrial roller kilns at extreme temperatures exceeding 1200°C to 1250°C. Under this intense thermal vitrification cycle, the silica melts and fuses into a non-porous, glass-like internal matrix.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                According to the Bureau of Indian Standards (BIS IS 15622) and international standard ISO 13006 (Group BIa), a tile is technically classified as vitrified only when its water absorption rate is strictly below <strong>0.5%</strong>. In practice, premium vitrified tiles manufactured in India achieve water absorption rates lower than 0.08%, rendering them almost completely impervious to moisture, oil stains, acidic detergents, and structural debonding.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                When compared to natural marble or granite, vitrified tiles provide consistent dimensional precision, uniform thickness, zero natural fissures, and require no periodic polishing or chemical sealing. For builders ordering <Link href="/building-materials-online" className="text-[#052A51] font-semibold underline hover:text-[#F26522]">building materials online</Link>, vitrified tiles represent the most reliable, durable, and architecturally versatile floor covering for modern Indian living spaces.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                2. Types of vitrified tiles
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Understanding the technical differences among tile manufacturing methodologies is essential to selecting the right grade for your specific room conditions and vehicular or pedestrian traffic loads:
              </p>

              {/* Table Container with Horizontal Scroll */}
              <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-sm border-collapse min-w-[680px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                      <th className="p-4">Tile Classification</th>
                      <th className="p-4">Composition &amp; Layering</th>
                      <th className="p-4">Surface Finish</th>
                      <th className="p-4">Water Absorption</th>
                      <th className="p-4">Ideal Applications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">Soluble Salt / Nano Vitrified</td>
                      <td className="p-4">Single layer pressed tile with liquid color pigments infused into the surface before firing; finished with a nano-chemical seal.</td>
                      <td className="p-4">Glossy ivory / plain printed</td>
                      <td className="p-4">&lt; 0.5%</td>
                      <td className="p-4">Rental properties, budget residential bedrooms, utility areas.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">Double Charge Vitrified</td>
                      <td className="p-4">Manufactured by pressing two distinct layers of body clay: a 3mm to 4mm upper wear layer of enriched pigment over a durable base body.</td>
                      <td className="p-4">Polished glossy / semi-matte</td>
                      <td className="p-4">&lt; 0.1%</td>
                      <td className="p-4">Living rooms, office corridors, shopping malls, high foot-traffic residential spaces.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">Glazed Vitrified (GVT)</td>
                      <td className="p-4">Features a high-definition digital inkjet print layer protected beneath a specialized ceramic glaze, reproducing natural wood, slate, and marble veins.</td>
                      <td className="p-4">Matte, rustic, satin, wood-grain, carved</td>
                      <td className="p-4">&lt; 0.2%</td>
                      <td className="p-4">Kitchen floors, bathrooms, outdoor balconies, boutique cafes, feature accent walls.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">Polished Glazed (PGVT)</td>
                      <td className="p-4">GVT tile processed with an added nano-diamond polishing cycle over the glazed layer to create high specular light reflection.</td>
                      <td className="p-4">Mirror-polished high gloss</td>
                      <td className="p-4">&lt; 0.1%</td>
                      <td className="p-4">Grand living rooms, master bedrooms, hotel lobbies, modern luxury interiors.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">Full Body Vitrified</td>
                      <td className="p-4">Solid homogeneous pigment blend uniform through the entire cross-sectional thickness. Scratches or heavy wear reveal identical color beneath.</td>
                      <td className="p-4">Matte, fluted, anti-skid</td>
                      <td className="p-4">&lt; 0.05%</td>
                      <td className="p-4">Heavy vehicular parking, staircases, commercial department stores, industrial floors.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                3. How to choose the right size (2x2, 2x4, 4x4 ft)
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Tile sizing directly dictates spatial perception, installation speed, and the frequency of joint grout lines in your home. The modern industry has evolved significantly beyond old-school small squares:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <Ruler size={18} className="text-[#052A51]" />
                    <span>600x600mm (2x2 ft)</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The traditional residential standard. Highly cost-effective and easy for a single mason to handle. Ideal for smaller bedrooms, kitchens under 100 sq.ft, and budget apartment renovations.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-950 mb-2">
                    <Ruler size={18} className="text-[#F26522]" />
                    <span>600x1200mm (2x4 ft)</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    The contemporary sweet spot for Indian living rooms, dining halls, and master suites. The rectangular aspect ratio creates expansive optical length and cuts joint count in half compared to 2x2 tiles.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <Ruler size={18} className="text-[#052A51]" />
                    <span>1200x1800mm / 4x4 ft+ Slabs</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Large-format porcelain slabs designed for luxury villas and expansive duplexes. Delivers an uninterrupted Italian marble slab appearance, but requires specialized suction clamps and level subfloors.
                  </p>
                </div>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                <strong>Rule of thumb:</strong> In rooms smaller than 120 sq.ft, avoid oversized 4x4 ft slabs, as tile cutting around doorframes and columns will produce disproportionate wastage (often exceeding 20%). For living and dining areas above 200 sq.ft, 600x1200mm provides the finest balance between luxury aesthetics and low installation wastage.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                4. How to choose the right finish (glossy, matte, anti-skid, textured)
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Every surface finish serves distinct functional safety criteria and aesthetic properties:
              </p>
              <ul className="space-y-3 text-base sm:text-lg leading-relaxed text-slate-700 list-disc pl-6">
                <li>
                  <strong>Glossy &amp; High-Gloss (PGVT):</strong> Produces brilliant light bounce that brightens rooms with limited natural daylight. Extremely easy to mop clean, but becomes slippery when wet. Strictly avoid on bathroom floors or balconies.
                </li>
                <li>
                  <strong>Satin &amp; Silk Matte (GVT):</strong> Delivers a soft, velvety tactile feel without intense optical glare. Conceals minor dust, water droplet marks, and footprints significantly better than high-gloss tiles. Exceptional for bedrooms, living rooms, and kitchen backsplashes.
                </li>
                <li>
                  <strong>Anti-Skid &amp; Grip Matte (R10 / R11 Rating):</strong> Formulated with abrasive micro-granules or etched relief patterns to provide high dynamic friction (COF &gt; 0.6). Essential for wet bathroom floors, elderly-friendly residences, and utility washing yards.
                </li>
                <li>
                  <strong>Textured &amp; Sugar / Carving Finish:</strong> Incorporates localized glaze reliefs along simulated marble veins or stone clefts. Resists shoe scuffs and provides grip while delivering striking tactile dimensionality under warm cove lighting.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                5. 7 checks before ordering tiles online
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Procuring tiles through a digital marketplace delivers convenience and factory-direct savings, provided you perform these 7 technical verification checks:
              </p>
              <ol className="space-y-4 text-base sm:text-lg leading-relaxed text-slate-700 list-decimal pl-6">
                <li>
                  <strong>10% Cutting Wastage Allowance:</strong> Always calculate net room area in square feet, multiply by 1.10 (+10%), and divide by the box coverage area (typically 15.5 to 16 sq.ft for 600x600mm). Never order only the exact net floor measurement.
                </li>
                <li>
                  <strong>Single Batch &amp; Shade Code:</strong> Tiles fired in different kiln batches may exhibit slight shade variations (tonality). When ordering on IntriHub, we guarantee identical batch numbers across all boxes in your consignment.
                </li>
                <li>
                  <strong>Water Absorption Specification (&lt; 0.5%):</strong> Ensure the manufacturer technical datasheet verifies Class BIa classification per IS 15622 standards.
                </li>
                <li>
                  <strong>Rectified Edges for Tight Grout Joints:</strong> Rectified tiles have precision diamond-cut 90-degree edges, permitting razor-sharp 2mm spacer grout lines with seamless epoxy fillers.
                </li>
                <li>
                  <strong>Compatible Polymer Tile Adhesive:</strong> Vitrified tiles cannot bond with traditional sand-cement slurry because they do not absorb water. Always pair with Type 2 polymer-modified adhesive (C2TE standard).
                </li>
                <li>
                  <strong>Plumbing and Electrical Coordination:</strong> Confirm that concealed piping and electrical conduits are completed before tile installation. Consult our <Link href="/guides/interior-material-checklist-contractors" className="text-[#052A51] font-semibold underline hover:text-[#F26522]">electrical &amp; plumbing material checklist</Link> and stage-wise <Link href="/guides/building-material-list-for-house-construction-bengaluru" className="text-[#052A51] font-semibold underline hover:text-[#F26522]">construction materials guide</Link>.
                </li>
                <li>
                  <strong>Unboxing Inspection &amp; Transit Insurance:</strong> Verify that the logistics provider guarantees damage replacement. IntriHub offers 100% free zero-breakage transit replacement for broken tiles reported upon delivery.
                </li>
              </ol>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                6. Best tile for kitchen, bathroom, living room, parking (quick guide)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base mb-2">Living &amp; Dining Hall</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong>Recommended:</strong> PGVT or Satin Matte GVT in 600x1200mm format with Statuario or Italian marble patterns. Delivers an opulent, spacious feel with minimal grout interruption.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base mb-2">Kitchen Floors &amp; Backsplash</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong>Recommended:</strong> Stain-resistant GVT matte on floors; glossy subway or glazed vitrified tiles on backsplashes for effortless wiping of cooking oils and turmeric stains.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base mb-2">Bathrooms &amp; Wet Areas</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong>Recommended:</strong> Anti-skid matte vitrified tiles (300x300mm or 600x600mm with R10 grip rating) on floors; 300x600mm glossy or ceramic wall tiles up to 7-foot lintel height.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base mb-2">Driveway, Parking &amp; Verandas</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong>Recommended:</strong> 12mm to 16mm heavy-duty full-body vitrified parking tiles (300x300mm or 400x400mm) capable of bearing continuous vehicle loads and weather exposure.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                7. Vitrified vs ceramic tiles
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                While both originate from clay, their raw composition, firing pressures, and physical properties diverge substantially:
              </p>
              <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-xs my-4">
                <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                      <th className="p-4">Technical Property</th>
                      <th className="p-4">Vitrified Tiles</th>
                      <th className="p-4">Ceramic Tiles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-4 font-semibold text-slate-900">Composition</td>
                      <td className="p-4">Refined silica, quartz, feldspar, and kaolin clay</td>
                      <td className="p-4">Natural earthenware red or white clay</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-900">Water Absorption</td>
                      <td className="p-4">&lt; 0.5% (Non-porous, impervious)</td>
                      <td className="p-4">3% to 10% (Porous body)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-900">Mechanical Strength</td>
                      <td className="p-4">Very high (Modulus of Rupture &gt; 35 N/mm²)</td>
                      <td className="p-4">Moderate (Modulus of Rupture ~ 15-20 N/mm²)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-900">Durability &amp; Scratch Resistance</td>
                      <td className="p-4">MOHS hardness 6 to 8; resilient to high foot traffic</td>
                      <td className="p-4">MOHS hardness 3 to 5; prone to glaze chipping</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-900">Best Application</td>
                      <td className="p-4">Floors, high-traffic commercial spaces, exteriors</td>
                      <td className="p-4">Internal wall cladding, bathroom backsplashes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 8: CTA Block */}
            <section className="space-y-6 pt-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100">
                8. Why order vitrified tiles from IntriHub
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                IntriHub is India&apos;s digital marketplace connecting architects, builders, and homeowners directly with verified ISO-certified tile manufacturing hubs in Morbi and Rajasthan. By eliminating intermediate broker markups, we deliver transparent factory-direct pricing alongside enterprise-grade logistics.
              </p>

              {/* Branded Fleet Visual Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md my-6 group">
                <div className="relative aspect-[16/9] md:aspect-[21/9] w-full max-h-[380px]">
                  <Image
                    src="/images/marketing/intrihub-60min-express-delivery-bengaluru.jpg"
                    alt="IntriHub 60-Minute Rapid Delivery Fleet for Vitrified Tiles in Bengaluru"
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 900px"
                  />
                </div>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#052A51] to-[#093A6D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-black uppercase text-[#F26522] tracking-wider block">
                      Rapid Logistics Grid
                    </span>
                    <h4 className="text-base sm:text-lg font-bold">
                      Every Material. Every Space. Delivered Direct to Site in 60 Minutes.
                    </h4>
                  </div>
                  <Link
                    href="/shop/tiles-stone"
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Order Tiles Online</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              
              {/* Delivery Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center gap-2 font-bold text-blue-950 mb-2">
                    <Truck size={18} className="text-[#052A51]" />
                    <span>Guaranteed Rapid Delivery</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <strong>60-minute delivery in Bengaluru; 3-7 days Pan-India</strong> (outside Bengaluru). Never pause your site masons.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-950 mb-2">
                    <ShieldCheck size={18} className="text-[#F26522]" />
                    <span>Zero-Breakage Transit Guarantee</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Heavy-duty wooden crates with reinforced foam edge-guards. Any transit chip is replaced immediately free of charge.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <CheckCircle2 size={18} className="text-[#052A51]" />
                    <span>Input Tax Credit (ITC)</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Compliant B2B GST tax invoices with standardized HSN 6907 classification for seamless corporate accounting.
                  </p>
                </div>
              </div>

              {/* Master CTA Box */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#021830] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl font-black">Ready to choose your vitrified tiles?</h3>
                  <p className="text-slate-200 text-sm max-w-xl">
                    Explore 500+ verified vitrified designs, calculate box requirements with built-in wastage calculators, and get direct site dispatch.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <Link
                    href="/shop/tiles-stone"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-sm transition-all shadow-md text-center flex items-center justify-center gap-2"
                  >
                    <span>Browse vitrified tiles</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/help"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/20 text-center"
                  >
                    Bulk &amp; Project Inquiries
                  </Link>
                </div>
              </div>

              {/* Related Technical Guides & Internal Links */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 mt-6">
                <h3 className="font-bold text-slate-900 text-base">Related Technical Guides &amp; Project Resources</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Planning a complete residential or commercial build? Explore our comprehensive directory of{" "}
                  <Link href="/building-materials-online" className="text-[#052A51] underline font-semibold hover:text-[#F26522]">
                    building materials online
                  </Link>
                  , review our contractor{" "}
                  <Link href="/guides/interior-material-checklist-contractors" className="text-[#052A51] underline font-semibold hover:text-[#F26522]">
                    building material checklist
                  </Link>
                  , consult the{" "}
                  <Link href="/guides/electrical-material-selection-guide-bengaluru" className="text-[#052A51] underline font-semibold hover:text-[#F26522]">
                    electrical material selection guide
                  </Link>
                  , browse our complete{" "}
                  <Link href="/shop/tiles-stone" className="text-[#052A51] underline font-semibold hover:text-[#F26522]">
                    tiles category catalog
                  </Link>
                  , or access the full{" "}
                  <Link href="/guides" className="text-[#052A51] underline font-semibold hover:text-[#F26522]">
                    material guides knowledge base
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Section 9: FAQs */}
            <section className="space-y-6 pt-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <HelpCircle size={24} className="text-[#052A51]" />
                <span>9. FAQs (Frequently Asked Questions)</span>
              </h2>
              <div className="space-y-5">
                {guideFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Navigation Back to Guides Hub */}
          <div className="flex items-center justify-between py-6 border-t border-slate-200">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#052A51] hover:text-[#F26522] transition-colors"
            >
              <ChevronRight size={16} className="rotate-180" />
              <span>Back to all Buying Guides</span>
            </Link>
            <Link
              href="/shop/tiles-stone"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#F26522] hover:text-[#d95a1e] transition-colors"
            >
              <span>Explore Tiles &amp; Stone Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}
