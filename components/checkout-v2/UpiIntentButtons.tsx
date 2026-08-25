"use client";

import React from "react";
import { GPayIcon, PhonePeIcon, PaytmIcon, UpiIcon } from "@/components/checkout/PaymentIcons";
import { ArrowRight, QrCode } from "lucide-react";

export type UpiSubOption = "gpay" | "phonepe" | "paytm" | "other" | "qr";

interface UpiIntentButtonsProps {
  selectedSubOption: UpiSubOption;
  onSelectSubOption: (option: UpiSubOption) => void;
}

export default function UpiIntentButtons({
  selectedSubOption,
  onSelectSubOption,
}: UpiIntentButtonsProps) {
  const UPI_APPS: { id: UpiSubOption; label: string; icon: React.ReactNode }[] = [
    { id: "gpay", label: "Google Pay", icon: <GPayIcon className="h-4.5 w-auto" /> },
    { id: "phonepe", label: "PhonePe", icon: <PhonePeIcon className="h-4.5 w-auto" /> },
    { id: "paytm", label: "Paytm", icon: <PaytmIcon className="h-4.5 w-auto" /> },
    { id: "other", label: "UPI ID", icon: <UpiIcon className="h-4.5 w-auto" /> },
    {
      id: "qr",
      label: "Scan QR",
      icon: (
        <div className="h-4.5 flex items-center gap-1 text-[#052a51] font-black text-xs">
          <QrCode size={16} className="text-[#F26522]" />
          <span>QR</span>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {UPI_APPS.map((app) => {
        const isSelected = selectedSubOption === app.id;
        return (
          <button
            key={app.id}
            type="button"
            onClick={() => onSelectSubOption(app.id)}
            className={`p-2.5 sm:p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              isSelected
                ? "border-[#052a51] bg-[#052a51] text-white shadow-2xs"
                : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
            }`}
          >
            <div className="shrink-0">{app.icon}</div>
            <span className="text-[11px] truncate">{app.label}</span>
          </button>
        );
      })}
    </div>
  );
}
