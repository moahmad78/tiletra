"use client";

import Link from "next/link";
import { RotateCcw, ShieldAlert, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="bg-[#052a51] text-white py-14"
        style={{ paddingTop: "120px" }}
      >
        <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 block">Policies</span>
          <h1 className="text-[32px] md:text-[44px] font-black leading-tight">Returns & Replacement Policy</h1>
          <p className="text-white/70 text-sm mt-2">Last updated: August 2026</p>
        </div>
      </div>

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-10 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="p-5 bg-[#2F7A4F]/10 border border-[#2F7A4F]/20 rounded-2xl flex items-start gap-3">
            <CheckCircle className="text-[#2F7A4F] shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-[#2F7A4F] text-sm">Damage Protection Guarantee</h3>
              <p className="text-xs text-gray-600 mt-1">
                Any tiles damaged in transit are replaced 100% free of charge or refunded immediately upon proof submission.
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">1. 7-Day Return Window</h2>
            <p>
              Unopened, full boxes of tiles in their original factory packaging can be returned within 7 calendar days of delivery. Open or partially used boxes cannot be accepted for return due to handling hazards and batch shade variations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">2. Transit Breakage & Defects</h2>
            <p>
              If your delivery contains broken tiles or materials, share photos of the damaged boxes via WhatsApp (+91 78709 35277) or email (hello@intrihub.com) within 48 hours of delivery. We will dispatch replacement boxes on priority freight.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">3. Batch & Tone Variations</h2>
            <p>
              Ceramic and vitrified products may have slight tone differences across different production batches. We strongly recommend ordering all required boxes (including a 10% wastage buffer) in a single order to guarantee identical batch numbers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">4. Refund Processing</h2>
            <p>
              Once returned boxes are inspected at our warehouse, refunds are initiated back to the original payment source via Razorpay within 3–5 business days.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
