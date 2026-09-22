"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  ShoppingBag,
  Compass,
  MessageCircle,
  PhoneCall,
  ArrowRight,
  Layers,
  Zap,
  Grid,
  Palette,
  ShieldCheck,
  Package,
} from "lucide-react";

const POPULAR_CATEGORIES = [
  { name: "Floor & Wall Tiles", slug: "tiles-stone", icon: Grid, count: "500+ designs" },
  { name: "Electrical & Wires", slug: "electrical", icon: Zap, count: "Finolex, Havells" },
  { name: "Lighting Solutions", slug: "lighting", icon: Compass, count: "LEDs & Profile" },
  { name: "Paints & Waterproofing", slug: "paint-finishes", icon: Palette, count: "Asian Paints, Berger" },
  { name: "Plumbing & Sanitary", slug: "plumbing-sanitary", icon: Layers, count: "CPVC, Jaquar" },
  { name: "Hardware & Plywood", slug: "hardware", icon: Package, count: "Marine & Commercial" },
];

export default function NotFoundClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setCurrentPath(path);

      // Track 404 Event in Google Analytics / GTM if present
      if ((window as any).gtag) {
        (window as any).gtag("event", "page_not_found_404", {
          page_path: path,
          page_referrer: document.referrer || "direct",
        });
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const whatsappReportUrl = `https://wa.me/917090120211?text=${encodeURIComponent(
    `Hi Intrihub Team, I encountered a 404 broken page on: ${currentPath || "https://www.intrihub.com"}. Please check!`
  )}`;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1 flex flex-col items-center text-center">
      {/* 404 Badge & Graphic */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-[#F26522]/20 text-[#F26522] text-xs font-black uppercase tracking-wider mb-4">
        <Compass size={14} className="animate-spin" style={{ animationDuration: "10s" }} />
        <span>404 Error: Page Missing</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#052A51] tracking-tight leading-tight">
        Oops! We Couldn't Find That Page
      </h1>

      <p className="text-slate-600 text-sm sm:text-base max-w-xl mt-3 leading-relaxed">
        The link you clicked may be broken, or the building material you are searching for might have moved to a new category.
      </p>

      {/* Interactive Material Search Bar */}
      <div className="w-full max-w-lg mt-8">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tiles, electrical, paints, granite..."
            className="w-full h-13 pl-12 pr-28 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#F26522] focus:outline-none shadow-sm text-sm text-slate-800 placeholder:text-slate-400 font-medium transition-all"
          />
          <Search size={18} className="absolute left-4 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 h-10 px-5 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Search</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>

      {/* Main Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Link
          href="/"
          className="px-6 py-3 bg-[#052A51] hover:bg-[#093A6D] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
        >
          <Home size={16} />
          <span>Back to Homepage</span>
        </Link>

        <Link
          href="/shop"
          className="px-6 py-3 bg-white hover:bg-slate-50 text-[#052A51] border border-slate-200 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
        >
          <ShoppingBag size={16} className="text-[#F26522]" />
          <span>Explore All 20+ Categories</span>
        </Link>
      </div>

      {/* Popular Categories Grid */}
      <div className="w-full mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Browse Popular Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant site delivery across Bangalore within 60 minutes
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {POPULAR_CATEGORIES.map((cat, i) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={i}
                href={`/shop/${cat.slug}`}
                className="p-3 bg-white hover:bg-orange-50/50 border border-slate-200 hover:border-[#F26522]/40 rounded-2xl text-left transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-[#F26522]/10 text-[#052A51] group-hover:text-[#F26522] flex items-center justify-center transition-colors mb-2">
                  <IconComponent size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#052A51] group-hover:text-[#F26522] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">{cat.count}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Emergency Assistance & Report Broken Link Strip */}
      <div className="w-full max-w-2xl mt-10 p-4 rounded-2xl bg-gradient-to-r from-[#052A51]/5 via-[#F26522]/5 to-[#052A51]/5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#052A51]">
              Need Urgent Materials for Your Construction Site?
            </h4>
            <p className="text-[11px] text-slate-500">
              Our Bangalore Quick Order Desk will dispatch in-stock items directly to your site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href={whatsappReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 bg-[#1E9E6B] hover:bg-[#188056] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <MessageCircle size={14} />
            <span>WhatsApp Quick Help</span>
          </a>
        </div>
      </div>
    </div>
  );
}
