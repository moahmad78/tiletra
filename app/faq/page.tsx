"use client";

import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function FAQPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="bg-[#052a51] text-white pt-[110px] md:pt-[168px] pb-14 md:pb-20"
      >
        <div className="w-full max-w-[1000px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F26522] flex items-center justify-center mx-auto mb-4 text-white shadow-md">
            <HelpCircle size={26} />
          </div>
          <h1 className="text-[34px] md:text-[48px] font-black leading-tight">
            Frequently Asked <span className="text-[#F26522]">Questions</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mt-3 max-w-lg mx-auto">
            Everything you need to know about purchasing, calculating box quantities, delivery times, and returns.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-10 flex-1">
        <FAQ />

        <div className="mt-8 bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-[#052a51]">Still have questions?</h3>
          <p className="text-gray-500 text-sm mt-1">Our customer support team is available Mon-Sat, 9AM to 8PM.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <a
              href="https://wa.me/917870935277"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 h-11 bg-[#25D366] text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Chat on WhatsApp
            </a>
            <Link href="/contact">
              <button className="px-6 h-11 bg-[#052a51] text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-[#041f3d] active:scale-95 transition-all">
                Contact Us <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
