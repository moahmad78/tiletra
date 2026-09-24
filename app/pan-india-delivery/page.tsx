import { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Zap,
  Building2,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Package,
  ShieldCheck,
  MapPin,
  Clock,
  ChevronRight,
  Handshake,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Pan-India Building Materials Delivery | IntriHub",
  description:
    "IntriHub delivers construction & interior materials across India in 3-7 days, with 60-minute instant delivery in Bengaluru. Expanding local vendor network nationwide.",
  alternates: {
    canonical: getCanonicalUrl("/pan-india-delivery"),
  },
  openGraph: {
    title: "Pan-India Building Materials Delivery | IntriHub",
    description:
      "IntriHub delivers construction & interior materials across India in 3-7 days, with 60-minute instant delivery in Bengaluru. Expanding local vendor network nationwide.",
    url: getCanonicalUrl("/pan-india-delivery"),
    type: "website",
    siteName: "IntriHub",
  },
};

const statesList = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi (NCR)",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function PanIndiaDeliveryPage() {
  const breadcrumbItems = [
    { name: "Home", url: BASE_SITE_URL },
    { name: "Pan-India Delivery", url: `${BASE_SITE_URL}/pan-india-delivery` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_SITE_URL}/pan-india-delivery#webpage`,
    url: `${BASE_SITE_URL}/pan-india-delivery`,
    name: "Pan-India Delivery — Building & Interior Materials Delivered Across India",
    description:
      "IntriHub delivers construction & interior materials across India in 3-7 days, with 60-minute instant delivery in Bengaluru. Expanding local vendor network nationwide.",
    breadcrumb: breadcrumbSchema,
    provider: {
      "@type": "Organization",
      name: "IntriHub",
      url: BASE_SITE_URL,
      logo: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <JsonLd data={breadcrumbSchema} id="pan-india-breadcrumb-schema" />
      <JsonLd data={pageSchema} id="pan-india-page-schema" />
      <Header />

      <main className="flex-1">
        {/* Breadcrumbs Navigation */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
                <li>
                  <Link href="/" className="hover:text-[#F26522] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <ChevronRight size={14} className="text-slate-400" />
                </li>
                <li className="font-medium text-slate-900" aria-current="page">
                  Pan-India Delivery
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#052a51] to-[#031d38] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#F26522_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] text-xs sm:text-sm font-semibold mb-6">
              <Truck size={16} />
              <span>Nationwide Logistics Network</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              Pan-India Delivery — Building &amp; Interior Materials Delivered Across India
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              At IntriHub, we&apos;re committed to making quality building and interior materials accessible across India — not just Bengaluru.
            </p>
          </div>
        </section>

        {/* Core Delivery Models Section */}
        <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Bengaluru Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:border-[#F26522]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center mb-6">
                <Zap size={26} className="text-[#F26522]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>⚡ 60-Minute Delivery in Bengaluru</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Our home base runs on a quick-commerce model — order tiles, electricals, plumbing supplies, or hardware and get them delivered to your site within 60 minutes, thanks to our network of local micro-dark stores across the city.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <Clock size={15} />
                <span>Hyperlocal micro-dark stores across Bengaluru</span>
              </div>
            </div>

            {/* Pan-India Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:border-[#052a51]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#052a51]/10 text-[#052a51] flex items-center justify-center mb-6">
                <Truck size={26} className="text-[#052a51]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>🚚 Pan-India Delivery — 3 to 7 Business Days</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Outside Bengaluru, we currently deliver across India within 3-7 business days, depending on your location and order size. This covers our full catalog — tiles, granite, electrical goods, plumbing materials, plywood, hardware, and more — shipped factory-direct to your doorstep or site.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#052a51] bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                <ShieldCheck size={15} />
                <span>Factory-direct dispatch with tracking</span>
              </div>
            </div>
          </div>

          {/* Expansion Roadmap Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#052a51] text-white rounded-2xl p-6 sm:p-10 shadow-lg mb-14 relative overflow-hidden">
            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-4">
                <Building2 size={14} className="text-[#F26522]" />
                <span>Network Expansion</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold mb-4 flex items-center gap-2">
                <span>🏗️ Expanding to 60-Minute Delivery, City by City</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                We&apos;re actively onboarding local vendor partners state-by-state and city-by-city. As we establish local fulfillment in each new region, that city will move from our standard 3-7 day Pan-India delivery to the same 60-minute instant delivery we offer in Bengaluru today. If you&apos;re a supplier or vendor in your city and want to partner with us, get in touch.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/vendor/apply"
                  className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#d9531e] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-md"
                >
                  <Handshake size={16} />
                  <span>Become a Vendor Partner</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  <Package size={16} />
                  <span>Explore Full Catalog</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Coverage States Plain Text Section */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-14">
            <div className="flex items-center gap-2.5 mb-4">
              <MapPin size={20} className="text-[#F26522]" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                States &amp; Territories Covered Nationwide
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              We deliver direct-to-site across all Indian states and Union Territories through our logistics network:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs text-slate-700">
              {statesList.map((state) => (
                <div
                  key={state}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Block */}
          <div className="bg-[#F26522]/5 border-2 border-[#F26522]/30 rounded-2xl p-6 sm:p-10 text-center">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
              Ready to order for your project, anywhere in India?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Browse our full catalog or WhatsApp our material specialists for bulk pricing and delivery timelines specific to your location.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#052a51] hover:bg-[#031d38] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <Package size={17} />
                <span>Browse Catalog</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://wa.me/917090120211?text=Hi%20IntriHub%2C%20I%20would%20like%20to%20inquire%20about%20Pan-India%20delivery%20and%20bulk%20pricing%20for%20my%20project."
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <MessageCircle size={17} />
                <span>Chat on WhatsApp (+91 70901 20211)</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
