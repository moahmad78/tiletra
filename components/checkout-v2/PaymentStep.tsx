"use client";

import React from "react";
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Building2,
  QrCode,
  Truck,
  Check,
} from "lucide-react";
import {
  UpiIcon,
  GPayIcon,
  PhonePeIcon,
  PaytmIcon,
  VisaIcon,
  MastercardIcon,
  RuPayIcon,
  NetBankingIcon,
  CodCashBadge,
} from "@/components/checkout/PaymentIcons";

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
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xs font-black">
              3
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Payment Method
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Choose your preferred payment option to complete Order #{orderId}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>256-Bit Bank Grade Security</span>
        </div>
      </div>

      {/* Two Simplified Stacked Option Cards */}
      <div className="space-y-4">
        {/* OPTION 1: ONLINE PAYMENT */}
        <div
          onClick={handleSelectOnline}
          className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            isOnline
              ? "border-[#052a51] bg-[#052a51]/[0.02] shadow-md ring-2 ring-[#052a51]/10"
              : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50"
          }`}
        >
          {/* Recommended Tag */}
          <div className="absolute top-0 right-0">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#052a51] to-[#0A3D6B] text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-bl-xl shadow-xs">
              <Sparkles size={11} className="text-amber-300" /> Recommended
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              {/* Radio Indicator */}
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isOnline
                      ? "border-[#052a51] bg-[#052a51]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isOnline && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Text & Icon Content */}
              <div className="flex-1 pr-16 sm:pr-24">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Online Payment
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Instant & Zero Extra Fee
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                  Pay securely via UPI (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Card, Net Banking, or QR Code.
                </p>

                {/* Visual Payment Badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                    <UpiIcon className="h-3.5 w-auto" />
                    <span className="text-[11px] font-bold text-gray-700">UPI / QR</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                    <GPayIcon className="h-3.5 w-auto" />
                    <PhonePeIcon className="h-3.5 w-auto" />
                    <PaytmIcon className="h-3.5 w-auto" />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                    <VisaIcon className="h-3 w-auto" />
                    <MastercardIcon className="h-3.5 w-auto" />
                    <RuPayIcon className="h-3 w-auto" />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                    <Building2 size={13} className="text-gray-600" />
                    <span className="text-[11px] font-bold text-gray-700">50+ Banks</span>
                  </div>
                </div>

                {/* Selected Details Preview */}
                {isOnline && (
                  <div className="mt-3.5 bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Clicking <strong>Pay {formattedTotal}</strong> will open the secure Razorpay payment window with all UPI, Card, Net Banking & Wallet options preloaded for you.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* OPTION 2: CASH ON DELIVERY */}
        <div
          onClick={handleSelectCod}
          className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            !isOnline
              ? "border-[#052a51] bg-[#052a51]/[0.02] shadow-md ring-2 ring-[#052a51]/10"
              : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50"
          }`}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              {/* Radio Indicator */}
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    !isOnline
                      ? "border-[#052a51] bg-[#052a51]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {!isOnline && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Text & Icon Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Cash on Delivery (COD)
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    Pay at Doorstep / Site
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                  Pay in cash or via UPI scanning directly to the delivery partner upon receiving materials at your delivery site.
                </p>

                {/* Pincode Availability Indicator */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                    <Check size={13} className="text-emerald-600" />
                    <span>Available for {pincode ? `PIN ${pincode}` : "your delivery address"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Truck size={13} />
                    <span>Verified dispatch to site</span>
                  </div>
                </div>

                {/* Selected Details Preview */}
                {!isOnline && (
                  <div className="mt-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                    <Banknote size={15} className="text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      Please ensure the exact amount of <strong>{formattedTotal}</strong> or an active UPI app is available at the time of delivery.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA & Navigation */}
      <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDelivery}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Delivery
        </button>

        <button
          type="button"
          onClick={onTriggerPayment}
          disabled={isProcessing}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm sm:text-base font-black text-white shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isOnline
              ? "bg-[#052a51] hover:bg-[#0A3D6B] active:scale-[0.99]"
              : "bg-[#F26522] hover:bg-[#d95315] active:scale-[0.99]"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Order...</span>
            </>
          ) : isOnline ? (
            <>
              <Lock size={16} />
              <span>Pay {formattedTotal} Securely</span>
            </>
          ) : (
            <>
              <Truck size={16} />
              <span>Place Cash on Delivery Order ({formattedTotal})</span>
            </>
          )}
        </button>
      </div>

      {/* Security & Trust Footer */}
      <div className="pt-2 flex items-center justify-center gap-6 text-[11px] font-semibold text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-500" /> 100% Purchase Protection
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1">
          <Lock size={12} className="text-gray-400" /> Razorpay Verified Gateway
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Instant Order Confirmation</span>
      </div>
    </div>
  );
}
