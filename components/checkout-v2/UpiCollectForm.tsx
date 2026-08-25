"use client";

import React, { useState } from "react";
import { Smartphone, Check, Loader2, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { UpiIcon } from "@/components/checkout/PaymentIcons";
import { toast } from "sonner";

interface UpiCollectFormProps {
  vpa: string;
  onVpaChange: (vpa: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  totalAmount: number;
}

export default function UpiCollectForm({
  vpa,
  onVpaChange,
  onSubmit,
  isProcessing,
  totalAmount,
}: UpiCollectFormProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isValidFormat = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa.trim());

  const handleVerify = () => {
    if (!isValidFormat) {
      toast.error("Please enter a valid UPI ID (e.g. yourname@oksbi or mobile@paytm)");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
      toast.success("UPI ID format verified!");
    }, 600);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
          <Smartphone size={16} className="text-[#F26522]" />
          Enter Virtual Payment Address (UPI ID)
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Enter your UPI ID to receive a direct payment request in your Google Pay, PhonePe, Paytm, or BHIM app.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
        <label className="block text-xs font-bold text-gray-700">
          Virtual Payment Address (VPA)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={vpa}
              onChange={(e) => {
                onVpaChange(e.target.value.trim().toLowerCase());
                setIsVerified(false);
              }}
              placeholder="e.g. mobile@okhdfcbank / success@razorpay"
              className="w-full h-11 pl-3.5 pr-14 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#2F7A4F] bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
              UPI
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isValidFormat || verifying || isVerified}
            className="px-4 h-11 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {verifying ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isVerified ? (
              <>
                <Check size={13} className="text-[#2F7A4F]" />
                <span className="text-[#2F7A4F]">Verified</span>
              </>
            ) : (
              <span>Verify</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Info size={13} className="shrink-0 text-[#052a51]" />
          <span>A collect notification will be pushed to your UPI app for instant approval.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing || !isValidFormat}
        className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Connecting to UPI Gateway...</span>
          </>
        ) : (
          <>
            <span>Pay ₹{totalAmount.toLocaleString("en-IN")} via UPI Collect</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
