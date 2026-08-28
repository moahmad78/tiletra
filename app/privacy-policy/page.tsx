"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="bg-[#052a51] text-white py-14"
        style={{ paddingTop: "120px" }}
      >
        <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 block">Privacy</span>
          <h1 className="text-[32px] md:text-[44px] font-black leading-tight">Privacy Policy</h1>
          <p className="text-white/70 text-sm mt-2">Effective Date: August 2026</p>
        </div>
      </div>

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-10 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">1. Information We Collect</h2>
            <p>
              We collect information provided directly by you when placing orders, including name, shipping address, contact phone number, and email address. Payment credentials (card/UPI numbers) are processed securely directly through Razorpay and are never stored on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">2. How We Use Your Data</h2>
            <p>
              Your contact details are strictly used for order fulfillment, shipping updates, freight driver coordination, and customer service. We do not sell or rent customer data to third-party marketing networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">3. Security</h2>
            <p>
              All traffic between your device and Intrihub is encrypted using standard HTTPS/TLS protocols.
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h2 className="text-lg font-black text-[#052a51]">4. Data Protection & Inquiries</h2>
            <p>
              For data access requests, privacy concerns, or corporate governance inquiries, please reach out to our privacy desk at{" "}
              <a href="mailto:info@intrihub.com" className="font-bold text-[#052a51] hover:underline">
                info@intrihub.com
              </a>.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
