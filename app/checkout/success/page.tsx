"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Banknote, ShieldCheck } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "TL-" + Math.floor(100000 + Math.random() * 900000);
  const method = searchParams.get("method") || "online";
  const total = searchParams.get("total");

  const isCod = method.toLowerCase() === "cod";

  return (
    <div className="max-w-lg w-full text-center">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isCod ? "bg-amber-100 text-amber-600" : "bg-[#2F7A4F]/10 text-[#2F7A4F]"
        }`}>
          {isCod ? <Banknote size={40} /> : <CheckCircle size={40} />}
        </div>

        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
          isCod ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"
        }`}>
          {isCod ? "Cash on Delivery Order" : "Payment Confirmed"}
        </span>

        <h1 className="text-[28px] md:text-[32px] font-black text-[#052a51] mt-2">
          Order Successfully Placed!
        </h1>

        <p className="text-gray-600 mt-2 text-xs md:text-sm leading-relaxed">
          {isCod
            ? `Please keep ${total ? "₹" + Number(total).toLocaleString("en-IN") : "cash"} ready to pay our delivery team upon safe arrival at your doorstep.`
            : "Thank you for your payment! Our warehouse team will begin inspecting and crate-packaging your tiles right away."}
        </p>

        <div className="mt-6 p-4 bg-[#F3F4F5] rounded-2xl text-left space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Order ID</span>
            <span className="font-black text-[#052a51]">{orderId}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Payment Mode</span>
            <span className="font-bold text-[#052a51]">{isCod ? "Cash on Delivery" : "Online (Prepaid)"}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Estimated Delivery</span>
            <span className="font-bold text-[#052a51]">3–5 Business Days</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="font-black text-[#2F7A4F]">Processing</span>
          </div>
        </div>

        <div className="mt-5 bg-[#052a51]/5 rounded-2xl p-4 text-xs text-gray-600 space-y-2 text-left">
          <p className="flex items-center gap-2">
            <Package size={14} className="text-[#F26522] shrink-0" />
            Confirmation SMS & tracking link sent to your mobile
          </p>
          <p className="flex items-center gap-2">
            <Package size={14} className="text-[#F26522] shrink-0" />
            Carrier will call 30 minutes before reaching your location
          </p>
        </div>

        {/* Complete Your Look Recommendation */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#052a51] to-[#0a3d72] text-white text-left shadow-xs">
          <span className="text-[10px] font-black uppercase text-[#F26522] tracking-wider">
            Room Design Inspiration
          </span>
          <h3 className="text-sm font-bold mt-0.5">Need design ideas for your newly ordered tiles?</h3>
          <p className="text-xs text-white/70 mt-1">
            Explore 200+ homeowner room shots and matching grout styles in our gallery.
          </p>
          <Link
            href="/inspiration"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#F26522] mt-3 hover:underline"
          >
            Explore Room Inspiration Gallery →
          </Link>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Link href="/account/orders">
            <button className="w-full h-12 bg-[#052a51] text-white font-bold rounded-xl hover:bg-[#041f3d] transition-colors flex items-center justify-center gap-2 text-xs">
              Track Your Order in My Orders <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/shop">
            <button className="w-full h-12 border-2 border-gray-200 text-[#052a51] font-bold rounded-xl hover:border-[#052a51] transition-colors text-xs">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F3F4F5] flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-sm font-bold text-[#052a51]">Loading order status...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
