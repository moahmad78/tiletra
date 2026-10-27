"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileLock, Mail, Users, Truck, Building2, Phone } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";
import {
  COMPANY_NAME,
  CIN,
  REGISTERED_OFFICE_STRING,
  EMAIL,
  PHONE_DISPLAY,
  PHONE_TEL,
} from "@/lib/siteConfig";

const PRIVACY_SECTIONS = [
  { id: "corporate-ownership", title: "Corporate Identity & Operating Entity" },
  { id: "collection", title: "Information We Collect" },
  { id: "usage", title: "How We Use Your Data" },
  { id: "sharing", title: "Data Sharing with Vendor Partners & Carriers" },
  { id: "security", title: "Data Security & Localization" },
  { id: "rights", title: "Data Access & Privacy Rights" },
  { id: "grievance", title: "Grievance Redressal & Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      currentTab="privacy"
      title="Privacy Policy"
      categoryTag="Data Protection"
      lastUpdated="October 2026"
      sections={PRIVACY_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-3.5">
        <ShieldCheck className="text-[#052a51] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">Your Privacy Matters</h3>
          <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
            <strong>{COMPANY_NAME}</strong> (&quot;IntriHub&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates <strong>www.intrihub.com</strong> and the IntriHub mobile application. We adhere to strict data privacy principles under India&apos;s Digital Personal Data Protection Act (DPDPA). We never sell, rent, or trade your personal information to third-party marketing companies.
          </p>
        </div>
      </div>

      <section id="corporate-ownership" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          Corporate Identity &amp; Operating Entity
        </h2>
        <p className="text-neutral-700">
          The IntriHub platform, website (www.intrihub.com), mobile applications, and fulfillment networks are exclusively owned and operated by:
        </p>
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm space-y-1.5 text-neutral-700">
          <p><strong>Full Registered Company Name:</strong> {COMPANY_NAME}</p>
          <p><strong>Corporate Identification Number (CIN):</strong> <span className="font-mono font-semibold">{CIN}</span></p>
          <p><strong>Official Registered Office:</strong> {REGISTERED_OFFICE_STRING}</p>
          <p><strong>Official Support &amp; Privacy Email:</strong> <a href={`mailto:${EMAIL}`} className="text-[#F26522] font-semibold hover:underline">{EMAIL}</a></p>
          <p><strong>Official Support Helpline:</strong> <a href={PHONE_TEL} className="text-[#052a51] font-semibold hover:underline">{PHONE_DISPLAY}</a></p>
        </div>
      </section>

      <section id="collection" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          Information We Collect
        </h2>
        <p className="text-neutral-700">
          We collect information provided directly by you when creating an account, requesting quotes, or placing orders across our website and mobile apps:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Contact &amp; Delivery Details</strong>: Name, shipping address, delivery pincode, contact phone number, and verified email address.</li>
          <li><strong>Order Details</strong>: Selected materials, variant specs, billing preferences, and delivery site drop-off instructions.</li>
          <li><strong>Payment Information</strong>: Card, UPI, and bank details are processed directly through 256-bit SSL encrypted PCI-DSS certified payment gateways (Razorpay). <em>IntriHub Private Limited never stores raw card credentials or UPI PIN data on its servers.</em></li>
        </ul>
      </section>

      <section id="usage" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          How We Use Your Data
        </h2>
        <p className="text-neutral-700">
          Your personal data is used solely for legitimate business operations:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li>Fulfilling orders, packaging building supplies, scheduling heavy freight delivery trucks, and site drop-offs.</li>
          <li>Sending automated SMS, WhatsApp, and email order tracking notifications and dispatch updates.</li>
          <li>Providing responsive customer support and resolving return or transit damage claims.</li>
          <li>Preventing fraud, unauthorized account access, and ensuring network security.</li>
        </ul>
      </section>

      <section id="sharing" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Data Sharing with Vendor Partners &amp; Logistics Carriers
        </h2>
        <p className="text-neutral-700">
          To fulfill orders nationwide outside our direct Bengaluru dark stores, IntriHub Private Limited shares necessary order and delivery data with certified partners under strict confidentiality agreements:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Local Vendor Partners</strong>: When an order is fulfilled by an onboarded regional supplier, customer name, delivery address, phone number, and order item details are shared exclusively to pack, stage, and dispatch the consignment.</li>
          <li><strong>3PL Logistics &amp; Freight Carriers</strong>: Delivery contact details and site coordinates are shared with courier and trucking partners solely to execute transit and site drop-off.</li>
          <li><strong>No Secondary Use</strong>: Partners are contractually prohibited from using your data for independent marketing or secondary purposes.</li>
        </ul>
      </section>

      <section id="security" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">5</span>
          Data Security &amp; Localization
        </h2>
        <p className="text-neutral-700">
          All client-to-server traffic is encrypted using standard HTTPS/TLS 1.3 encryption. IntriHub Private Limited stores customer data in secure Indian cloud server regions with strict role-based access control, ensuring complete data localization and security compliance.
        </p>
      </section>

      <section id="rights" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">6</span>
          Data Access &amp; Privacy Rights
        </h2>
        <p className="text-neutral-700">
          Under Indian Digital Personal Data Protection guidelines, you may request access, correction, or deletion of your personal data at any time by contacting our dedicated data privacy desk at{" "}
          <a href={`mailto:${EMAIL}`} className="font-bold text-[#052a51] hover:underline">
            {EMAIL}
          </a>.
        </p>
      </section>

      <section id="grievance" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">7</span>
          Grievance Redressal Officer
        </h2>
        <p className="text-neutral-700">
          In accordance with the Information Technology Act 2000 and the Digital Personal Data Protection Act, the details of the Grievance Redressal Officer for IntriHub Private Limited are provided below:
        </p>
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm space-y-1.5 text-neutral-700">
          <p><strong>Entity:</strong> {COMPANY_NAME}</p>
          <p><strong>CIN:</strong> <span className="font-mono">{CIN}</span></p>
          <p><strong>Office:</strong> {REGISTERED_OFFICE_STRING}</p>
          <p><strong>Grievance Officer Email:</strong> <a href={`mailto:${EMAIL}`} className="text-[#F26522] font-semibold hover:underline">{EMAIL}</a></p>
          <p><strong>Support Phone:</strong> <a href={PHONE_TEL} className="text-[#052a51] font-semibold hover:underline">{PHONE_DISPLAY}</a></p>
          <p className="text-xs text-neutral-500 pt-1">Response Timeline: All grievances are acknowledged within 24 hours and resolved within the statutory timelines prescribed under Indian law.</p>
        </div>
      </section>
    </PolicyLayout>
  );
}
