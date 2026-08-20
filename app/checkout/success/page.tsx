"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Banknote,
  Truck,
  Check,
  ShoppingBag,
  Home,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const STEPS = ["Address", "Payment", "Order Done"] as const;

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId =
    searchParams.get("orderId") || "TL-" + Math.floor(100000 + Math.random() * 900000);
  const method = searchParams.get("method") || "online";
  const total = searchParams.get("total");

  const isCod = method.toLowerCase() === "cod";

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-14 flex-1">
      {/* ── 3-Step Stepper Indicator: All Completed ── */}
      <div className="w-full max-w-2xl mx-auto bg-white px-3 py-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-2xs mb-6 sm:mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-[11px] sm:text-xs transition-colors shadow-2xs shrink-0 bg-[#2F7A4F] text-white">
                  <Check size={14} className="sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap text-[#2F7A4F]">
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 sm:mx-3 md:mx-4 min-w-[8px] sm:min-w-[16px] bg-[#2F7A4F]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Order Success Card ── */}
      <div className="max-w-xl w-full mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-gray-200/80 text-center space-y-6">
          {/* Success Icon */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              isCod ? "bg-amber-100 text-amber-600" : "bg-[#2F7A4F]/10 text-[#2F7A4F]"
            }`}
          >
            {isCod ? <Banknote size={36} className="sm:w-10 sm:h-10" /> : <CheckCircle2 size={36} className="sm:w-10 sm:h-10" />}
          </div>

          <div>
            <span
              className={`inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 ${
                isCod ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isCod ? "Cash on Delivery Confirmed" : "Payment & Order Verified"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#052a51] tracking-tight">
              Order Successfully Placed!
            </h1>

            <p className="text-gray-500 mt-2 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              {isCod
                ? `Please keep ${total ? "₹" + Number(total).toLocaleString("en-IN") : "cash"} ready to pay our delivery partner upon arrival.`
                : "Thank you for your payment! Our fulfillment team has begun packaging and preparing your order."}
            </p>
          </div>

          {/* Order Details Box */}
          <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl text-left space-y-2.5 border border-gray-100">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Order ID</span>
              <span className="font-black text-[#052a51] bg-white px-2.5 py-1 rounded-lg border border-gray-200">{orderId}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Payment Mode</span>
              <span className="font-bold text-[#052a51]">{isCod ? "Cash on Delivery" : "Online Prepaid"}</span>
            </div>
            {total && (
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="font-black text-[#052a51]">₹{Number(total).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Estimated Delivery</span>
              <span className="font-bold text-[#052a51]">3–5 Business Days</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-gray-200/60">
              <span className="text-gray-500 font-medium">Order Status</span>
              <span className="inline-flex items-center gap-1 font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Processing
              </span>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="bg-[#052a51]/5 rounded-2xl p-4 text-xs text-gray-600 space-y-2 text-left">
            <p className="flex items-center gap-2">
              <Truck size={14} className="text-[#F26522] shrink-0" />
              <span>Specialized edge-cushioned wooden crate transport</span>
            </p>
            <p className="flex items-center gap-2">
              <Package size={14} className="text-[#F26522] shrink-0" />
              <span>Driver will call 30 minutes before arrival</span>
            </p>
          </div>

          {/* ── Action Buttons: Track Status vs Continue Shopping ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/account/orders"
              className="flex-1 min-h-[48px] px-5 bg-[#052a51] hover:bg-[#0b3b6d] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 shadow-sm cursor-pointer"
            >
              <Package size={16} />
              <span>Check Order Status</span>
            </Link>
            <Link
              href="/shop"
              className="flex-1 min-h-[48px] px-5 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 shadow-sm cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Home Link */}
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#052a51] transition-colors"
            >
              <Home size={13} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto py-24 text-center text-sm font-bold text-[#052a51]">
            Loading order confirmation...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}
