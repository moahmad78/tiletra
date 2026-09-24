"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, ShieldAlert, ArrowRight, MessageCircle, Truck, PackageCheck } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const RETURNS_SECTIONS = [
  { id: "window", title: "7-Day Return Window & Regional Logistics" },
  { id: "breakage", title: "Transit Breakage & Long-Distance Freight Claims" },
  { id: "bulky-exceptions", title: "Heavy & Bulky Material Exceptions" },
  { id: "variations", title: "Batch & Tone Variations" },
  { id: "refunds", title: "Refund Processing & Timelines" },
];

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      currentTab="returns"
      title="Returns & Replacement Policy"
      categoryTag="Customer Protection"
      lastUpdated="September 2026"
      sections={RETURNS_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl flex items-start gap-3.5">
        <CheckCircle className="text-[#1E9E6B] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">Damage Protection & Returns Guarantee</h3>
          <p className="text-xs sm:text-sm text-emerald-950 mt-1 leading-relaxed font-medium">
            Any building materials or tiles damaged during transit across India are replaced 100% free of charge or refunded immediately upon photo/video verification within 48 hours.
          </p>
        </div>
      </div>

      {/* Sections */}
      <section id="window" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          7-Day Return Window &amp; Regional Logistics
        </h2>
        <p className="text-neutral-700">
          Unopened, full packages or boxes of materials in their original factory packaging can be returned within <strong>7 calendar days</strong> of delivery. Return pickup logistics operate as follows:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-neutral-600 pl-2">
          <li>
            <strong>Bengaluru Orders</strong>: Hyperlocal return pickups are handled directly by IntriHub dispatch vehicles within 24–48 hours of approval.
          </li>
          <li>
            <strong>Pan-India Orders</strong>: Long-distance return pickups are scheduled through our national third-party logistics (3PL) partners or via authorized regional return hubs. Returned crates must be palletized or boxed securely in original packaging for carrier pickup.
          </li>
        </ul>
      </section>

      <section id="breakage" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Transit Breakage &amp; Long-Distance Freight Claims
        </h2>
        <p className="text-neutral-700">
          Because long-distance shipments travel via inter-state freight carriers, we implement a strict zero-breakage protection protocol:
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2 text-neutral-700">
          <p className="font-bold text-[#052a51]">Damage Claim Procedure:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Record clear photos or an unboxing video showing the damaged cartons/slabs and shipping label.</li>
            <li>Submit evidence via WhatsApp (<a href="https://wa.me/917090120211" className="font-bold text-[#1E9E6B] hover:underline">+91 70901 20211</a>) or email (<a href="mailto:support@intrihub.com" className="font-bold text-[#052a51] hover:underline">support@intrihub.com</a>) within <strong>48 hours</strong> of delivery receipt.</li>
            <li>IntriHub will immediately dispatch a priority replacement consignment at zero additional cost to the buyer, or issue a 100% refund for the damaged units.</li>
          </ul>
        </div>
      </section>

      <section id="bulky-exceptions" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Heavy &amp; Bulky Material Exceptions
        </h2>
        <p className="text-neutral-700">
          Heavy construction materials (vitrified tiles, granite slabs, cement bags, structural plywood) involve substantial freight handling. The following non-returnable exceptions apply:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Custom-Cut Items</strong>: Factory-cut or edge-profiled granite, custom-tinted paints, or bespoke architectural items cannot be returned.</li>
          <li><strong>Opened or Loose Packages</strong>: Opened boxes or loose tile pieces are ineligible for return due to structural damage risk during reverse transit.</li>
          <li><strong>Pan-India Change of Mind Returns</strong>: For orders delivered undamaged outside Bengaluru, return freight charges may be deducted from the refund if the return is due to buyer change of mind rather than material defect or transit damage.</li>
        </ul>
      </section>

      <section id="variations" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Batch &amp; Tone Variations
        </h2>
        <p className="text-neutral-700">
          Ceramic, vitrified tiles, and natural stone may exhibit subtle tone or shade variations across distinct factory production batches. We strongly advise calculating and ordering all required square footage (including a 10% wastage margin) in a single order to guarantee identical manufacturing batch lots.
        </p>
      </section>

      <section id="refunds" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">5</span>
          Refund Processing &amp; Timelines
        </h2>
        <p className="text-neutral-700">
          Once returned materials are received and inspected at our central warehouse or regional partner hub, refunds are initiated back to your original payment method (Razorpay online payment, card, UPI, or verified bank account for COD orders) within <strong>3–5 business days</strong>.
        </p>
      </section>

      {/* Action Footer Callout */}
      <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-50 p-5 rounded-2xl">
        <div>
          <h4 className="font-bold text-neutral-900 text-sm">Need to initiate a return or claim transit damage?</h4>
          <p className="text-xs text-neutral-500 mt-0.5">Reach out to our customer resolution team with your Order ID.</p>
        </div>
        <a
          href="https://wa.me/917090120211"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E9E6B] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          <MessageCircle size={15} />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </PolicyLayout>
  );
}
