"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Sparkles,
  Truck,
  Check,
} from "lucide-react";

export type PaymentMethod = "online" | "cod" | "upi" | "card" | "netbanking";

export interface PaymentData {
  method: PaymentMethod;
  upiApp?: string;
  vpa?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  bankCode?: string;
}

interface PaymentStepProps {
  totalAmount: number;
  orderId: string;
  pincode?: string;
  paymentData: PaymentData;
  onPaymentDataChange: (data: PaymentData) => void;
  onTriggerPayment: () => void;
  onQrPaymentSuccess?: (paymentId: string) => void;
  onBackToDelivery: () => void;
  isProcessing: boolean;
}

export default function PaymentStep({
  totalAmount,
  orderId,
  pincode,
  paymentData,
  onPaymentDataChange,
  onTriggerPayment,
  onBackToDelivery,
  isProcessing,
}: PaymentStepProps) {
  // Normalize method to either "online" or "cod"
  const isOnline = paymentData.method !== "cod";
  const formattedTotal = "₹" + totalAmount.toLocaleString("en-IN");

  const handleSelectOnline = () => {
    onPaymentDataChange({
      ...paymentData,
      method: "online",
    });
  };

  const handleSelectCod = () => {
    onPaymentDataChange({
      ...paymentData,
      method: "cod",
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-4 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xs font-black">
            3
          </span>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            Payment Method
          </h2>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>100% Secure</span>
        </div>
      </div>

      {/* Two Simplified Stacked Option Cards */}
      <div className="space-y-3">
        {/* OPTION 1: ONLINE PAYMENT */}
        <div
          onClick={handleSelectOnline}
          className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            isOnline
              ? "border-[#052a51] bg-[#052a51]/[0.02] shadow-xs ring-1 ring-[#052a51]/15"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          {/* Recommended Tag */}
          <div className="absolute top-0 right-0">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#052a51] to-[#0A3D6B] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-xl shadow-2xs">
              <Sparkles size={10} className="text-amber-300" /> Recommended
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  isOnline
                    ? "border-[#052a51] bg-[#052a51]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isOnline && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {/* Text Content */}
              <div className="flex-1 pr-16 sm:pr-20">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-gray-900">
                    Online Payment
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                    Instant
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  UPI (GPay, PhonePe, Paytm), Cards & Net Banking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* OPTION 2: CASH ON DELIVERY */}
        <div
          onClick={handleSelectCod}
          className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            !isOnline
              ? "border-[#052a51] bg-[#052a51]/[0.02] shadow-xs ring-1 ring-[#052a51]/15"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {/* Radio Indicator */}
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                    !isOnline
                      ? "border-[#052a51] bg-[#052a51]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {!isOnline && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-gray-900">
                    Cash on Delivery (COD)
                  </h3>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  Pay via Cash or UPI at your doorstep upon delivery
                </p>

                {/* Available for PIN */}
                {pincode && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-2">
                    <Check size={13} className="text-emerald-600" />
                    <span>Available for PIN {pincode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA & Navigation */}
      <div className="pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDelivery}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Delivery
        </button>

        <button
          type="button"
          onClick={onTriggerPayment}
          disabled={isProcessing}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm sm:text-base font-black text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isOnline
              ? "bg-[#052a51] hover:bg-[#0A3D6B] active:scale-[0.99]"
              : "bg-[#F26522] hover:bg-[#d95315] active:scale-[0.99]"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : isOnline ? (
            <>
              <Lock size={15} />
              <span>Pay {formattedTotal}</span>
            </>
          ) : (
            <>
              <Truck size={15} />
              <span>Place COD Order ({formattedTotal})</span>
            </>
          )}
        </button>
      </div>

      {/* Trust Line */}
      <div className="pt-1 flex items-center justify-center gap-4 text-[11px] font-semibold text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-500" /> 100% Purchase Protection
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Lock size={12} className="text-gray-400" /> Secure Encrypted Payment
        </span>
      </div>
    </div>
  );
}
