"use client";

import React, { useState } from "react";
import { CreditCard, Lock, ShieldCheck, ArrowRight, Loader2, Info } from "lucide-react";
import { VisaIcon, MastercardIcon, RuPayIcon } from "@/components/checkout/PaymentIcons";

interface CardPaymentFormProps {
  totalAmount: number;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
  onCardNumberChange: (val: string) => void;
  onCardExpiryChange: (val: string) => void;
  onCardCvvChange: (val: string) => void;
  onCardNameChange: (val: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export default function CardPaymentForm({
  totalAmount,
  cardNumber,
  cardExpiry,
  cardCvv,
  cardName,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvvChange,
  onCardNameChange,
  onSubmit,
  isProcessing,
}: CardPaymentFormProps) {
  const getCardIcon = () => {
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.startsWith("4")) return <VisaIcon />;
    if (/^5[1-5]/.test(clean)) return <MastercardIcon />;
    if (/^(60|65|81|82)/.test(clean)) return <RuPayIcon />;
    return (
      <div className="flex items-center gap-1 opacity-60">
        <VisaIcon />
        <MastercardIcon />
        <RuPayIcon />
      </div>
    );
  };

  const isFormValid =
    cardNumber.replace(/\s/g, "").length >= 15 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3 &&
    cardName.trim().length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
            <CreditCard size={16} className="text-[#F26522]" />
            Enter Card Information
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Pay securely with any Visa, MasterCard, RuPay, or Maestro Credit or Debit card.
          </p>
        </div>
        <div>{getCardIcon()}</div>
      </div>

      <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5">
        {/* Card Number */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Card Number</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "").slice(0, 16);
                const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                onCardNumberChange(formatted);
              }}
              placeholder="4532 •••• •••• 8892"
              className="w-full h-11 pl-3.5 pr-14 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] tracking-wider focus:outline-none focus:border-[#F26522]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Lock size={14} className="text-[#2F7A4F]" />
            </div>
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">Valid Thru (MM/YY)</label>
            <input
              type="text"
              value={cardExpiry}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (val.length >= 3) {
                  val = val.slice(0, 2) + "/" + val.slice(2);
                }
                onCardExpiryChange(val);
              }}
              placeholder="MM/YY"
              className="w-full h-11 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] tracking-wider focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">CVV / CVC</label>
            <input
              type="password"
              value={cardCvv}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                onCardCvvChange(val);
              }}
              placeholder="3 or 4 digits"
              className="w-full h-11 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] tracking-widest focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Name on Card</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => onCardNameChange(e.target.value)}
            placeholder="e.g. MOHAMMAD AHMAD"
            className="w-full h-11 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] uppercase focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
          <ShieldCheck size={14} className="text-[#2F7A4F] shrink-0" />
          <span>Card details are tokenized securely via PCI-DSS Level-1 Razorpay Gateway.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing || !isFormValid}
        className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Authorizing Card...</span>
          </>
        ) : (
          <>
            <span>Pay ₹{totalAmount.toLocaleString("en-IN")} via Card</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
