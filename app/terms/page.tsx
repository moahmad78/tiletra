"use client";

import React from "react";
import Link from "next/link";
import { FileText, Scale, Shield, AlertTriangle, Building2 } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const TERMS_SECTIONS = [
  { id: "agreement", title: "Agreement to Terms" },
  { id: "products", title: "Products, Specifications & Pricing" },
  { id: "orders", title: "Order Acceptance & Cancellation" },
  { id: "jurisdiction", title: "Governing Law & Legal Jurisdiction" },
  { id: "communication", title: "Corporate Communications" },
];

export default function TermsPage() {
  return (
    <PolicyLayout
      currentTab="terms"
      title="Terms of Service"
      categoryTag="Legal Agreement"
      lastUpdated="August 2026"
      sections={TERMS_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3.5">
        <Scale className="text-[#052a51] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">User Agreement & Commercial Terms</h3>
          <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
            By browsing, requesting quotes, or purchasing from IntriHub (intrihub.com), you acknowledge and agree to these commercial terms and conditions.
          </p>
        </div>
      </div>

      <section id="agreement" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          Agreement to Terms
        </h2>
        <p className="text-neutral-700">
          These Terms of Service govern your access to and use of the IntriHub marketplace platform. If you represent an interior design firm, architecture studio, or construction contractor, you warrant that you have authority to bind your entity to these terms.
        </p>
      </section>

      <section id="products" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Products, Specifications & Pricing
        </h2>
        <p className="text-neutral-700">
          All catalog prices displayed are in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless indicated otherwise:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Color Calibration</strong>: Physical tiles and stone may have minor visual distinctions compared to digital screen representations due to ambient illumination and screen color profiles.</li>
          <li><strong>Volume Discounts</strong>: Tier-based commercial bulk pricing applies dynamically based on minimum box order thresholds.</li>
          <li><strong>Price Modifications</strong>: IntriHub reserves the right to revise catalog pricing in response to raw material or freight cost variations.</li>
        </ul>
      </section>

      <section id="orders" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Order Acceptance, Verification & Cancellation
        </h2>
        <p className="text-neutral-700">
          Receipt of an electronic order confirmation does not constitute our final acceptance of an order. IntriHub reserves the right to cancel or limit quantities due to factory stock unavailability, delivery area non-serviceability, or inadvertent pricing display discrepancies. In all cancellation events, a 100% full refund will be immediately issued.
        </p>
      </section>

      <section id="jurisdiction" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Governing Law & Legal Jurisdiction
        </h2>
        <p className="text-neutral-700">
          These terms and all commercial transactions shall be governed by and interpreted in accordance with the substantive laws of India. Any legal dispute, arbitration, or proceeding shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka</strong>.
        </p>
      </section>

      <section id="communication" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">5</span>
          Corporate Communications
        </h2>
        <p className="text-neutral-700">
          For legal notices or corporate communication, contact our legal counsel at{" "}
          <a href="mailto:info@intrihub.com" className="font-bold text-[#052a51] hover:underline">
            info@intrihub.com
          </a>{" "}
          or customer care at{" "}
          <a href="mailto:support@intrihub.com" className="font-bold text-[#F26522] hover:underline">
            support@intrihub.com
          </a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
