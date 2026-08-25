"use client";

import React from "react";
import { Building2, ArrowRight, Loader2, Info, Check } from "lucide-react";

const POPULAR_BANKS = [
  { code: "SBIN", name: "State Bank of India", badge: "SBI" },
  { code: "HDFC", name: "HDFC Bank", badge: "HDFC" },
  { code: "ICIC", name: "ICICI Bank", badge: "ICICI" },
  { code: "UTIB", name: "Axis Bank", badge: "AXIS" },
  { code: "KKBK", name: "Kotak Mahindra Bank", badge: "KOTAK" },
];

const ALL_BANKS = [
  { code: "SBIN", name: "State Bank of India (SBI)" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "BARB_R", name: "Bank of Baroda" },
  { code: "PUNB_R", name: "Punjab National Bank" },
  { code: "CNRB", name: "Canara Bank" },
  { code: "UBIN", name: "Union Bank of India" },
  { code: "INDB", name: "IndusInd Bank" },
  { code: "YESB", name: "Yes Bank" },
  { code: "IBKL", name: "IDBI Bank" },
  { code: "FDRL", name: "Federal Bank" },
  { code: "IDIB", name: "Indian Bank" },
  { code: "BKID", name: "Bank of India" },
  { code: "RATN", name: "RBL Bank" },
  { code: "AUBL", name: "AU Small Finance Bank" },
];

interface NetBankingFormProps {
  selectedBank: string;
  onSelectBank: (code: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  totalAmount: number;
}

export default function NetBankingForm({
  selectedBank,
  onSelectBank,
  onSubmit,
  isProcessing,
  totalAmount,
}: NetBankingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
          <Building2 size={16} className="text-[#F26522]" />
          Select Net Banking Option
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Select your bank to authenticate and complete payment securely through your internet banking portal.
        </p>
      </div>

      <div className="space-y-3">
        {/* Popular Banks */}
        <label className="block text-xs font-bold text-gray-700">Popular Banks</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {POPULAR_BANKS.map((b) => {
            const isSelected = selectedBank === b.code;
            return (
              <button
                key={b.code}
                type="button"
                onClick={() => onSelectBank(b.code)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? "border-[#052a51] bg-[#052a51] text-white shadow-2xs"
                    : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                }`}
              >
                <span className="text-xs font-black tracking-wider">{b.badge}</span>
                <span className="text-[10px] truncate max-w-full font-medium">{b.name}</span>
              </button>
            );
          })}
        </div>

        {/* All Banks Dropdown */}
        <div className="pt-2 space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">All Other Indian Banks</label>
          <select
            value={selectedBank}
            onChange={(e) => onSelectBank(e.target.value)}
            className="w-full h-11 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
          >
            <option value="">Select from 50+ Banks...</option>
            {ALL_BANKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2 text-[11px] text-blue-950">
          <Info size={14} className="shrink-0 text-blue-600 mt-0.5" />
          <span>
            You will be redirected securely to your bank&apos;s authorization portal. After completing the transfer, you will automatically return to Intrihub.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing || !selectedBank}
        className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Redirecting to Bank...</span>
          </>
        ) : (
          <>
            <span>Proceed to Net Banking (₹{totalAmount.toLocaleString("en-IN")})</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
