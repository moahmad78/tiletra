"use client";

import React, { useState } from "react";
import {
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  Lock,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
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
import UpiIntentButtons, { type UpiSubOption } from "./UpiIntentButtons";
import UpiCollectForm from "./UpiCollectForm";
import UpiQrForm from "./UpiQrForm";
import CardPaymentForm from "./CardPaymentForm";
import NetBankingForm from "./NetBankingForm";
import CodForm from "./CodForm";

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

export interface PaymentData {
  method: PaymentMethod;
  upiApp?: UpiSubOption;
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
  onQrPaymentSuccess: (paymentId: string) => void;
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
  onQrPaymentSuccess,
  onBackToDelivery,
  isProcessing,
}: PaymentStepProps) {
  const [upiSubOption, setUpiSubOption] = useState<UpiSubOption>(paymentData.upiApp || "gpay");
  const [vpa, setVpa] = useState(paymentData.vpa || "");
  const [cardNumber, setCardNumber] = useState(paymentData.cardNumber || "");
  const [cardExpiry, setCardExpiry] = useState(paymentData.cardExpiry || "");
  const [cardCvv, setCardCvv] = useState(paymentData.cardCvv || "");
  const [cardName, setCardName] = useState(paymentData.cardName || "");
  const [selectedBank, setSelectedBank] = useState(paymentData.bankCode || "SBIN");

  const handleSelectMethod = (method: PaymentMethod) => {
    onPaymentDataChange({
      ...paymentData,
      method,
      upiApp: method === "upi" ? upiSubOption : undefined,
    });
  };

  const handleSelectUpiSubOption = (option: UpiSubOption) => {
    setUpiSubOption(option);
    onPaymentDataChange({
      ...paymentData,
      method: "upi",
      upiApp: option,
    });
  };

  const CATEGORIES: {
    id: PaymentMethod;
    title: string;
    subtext: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: "upi",
      title: "UPI",
      subtext: "Google Pay, PhonePe, Paytm, QR",
      icon: <Smartphone size={18} />,
      badge: "Instant",
    },
    {
      id: "card",
      title: "Credit / Debit Card",
      subtext: "Visa, Mastercard, RuPay & more",
      icon: <CreditCard size={18} />,
    },
    {
      id: "netbanking",
      title: "Net Banking",
      subtext: "50+ Supported Indian Banks",
      icon: <Building2 size={18} />,
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      subtext: "Pay at site upon arrival",
      icon: <Banknote size={18} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Horizontal Tabs */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = paymentData.method === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectMethod(cat.id)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 shrink-0 transition-all border ${
                isSelected
                  ? "bg-[#052a51] text-white border-[#052a51] shadow-2xs"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
              {cat.badge && (
                <span className="text-[9px] bg-[#F26522] text-white px-1.5 py-0.2 rounded font-black">
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main 2-Panel Layout on Desktop */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Left Panel: Payment Method Selector (Desktop) */}
          <div className="hidden md:flex md:col-span-5 bg-gray-50/70 border-r border-gray-200/80 p-4 flex-col justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-3 py-1">
                Select Payment Mode
              </p>
              {CATEGORIES.map((cat) => {
                const isSelected = paymentData.method === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectMethod(cat.id)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? "bg-white border-[#052a51] shadow-2xs text-[#052a51]"
                        : "bg-transparent border-transparent hover:bg-white/70 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? "bg-[#052a51] text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-black">{cat.title}</p>
                          {cat.badge && (
                            <span className="text-[9px] font-black bg-[#F26522] text-white px-1.5 py-0.2 rounded">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">{cat.subtext}</p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={isSelected ? "text-[#052a51]" : "text-gray-300"}
                    />
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-white rounded-2xl border border-gray-200/60 text-[11px] text-gray-500 space-y-1 mt-4">
              <p className="flex items-center gap-1.5 font-bold text-[#052a51]">
                <Lock size={12} className="text-[#2F7A4F]" />
                Bank-Grade 256-Bit Security
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                Direct integration with Razorpay PCI-DSS certified gateway.
              </p>
            </div>
          </div>

          {/* Right Panel: Selected Payment Form Content */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-6">
            {/* UPI Option */}
            {paymentData.method === "upi" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                    Pay using Unified Payments Interface (UPI)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select your UPI app, enter a UPI ID, or scan the dynamic QR code
                  </p>
                </div>

                <UpiIntentButtons
                  selectedSubOption={upiSubOption}
                  onSelectSubOption={handleSelectUpiSubOption}
                />

                {upiSubOption === "other" && (
                  <UpiCollectForm
                    vpa={vpa}
                    onVpaChange={(newVpa) => {
                      setVpa(newVpa);
                      onPaymentDataChange({ ...paymentData, vpa: newVpa });
                    }}
                    onSubmit={onTriggerPayment}
                    isProcessing={isProcessing}
                    totalAmount={totalAmount}
                  />
                )}

                {upiSubOption === "qr" && (
                  <UpiQrForm
                    totalAmount={totalAmount}
                    orderId={orderId}
                    onPaymentSuccess={onQrPaymentSuccess}
                  />
                )}

                {["gpay", "phonepe", "paytm"].includes(upiSubOption) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50/60 border border-[#F26522]/20 rounded-2xl text-xs text-gray-700 space-y-1.5">
                      <p className="font-bold text-[#052a51]">
                        Direct App Authorization (
                        {upiSubOption === "gpay"
                          ? "Google Pay"
                          : upiSubOption === "phonepe"
                          ? "PhonePe"
                          : "Paytm"}
                        )
                      </p>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        On mobile, tapping Pay will seamlessly launch your UPI application. On desktop, a secure authorization request or QR will open for instant one-click approval.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onTriggerPayment}
                      disabled={isProcessing}
                      className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <span>
                        {isProcessing
                          ? "Connecting to UPI..."
                          : `Pay ₹${totalAmount.toLocaleString("en-IN")} via ${
                              upiSubOption === "gpay"
                                ? "Google Pay"
                                : upiSubOption === "phonepe"
                                ? "PhonePe"
                                : "Paytm"
                            }`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Card Option */}
            {paymentData.method === "card" && (
              <CardPaymentForm
                totalAmount={totalAmount}
                cardNumber={cardNumber}
                cardExpiry={cardExpiry}
                cardCvv={cardCvv}
                cardName={cardName}
                onCardNumberChange={(val) => {
                  setCardNumber(val);
                  onPaymentDataChange({ ...paymentData, cardNumber: val });
                }}
                onCardExpiryChange={(val) => {
                  setCardExpiry(val);
                  onPaymentDataChange({ ...paymentData, cardExpiry: val });
                }}
                onCardCvvChange={(val) => {
                  setCardCvv(val);
                  onPaymentDataChange({ ...paymentData, cardCvv: val });
                }}
                onCardNameChange={(val) => {
                  setCardName(val);
                  onPaymentDataChange({ ...paymentData, cardName: val });
                }}
                onSubmit={onTriggerPayment}
                isProcessing={isProcessing}
              />
            )}

            {/* Net Banking Option */}
            {paymentData.method === "netbanking" && (
              <NetBankingForm
                selectedBank={selectedBank}
                onSelectBank={(code) => {
                  setSelectedBank(code);
                  onPaymentDataChange({ ...paymentData, bankCode: code });
                }}
                onSubmit={onTriggerPayment}
                isProcessing={isProcessing}
                totalAmount={totalAmount}
              />
            )}

            {/* Cash on Delivery Option */}
            {paymentData.method === "cod" && (
              <CodForm
                totalAmount={totalAmount}
                pincode={pincode}
                onSubmit={onTriggerPayment}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="flex items-center justify-start pt-1">
        <button
          type="button"
          onClick={onBackToDelivery}
          className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Delivery Options</span>
        </button>
      </div>
    </div>
  );
}
