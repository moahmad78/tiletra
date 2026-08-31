"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, ShieldAlert, ArrowRight, MessageCircle } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const RETURNS_SECTIONS = [
  { id: "window", title: "7-Day Return Window" },
  { id: "breakage", title: "Transit Breakage & Defects" },
  { id: "variations", title: "Batch & Tone Variations" },
  { id: "refunds", title: "Refund Processing & Timelines" },
];

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      currentTab="returns"
      title="Returns & Replacement Policy"
      categoryTag="Customer Protection"
      lastUpdated="August 2026"
      sections={RETURNS_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl flex items-start gap-3.5">
        <CheckCircle className="text-[#1E9E6B] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">Damage Protection Guarantee</h3>
          <p className="text-xs sm:text-sm text-emerald-950 mt-1 leading-relaxed font-medium">
            Any building materials or tiles damaged during transit are replaced 100% free of charge or refunded immediately upon photo/video verification.
          </p>
        </div>
      </div>

      {/* Sections */}
      <section id="window" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          7-Day Return Window
        </h2>
        <p className="text-neutral-700">
          Unopened, full packages or boxes of materials in their original factory packaging can be returned within <strong>7 calendar days</strong> of delivery. To maintain quality control and site safety, open or partially used boxes cannot be accepted for return.
        </p>
      </section>

      <section id="breakage" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Transit Breakage & Defects
        </h2>
        <p className="text-neutral-700">
          If your delivery contains damaged items or cracked tiles, simply record a quick video or take clear photos of the damaged packages and share them with us via WhatsApp (<a href="https://wa.me/917870935277" className="font-bold text-[#1E9E6B] hover:underline">+91 78709 35277</a>) or email (<a href="mailto:support@intrihub.com" className="font-bold text-[#052a51] hover:underline">support@intrihub.com</a>) within <strong>48 hours</strong> of delivery. We will dispatch replacements on priority freight.
        </p>
      </section>

      <section id="variations" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Batch & Tone Variations
        </h2>
        <p className="text-neutral-700">
          Ceramic, vitrified tiles, and natural stone may exhibit subtle tone or shade variations across distinct factory production batches. We strongly advise calculating and ordering all required square footage (including a 10% wastage margin) in a single order to guarantee identical manufacturing batch lots.
        </p>
      </section>

      <section id="refunds" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Refund Processing & Timelines
        </h2>
        <p className="text-neutral-700">
          Once returned materials are received and inspected at our central warehouse, refunds are initiated back to your original payment method (Razorpay online payment, card, UPI, or verified bank account for COD orders) within <strong>3–5 business days</strong>.
        </p>
      </section>

      {/* Action Footer Callout */}
      <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-50 p-5 rounded-2xl">
        <div>
          <h4 className="font-bold text-neutral-900 text-sm">Need to initiate a return or claim transit damage?</h4>
          <p className="text-xs text-neutral-500 mt-0.5">Reach out to our customer resolution team with your Order ID.</p>
        </div>
        <a
          href="https://wa.me/917870935277"
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
