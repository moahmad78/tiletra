"use client";

import React, { useState } from "react";
import { Banknote, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { CodCashBadge } from "@/components/checkout/PaymentIcons";

interface CodFormProps {
  totalAmount: number;
  pincode?: string;
  blockedPincodes?: string[];
  maxLimit?: number;
  onSubmit: () => void;
  isProcessing: boolean;
}

export default function CodForm({
  totalAmount,
  pincode,
  blockedPincodes = ["560099", "560088"],
  maxLimit = 25000,
  onSubmit,
  isProcessing,
}: CodFormProps) {
  const [agreed, setAgreed] = useState(true);

  const isBlockedPincode = pincode && blockedPincodes.includes(pincode.trim());
  const exceedsMaxLimit = totalAmount > maxLimit;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
          <Banknote size={16} className="text-[#2F7A4F]" />
          Cash on Delivery (COD)
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Pay with cash or UPI QR directly to the delivery partner when your materials arrive at your site.
        </p>
      </div>

      <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3.5">
        <div className="flex items-center gap-2">
          <CodCashBadge />
        </div>

        {exceedsMaxLimit && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle size={15} className="shrink-0 text-rose-600 mt-0.5" />
            <span>
              Cash on Delivery is only available for orders up to ₹{maxLimit.toLocaleString("en-IN")}. Please select UPI, Card, or Net Banking.
            </span>
          </div>
        )}

        {isBlockedPincode && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
            <span>
              Cash on Delivery is currently unavailable for postal code {pincode}. Please choose an online payment option.
            </span>
          </div>
        )}

        {!exceedsMaxLimit && !isBlockedPincode && (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-center gap-2 text-[#2F7A4F] font-bold">
              <CheckCircle2 size={15} />
              <span>Available for delivery address (PIN {pincode || "560034"})</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Please ensure an authorized representative is available with exact cash or digital UPI to receive the shipment upon arrival.
            </p>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded text-[#052a51] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-700 select-none">
                I agree to pay ₹{totalAmount.toLocaleString("en-IN")} upon delivery.
              </span>
            </label>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing || exceedsMaxLimit || Boolean(isBlockedPincode) || !agreed}
        className="w-full h-12 bg-[#2F7A4F] hover:bg-[#25633f] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Placing COD Order...</span>
          </>
        ) : (
          <>
            <span>Confirm Order with Cash on Delivery</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
