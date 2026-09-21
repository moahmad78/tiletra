import Link from "next/link";
import { Truck, MapPin, Clock, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import type { SeoLocation } from "@/lib/data/seo-locations";

interface LocationSeoIntroProps {
  categoryName: string;
  location: SeoLocation;
}

/**
 * Rich, structured Local Logistics & SEO intro block for /shop/[category]/[location] pages.
 * Displays real transit time, nearby landmarks, and genuine local context.
 */
export default function LocationSeoIntro({ categoryName, location }: LocationSeoIntroProps) {
  const subAreas = location.serviceableSubAreas || [];
  const popularItems = location.popularCategories || [];

  return (
    <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 mb-8 shadow-xs space-y-5">
      {/* ── Top Status Badges ── */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
          <Clock size={13} className="text-emerald-600" />
          <span>{location.dispatchWindow} — {location.name}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#052a51] font-bold">
          <Truck size={13} className="text-[#F26522]" />
          <span>Direct Site Unloading</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold">
          <ShieldCheck size={13} className="text-amber-600" />
          <span>GST ITC Tax Invoicing</span>
        </span>
      </div>

      {/* ── Main Narrative & Local Context ── */}
      <div className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] leading-tight">
          Direct {categoryName} Supply Across {location.name}, {location.city}
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {location.uniqueIntro}
        </p>
      </div>

      {/* ── Two-Column Details Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs">
        {/* Sub-areas */}
        {subAreas.length > 0 && (
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-[#052a51] mb-2">
              <MapPin size={14} className="text-[#F26522]" />
              <span>Serviceable Pockets in {location.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subAreas.map((sub, i) => (
                <span
                  key={i}
                  className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 font-medium"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Popular Category Demands */}
        {popularItems.length > 0 && (
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-[#052a51] mb-2">
              <Zap size={14} className="text-[#F26522]" />
              <span>Fast-Moving Items in this Zone</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularItems.map((item, i) => (
                <span
                  key={i}
                  className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Policy Note ── */}
      <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
        <span>{location.deliveryPolicyNote}</span>
      </div>
    </div>
  );
}
