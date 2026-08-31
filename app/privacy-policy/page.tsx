"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileLock, Mail } from "lucide-react";
import PolicyLayout from "@/components/PolicyLayout";

const PRIVACY_SECTIONS = [
  { id: "collection", title: "Information We Collect" },
  { id: "usage", title: "How We Use Your Data" },
  { id: "security", title: "Data Security & Encryption" },
  { id: "rights", title: "Data Access & Privacy Rights" },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      currentTab="privacy"
      title="Privacy Policy"
      categoryTag="Data Protection"
      lastUpdated="August 2026"
      sections={PRIVACY_SECTIONS}
    >
      {/* Highlight Box */}
      <div className="p-5 sm:p-6 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-3.5">
        <ShieldCheck className="text-[#052a51] shrink-0 mt-0.5" size={22} />
        <div>
          <h3 className="font-extrabold text-[#052a51] text-base">Your Privacy Matters</h3>
          <p className="text-xs sm:text-sm text-neutral-700 mt-1 leading-relaxed">
            IntriHub adheres to strict data privacy principles. We never sell, rent, or trade your personal information to third-party advertisers.
          </p>
        </div>
      </div>

      <section id="collection" className="space-y-2.5 pt-2 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">1</span>
          Information We Collect
        </h2>
        <p className="text-neutral-700">
          We collect information provided directly by you when creating an account, requesting quotes, or placing orders:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li><strong>Contact Details</strong>: Name, shipping address, delivery pincode, email, and phone number.</li>
          <li><strong>Order Details</strong>: Selected materials, variant specs, billing preferences, and delivery site instructions.</li>
          <li><strong>Payment Information</strong>: Card, UPI, and bank details are processed directly through 256-bit SSL encrypted PCI-DSS certified payment gateways (Razorpay). <em>IntriHub never stores raw card or UPI PIN data on our servers.</em></li>
        </ul>
      </section>

      <section id="usage" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">2</span>
          How We Use Your Data
        </h2>
        <p className="text-neutral-700">
          Your personal data is used solely for legitimate business operations:
        </p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
          <li>Fulfilling orders, scheduling heavy freight delivery trucks, and site drop-offs.</li>
          <li>Sending automated SMS, WhatsApp, and email order tracking notifications.</li>
          <li>Providing responsive customer support and resolving return/replacement queries.</li>
          <li>Preventing fraud, unauthorized account access, and spam attacks.</li>
        </ul>
      </section>

      <section id="security" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">3</span>
          Data Security & Encryption
        </h2>
        <p className="text-neutral-700">
          All client-to-server traffic is encrypted using standard HTTPS/TLS 1.3 encryption. We maintain strict role-based data access policies so only authorized fulfillment officers can view delivery logistics data.
        </p>
      </section>

      <section id="rights" className="space-y-2.5 pt-6 border-t border-neutral-200 scroll-mt-32">
        <h2 className="text-lg sm:text-xl font-black text-[#052a51] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center text-xs font-black">4</span>
          Data Access & Privacy Rights
        </h2>
        <p className="text-neutral-700">
          Under Indian Digital Personal Data Protection guidelines, you may request access, correction, or deletion of your personal data at any time by contacting our dedicated data privacy desk at{" "}
          <a href="mailto:info@intrihub.com" className="font-bold text-[#052a51] hover:underline">
            info@intrihub.com
          </a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
