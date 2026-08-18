"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="bg-[#052a51] text-white py-14"
        style={{ paddingTop: "120px" }}
      >
        <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 block">Legal</span>
          <h1 className="text-[32px] md:text-[44px] font-black leading-tight">Terms of Service</h1>
          <p className="text-white/70 text-sm mt-2">Effective Date: August 2026</p>
        </div>
      </div>

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-10 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">1. Agreement to Terms</h2>
            <p>
              By accessing or purchasing from Intrihub (intrihub.com), you agree to comply with and be bound by these Terms of Service. If you disagree with any portion, please refrain from using the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#052a51] mb-2">2. Products and Pricing</h2>
            <p>
              All prices listed on Intrihub are inclusive of applicable GST unless stated otherwise. Prices and stock availability are subject to change without prior notice. Tile images on screen may have minor color variations compared to physical tiles due to monitor calibration and ambient lighting.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">3. Order Acceptance & Cancellation</h2>
            <p>
              We reserve the right to refuse or cancel any order for reasons including inventory shortage, delivery area non-serviceability, or pricing errors. In such cases, full refunds will be issued immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">4. Jurisdiction</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from transactions on this website shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
