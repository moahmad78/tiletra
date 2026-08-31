"use client";

import React from "react";
import Link from "next/link";
import { Truck, Clock, ShieldCheck, MapPin, PackageCheck, AlertCircle, ArrowRight } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const SHIPPING_SECTIONS = [
  { id: "packaging", title: "Heavy Freight & Pallet Packaging" },
  { id: "unloading", title: "Ground Floor Delivery & Site Unloading" },
  { id: "inspection", title: "Delivery Inspection & Verification" },
  { id: "coverage", title: "Serviceable Cities & Coverage" },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      currentTab="shipping"
      title="Shipping & Freight Policy"
      categoryTag="Delivery & Logistics"
      lastUpdated="August 2026"
      sections={SHIPPING_SECTIONS}
    >
      {/* 2 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
        <div className="p-5 bg-orange-50/80 border border-orange-200/70 rounded-2xl flex items-start gap-3.5">
          <Truck className="text-[#F26522] shrink-0 mt-0.5" size={22} />
          <div>
            <h3 className="font-extrabold text-[#052a51] text-base">Free Delivery Above ₹15,000</h3>
            <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
              Standard site freight is 100% free on qualifying cart totals. Orders below threshold incur weight-based flat logistics rates starting at ₹99.
            </p>
          </div>
        </div>
        <div className="p-5 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-3.5">
          <Clock className="text-[#052a51] shrink-0 mt-0.5" size={22} />
          <div>
            <h3 className="font-extrabold text-[#052a51] text-base">Within 60 Minutes Delivery</h3>
            <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
              Express site delivery with real-time GPS tracking across Bengaluru and rapid logistics dispatch nationwide.
            </p>
          </div>
        </div>
      </div>

      <section id="packaging" className="space-y-2.5 pt-4 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          Heavy Freight & Reinforced Pallet Packaging
        </h2>
        <p className="text-neutral-700">
          Heavy construction materials, large-format porcelain slabs, and fragile vitrified tiles require reinforced freight packaging. All tile shipments are secured in shrink-wrapped, corner-guarded wooden crates or pallets to eliminate transit shock and breakage.
        </p>
      </section>

      <section id="unloading" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Ground Floor Delivery & Site Unloading
        </h2>
        <p className="text-neutral-700">
          Standard logistics rates cover curbside or ground-floor drop-off at your registered site address. If you require manual carrying to upper floor units or basement staging areas without hydraulic lift access, site labor coordination can be arranged directly with the delivery crew.
        </p>
      </section>

      <section id="inspection" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Delivery Inspection & Verification
        </h2>
        <p className="text-neutral-700">
          We recommend inspecting external cartons upon arrival with the delivery driver. If you notice external carton impact or damage, please note it on the Proof of Delivery (POD) receipt and submit photos via our <strong>Damage Protection Guarantee</strong> for instant replacement dispatch.
        </p>
      </section>

      <section id="coverage" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Serviceable Cities & Coverage
        </h2>
        <p className="text-neutral-700">
          IntriHub operates rapid dispatch centers across Bengaluru, Mysuru, Hyderabad, Chennai, and tier-1/tier-2 South India metro clusters, with pan-India heavy freight coverage for commercial projects.
        </p>
      </section>

      {/* Action Footer Callout */}
      <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-50 p-5 rounded-2xl">
        <div>
          <h4 className="font-bold text-neutral-900 text-sm">Tracking an existing shipment or freight consignment?</h4>
          <p className="text-xs text-neutral-500 mt-0.5">Use your Order ID / LR number in your account order tracker.</p>
        </div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#022046] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          <span>Track My Order</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </PolicyLayout>
  );
}
