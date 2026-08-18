"use client";

import Link from "next/link";
import { Truck, Shield, Clock, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="bg-[#052a51] text-white py-14"
        style={{ paddingTop: "120px" }}
      >
        <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 block">Policies</span>
          <h1 className="text-[32px] md:text-[44px] font-black leading-tight">Shipping & Freight Policy</h1>
          <p className="text-white/70 text-sm mt-2">Last updated: August 2026</p>
        </div>
      </div>

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-10 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
            <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
              <Truck className="text-[#F26522] shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-[#052a51] text-sm">Free Delivery Above ₹15,000</h3>
                <p className="text-xs text-gray-500 mt-0.5">Orders below ₹15,000 incur a standard flat shipping fee of ₹999.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
              <Clock className="text-[#F26522] shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-[#052a51] text-sm">3–7 Business Days Delivery</h3>
                <p className="text-xs text-gray-500 mt-0.5">Estimated timelines depend on delivery pincode and city logistics.</p>
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">1. Heavy Freight Nature of Tiles</h2>
            <p>
              Ceramic and vitrified tiles are heavy, fragile items that require specialized logistics. We pack our tiles in reinforced wooden pallets with corner protection and shock-absorbing foam to guarantee safe transit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">2. Ground Floor Unloading</h2>
            <p>
              Standard delivery includes curbside / ground-floor unloading. If you require manual carrying to upper floors in buildings without elevator access, additional labor charges may apply and should be coordinated directly with the delivery partner upon arrival.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">3. Inspection on Delivery</h2>
            <p>
              We advise inspecting the external cartons at the time of delivery. In the rare event of transit damage, please record it on the delivery receipt and contact our support within 48 hours for immediate replacement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#052a51]">4. Serviceable Areas</h2>
            <p>
              Intrihub currently delivers across Bangalore, Mysore, Chennai, Hyderabad, and major tier-1 & tier-2 cities in South India, with expanding pan-India coverage.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-xs text-gray-500">
            <span>Questions regarding an existing shipment?</span>
            <Link href="/contact" className="font-bold text-[#F26522] hover:underline">
              Contact Logistics Support →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
