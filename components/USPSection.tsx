"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Layers,
  Store,
  PackageCheck,
  Truck,
  Zap,
  MapPin,
  BarChart3,
  BadgePercent,
  HardHat,
  Building,
  Home,
  Calculator,
  FolderKanban,
  RotateCcw,
  Sparkles,
  Smartphone,
  Handshake,
  FileSpreadsheet,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface USPItem {
  number: number;
  icon: React.ElementType;
  title: string;
  hindiTitle: string;
  description: string;
  badge?: string;
  category: "procurement" | "marketplace" | "logistics" | "tools" | "ecosystem";
}

const TOP_20_USPS: USPItem[] = [
  // Pillar 1: Comprehensive Site Procurement
  {
    number: 1,
    icon: Building2,
    title: "Everything for Every Space",
    hindiTitle: "Complete Space Solutions",
    description:
      "Construction, renovation aur interiors ke liye ek hi complete platform — structural foundation se lekar luxury decorative finishes tak.",
    badge: "Full Stack",
    category: "procurement",
  },
  {
    number: 2,
    icon: Layers,
    title: "One Platform, Multiple Categories",
    hindiTitle: "20+ Building Categories",
    description:
      "Electrical, vitrified tiles, granite, plumbing, paints, architectural hardware, modular lighting, plywood, sanitaryware aur decor ek sath.",
    badge: "All-in-One",
    category: "procurement",
  },
  {
    number: 3,
    icon: Store,
    title: "Multi-Vendor Marketplace",
    hindiTitle: "Bengaluru's Trusted Suppliers",
    description:
      "Bengaluru ke multiple local suppliers aur certified manufacturing hubs ko ek seamless digital marketplace mein connect karta hai.",
    badge: "Hyperlocal",
    category: "marketplace",
  },
  {
    number: 4,
    icon: PackageCheck,
    title: "One Order → Multiple Materials",
    hindiTitle: "Unified Cart & Single Billing",
    description:
      "Customer aur contractors ko alag-alag shops se manually procurement manage karne ki zarurat khatam — single consolidated checkout.",
    badge: "Convenience",
    category: "procurement",
  },
  {
    number: 5,
    icon: Truck,
    title: "Direct-to-Site Delivery",
    hindiTitle: "Site-First Delivery Model",
    description:
      "Material ko home ke saath-saath active construction & renovation sites par deliver karne ke around cushioned heavy logistics design.",
    badge: "Site-First",
    category: "logistics",
  },
  {
    number: 6,
    icon: Zap,
    title: "Fast Local Delivery",
    hindiTitle: "60-Min Hyperlocal Dispatch",
    description:
      "Nearby dark hubs aur localized vendor inventory ke basis par lightning fast fulfilment — project work kabhi halt nahi hota.",
    badge: "Express 60m",
    category: "logistics",
  },
  {
    number: 7,
    icon: MapPin,
    title: "Location-Based Vendor Discovery",
    hindiTitle: "Nearby Suppliers Pinpointed",
    description:
      "Customer ke GPS location ke according nearby suppliers, live delivery radiuses aur available materials instantly identify karna.",
    badge: "Geo-Routed",
    category: "marketplace",
  },
  {
    number: 8,
    icon: BarChart3,
    title: "Real-Time Stock Visibility",
    hindiTitle: "Live Digital Inventory",
    description:
      "“Available hai ya nahi?” ke liye phone calls aur chakkar band — vendor inventory digitally live update hoti hai.",
    badge: "Live Stock",
    category: "marketplace",
  },
  {
    number: 9,
    icon: BadgePercent,
    title: "Local Market & Direct Pricing",
    hindiTitle: "Transparent Wholesale Rates",
    description:
      "Multiple verified vendors aur direct factory hubs ke prices transparently compare karne ka real opportunity zero middleman markup ke sath.",
    badge: "Best Value",
    category: "tools",
  },
  {
    number: 10,
    icon: HardHat,
    title: "Contractor-Friendly Platform",
    hindiTitle: "Tailored for Contractors",
    description:
      "Civil & interior contractors ke repeated material requirements, daily site refills aur bulk procurement workflows ko simplify karna.",
    badge: "B2B Ready",
    category: "ecosystem",
  },
  {
    number: 11,
    icon: Building,
    title: "Builder-Friendly Procurement",
    hindiTitle: "Enterprise Bulk Sourcing",
    description:
      "Large-scale residential & commercial projects ke liye bulk volume scheduling, customized lot matching aur recurring purchasing.",
    badge: "Enterprise",
    category: "ecosystem",
  },
  {
    number: 12,
    icon: Home,
    title: "Homeowner-Friendly Shopping",
    hindiTitle: "Simple Self-Service Buying",
    description:
      "Heavy technical building materials ko bhi simple, crystal-clear visual product shopping experience mein transform karna.",
    badge: "User Friendly",
    category: "ecosystem",
  },
  {
    number: 13,
    icon: Calculator,
    title: "Smart Quantity Calculator",
    hindiTitle: "Zero-Wastage Estimator",
    description:
      "Tiles, flooring, paints, wires aur plumbing ke required box counts aur wastage buffers (+10%) calculate karne mein instant help.",
    badge: "Smart Tool",
    category: "tools",
  },
  {
    number: 14,
    icon: FolderKanban,
    title: "Project-Based Shopping",
    hindiTitle: "Room & Project Bundles",
    description:
      "“Mujhe bathroom renovate karna hai” ya “2BHK complete fitout chahiye” → required materials ko project scope ke basis par organize karna.",
    badge: "Packaged",
    category: "procurement",
  },
  {
    number: 15,
    icon: RotateCcw,
    title: "Repeat & 1-Click Reordering",
    hindiTitle: "Quick Site Refills",
    description:
      "Contractors & sites ke frequently purchased items (cement, adhesives, screws, conduits) ko dashboard se instantly repeat reorder karna.",
    badge: "Quick Order",
    category: "tools",
  },
  {
    number: 16,
    icon: Sparkles,
    title: "From One Screw to Complete Project",
    hindiTitle: "Micro to Macro Sourcing",
    description:
      "Single hardware fastener ya emergency plumbing elbow se lekar multi-storey building turnkey procurement tak sab kuch available.",
    badge: "Universal",
    category: "procurement",
  },
  {
    number: 17,
    icon: Smartphone,
    title: "Customer + Vendor Ecosystem",
    hindiTitle: "Two-Sided Unified Tech",
    description:
      "Customer app/web platform ke saath vendors ke liye dedicated real-time order processing, analytics aur billing business portal.",
    badge: "Full Ecosystem",
    category: "ecosystem",
  },
  {
    number: 18,
    icon: Handshake,
    title: "Empowering Local Businesses",
    hindiTitle: "Digitalize Bengaluru Dealers",
    description:
      "Existing traditional physical material dealers ko digitalize karke high-growth online customer base aur recurring revenue stream dena.",
    badge: "Local First",
    category: "ecosystem",
  },
  {
    number: 19,
    icon: FileSpreadsheet,
    title: "Digital Procurement & GST Invoicing",
    hindiTitle: "Automated Tax Invoicing",
    description:
      "Official HSN-coded GST tax invoices, detailed purchase records, dispatch notes aur expense audits fully digital manage karna.",
    badge: "100% Compliant",
    category: "tools",
  },
  {
    number: 20,
    icon: Globe,
    title: "Online + Offline Market Bridge",
    hindiTitle: "Phygital Trust Model",
    description:
      "Local brick-and-mortar suppliers ki authenticity aur deep inventory strength + modern quick-commerce ki high speed aur convenience.",
    badge: "Phygital",
    category: "marketplace",
  },
];

const CATEGORY_FILTERS = [
  { key: "all", label: "All 20 USPs" },
  { key: "procurement", label: "🏗️ Complete Procurement" },
  { key: "marketplace", label: "🏪 Marketplace & Hubs" },
  { key: "logistics", label: "🚚 Direct-to-Site Logistics" },
  { key: "tools", label: "📐 Smart Tools & Pricing" },
  { key: "ecosystem", label: "🤝 Pro Ecosystem" },
];

export default function USPSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredUSPs =
    activeFilter === "all"
      ? TOP_20_USPS
      : TOP_20_USPS.filter((item) => item.category === activeFilter);

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white via-slate-50 to-neutral-100 border-t border-slate-200/80">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. HERO TAGLINE BANNER — CENTRAL VALUE PROPOSITION                        */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#031b34] via-[#052a51] to-[#0a3f78] p-6 sm:p-10 text-white shadow-xl border border-white/15 mb-12 md:mb-16">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#F26522]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-4">
            {/* Slogan Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F26522]/20 border border-[#F26522]/50 text-orange-300 text-xs sm:text-sm font-black tracking-wider uppercase shadow-xs">
              <Sparkles className="w-4 h-4 text-[#F26522]" />
              <span>IntriHub Core Positioning</span>
            </div>

            {/* Central Master Tagline */}
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-bold text-orange-400 tracking-wide uppercase">
                The Master Workflow
              </p>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                One Platform <span className="text-[#F26522]">→</span> Every Material{" "}
                <span className="text-[#F26522]">→</span> One Order{" "}
                <span className="text-[#F26522]">→</span> Direct to Site
              </h2>
            </div>

            {/* Central Value Statement */}
            <p className="text-base sm:text-xl font-medium text-slate-200 max-w-3xl leading-relaxed pt-2">
              &ldquo;One Platform for Complete Construction &amp; Interior Procurement — From Material Discovery to Site Delivery.&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-400 italic">
              From one screw to a complete project — source everything transparently with 60-minute site delivery.
            </p>

            {/* 5 Core Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full pt-4 text-left">
              {[
                { title: "Complete Site Sourcing", desc: "No multi-shop running" },
                { title: "Multi-Vendor Market", desc: "Bengaluru digital network" },
                { title: "Direct-to-Site Fleet", desc: "Delivered to your project" },
                { title: "Smart Calculators", desc: "Accurate box & quantity" },
                { title: "Unified Ecosystem", desc: "Contractor + Owner + Builder" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 text-orange-400 text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>0{idx + 1}</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1 leading-snug">{item.title}</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP 20 USP GRID HEADER & FILTER BUTTONS                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="px-3.5 py-1 bg-orange-100 text-[#F26522] border border-orange-200 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-2">
              Top 20 Platform Advantages
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#052a51] tracking-tight">
              Why Bengaluru Chooses <span className="text-[#F26522]">IntriHub</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              20 powerful reasons why builders, contractors, architects, and homeowners rely on IntriHub for frictionless material procurement.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#F26522] text-white text-xs font-bold transition-all shadow-md shrink-0 self-start md:self-auto"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.key
                  ? "bg-[#052a51] text-white shadow-md scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* 3. THE 20 USPs CARD GRID                                                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredUSPs.map((usp) => {
            const Icon = usp.icon;
            return (
              <div
                key={usp.number}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#F26522]/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Top Row: Index Badge & Feature Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#052a51]/5 text-[#052a51] group-hover:bg-[#F26522]/10 group-hover:text-[#F26522] flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {usp.badge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-orange-100 text-slate-700 group-hover:text-orange-700 transition-colors">
                          {usp.badge}
                        </span>
                      )}
                      <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{usp.number}
                      </span>
                    </div>
                  </div>

                  {/* Title & Hindi Subtitle */}
                  <h4 className="text-base font-black text-slate-900 group-hover:text-[#052a51] transition-colors leading-snug">
                    {usp.title}
                  </h4>
                  <p className="text-[11px] font-bold text-[#F26522] mt-0.5">
                    {usp.hindiTitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {usp.description}
                  </p>
                </div>

                {/* Bottom subtle accent line */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 group-hover:text-[#F26522] transition-colors">
                  <span>IntriHub Certified</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. FOOTER ACTION STRIP                                                    */}
        {/* ========================================================================= */}
        <div className="mt-10 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-black text-slate-900">
                Are you a contractor, builder, or dealer in Bengaluru?
              </h5>
              <p className="text-xs text-slate-600">
                Partner with IntriHub for bulk project pricing, dedicated credit lines, and priority dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/bulk-orders"
              className="w-full sm:w-auto px-4 py-2.5 bg-[#052a51] hover:bg-[#08386a] text-white text-xs font-bold rounded-xl text-center transition-all"
            >
              Bulk Procurement Desk
            </Link>
            <Link
              href="/vendor/register"
              className="w-full sm:w-auto px-4 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl text-center transition-all"
            >
              Join as Vendor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
