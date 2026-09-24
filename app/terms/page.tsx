"use client";

import React from "react";
import Link from "next/link";
import { FileText, Scale, Shield, AlertTriangle, Building2, Truck, Handshake } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const TERMS_SECTIONS = [
  { id: "agreement", title: "Agreement to Terms" },
  { id: "service-area", title: "Pan-India Service Area & Delivery Timelines" },
  { id: "marketplace", title: "Marketplace & Vendor Partner Fulfillment" },
  { id: "products", title: "Products, Specifications & Pricing" },
  { id: "orders", title: "Order Acceptance & Cancellation Windows" },
  { id: "jurisdiction", title: "Governing Law & Legal Jurisdiction" },
  { id: "communication", title: "Corporate Communications" },
];

export default function TermsPage() {
  return (
    <PolicyLayout
      currentTab="terms"
      title="Terms of Service"
      categoryTag="Legal Agreement"
      lastUpdated="September 2026"
      sections={TERMS_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3.5">
        <Scale className="text-[#052a51] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">User Agreement & Commercial Terms</h3>
          <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
            By browsing, requesting quotes, or purchasing from IntriHub (intrihub.com) or the IntriHub mobile application, you acknowledge and agree to these commercial terms and conditions governing both hyperlocal Bengaluru deliveries and Pan-India dispatches.
          </p>
        </div>
      </div>

      <section id="agreement" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          Agreement to Terms
        </h2>
        <p className="text-neutral-700">
          These Terms of Service govern your access to and use of the IntriHub marketplace platform across all digital channels (web and mobile apps). If you represent an interior design firm, architecture studio, commercial enterprise, or construction contractor, you warrant that you have full legal authority to bind your entity to these terms.
        </p>
      </section>

      <section id="service-area" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Pan-India Service Area &amp; Delivery Timelines
        </h2>
        <p className="text-neutral-700">
          IntriHub provides building and interior material procurement services across India under two operational fulfillment models:
        </p>
        <ul className="list-disc list-inside space-y-2 text-neutral-600 pl-2">
          <li>
            <strong>Bengaluru Hyperlocal Hubs</strong>: Express 60-minute site delivery powered by our network of localized micro-dark stores and direct manufacturer dispatch depots.
          </li>
          <li>
            <strong>Pan-India Regional Delivery</strong>: Outside Bengaluru, materials are dispatched factory-direct or via regional fulfillment nodes with standard delivery timelines of <strong>3 to 7 business days</strong> across all serviceable states and Union Territories.
          </li>
          <li>
            <strong>City-by-City Speed Transitions</strong>: As local vendor partners and dark stores are onboarded in new cities, delivery timelines for eligible regions will transition from 3–7 business days to 60-minute instant delivery. Delivery speed guarantees displayed at checkout reflect the live service tier for your specific delivery pincode.
          </li>
        </ul>
      </section>

      <section id="marketplace" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Marketplace &amp; Vendor Partner Fulfillment
        </h2>
        <p className="text-neutral-700">
          IntriHub operates both direct fulfillment centers (in Bengaluru) and a curated vendor marketplace network across other states:
        </p>
        <ul className="list-disc list-inside space-y-2 text-neutral-600 pl-2">
          <li>
            <strong>Vendor Network Compliance</strong>: In regions fulfilled by verified vendor partners, the partner is responsible for physical stock warehousing, palletizing, and initial carrier handover under IntriHub&apos;s strict quality criteria.
          </li>
          <li>
            <strong>Platform Guarantee &amp; Quality Oversight</strong>: IntriHub guarantees material authenticity, GST billing compliance, digital payment escrow, and transit damage protection across all vendor-fulfilled orders nationwide.
          </li>
          <li>
            <strong>Customer Recourse</strong>: All customer inquiries, return claims, and warranty requests remain centrally managed by IntriHub&apos;s dedicated support team.
          </li>
        </ul>
      </section>

      <section id="products" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Products, Specifications &amp; Pricing
        </h2>
        <p className="text-neutral-700">
          All catalog prices displayed are in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless indicated otherwise:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Color &amp; Batch Calibration</strong>: Physical tiles, wood laminates, and stone slabs may exhibit subtle natural shade distinctions compared to digital screen previews.</li>
          <li><strong>Volume Discounts</strong>: Tier-based commercial bulk pricing applies dynamically based on minimum box or sheet order thresholds.</li>
          <li><strong>Price Modifications</strong>: IntriHub reserves the right to revise catalog pricing in response to raw material or freight cost variations prior to order confirmation.</li>
        </ul>
      </section>

      <section id="orders" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">5</span>
          Order Acceptance &amp; Cancellation Windows
        </h2>
        <p className="text-neutral-700">
          Receipt of an electronic order confirmation does not constitute final order acceptance. IntriHub reserves the right to cancel or adjust quantities due to stock non-availability, area non-serviceability, or inadvertent pricing errors, in which case a 100% full refund is immediately issued.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2 text-neutral-700 mt-2">
          <p className="font-bold text-[#052a51]">Order Cancellation Windows:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>Bengaluru 60-Minute Instant Orders</strong>: Can be cancelled without fee within 10 minutes of placement, prior to dark-store vehicle dispatch.</li>
            <li><strong>Pan-India (3–7 Day) Orders</strong>: Can be cancelled without penalty within 12 hours of order placement, prior to factory crate packaging and 3PL carrier pickup. Once a heavy freight consignment is in transit, standard return procedures apply.</li>
          </ul>
        </div>
      </section>

      <section id="jurisdiction" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">6</span>
          Governing Law &amp; Legal Jurisdiction
        </h2>
        <p className="text-neutral-700">
          These terms and all commercial transactions across India shall be governed by and construed in accordance with the substantive laws of the Republic of India. Any legal dispute, arbitration, or proceeding arising from transactions on IntriHub (including Pan-India orders) shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka</strong>.
        </p>
      </section>

      <section id="communication" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">7</span>
          Corporate Communications
        </h2>
        <p className="text-neutral-700">
          For legal notices or corporate communication, contact our legal team at{" "}
          <a href="mailto:info@intrihub.com" className="font-bold text-[#052a51] hover:underline">
            info@intrihub.com
          </a>{" "}
          or customer support at{" "}
          <a href="mailto:support@intrihub.com" className="font-bold text-[#F26522] hover:underline">
            support@intrihub.com
          </a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
