"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Check,
  Lock,
  ShieldCheck,
  ChevronDown,
  Info,
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
} from "./PaymentIcons";

export type PaymentMethodType = "upi" | "card" | "netbanking" | "cod";

export interface PaymentSelectionState {
  method: PaymentMethodType;
  upiApp?: "gpay" | "phonepe" | "paytm" | "other";
  upiId?: string;
  bankCode?: string;
}

interface PaymentSectionProps {
  totalAmount: number;
  paymentState: PaymentSelectionState;
  onPaymentStateChange: (state: PaymentSelectionState) => void;
  isProcessing: boolean;
  onPaySubmit: () => void;
  onBack: () => void;
}

const POPULAR_BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "SBIN", name: "SBI" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "KKBK", name: "Kotak Bank" },
];

const ALL_BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "SBIN", name: "State Bank of India (SBI)" },
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

export default function PaymentSection({
  totalAmount,
  paymentState,
  onPaymentStateChange,
  isProcessing,
  onPaySubmit,
  onBack,
}: PaymentSectionProps) {
  const [customUpiInput, setCustomUpiInput] = useState(paymentState.upiId || "");

  const handleSelectMethod = (method: PaymentMethodType) => {
    onPaymentStateChange({
      ...paymentState,
      method,
    });
  };

  const handleUpiAppSelect = (app: "gpay" | "phonepe" | "paytm" | "other") => {
    onPaymentStateChange({
      ...paymentState,
      method: "upi",
      upiApp: app,
    });
  };

  const handleBankSelect = (code: string) => {
    onPaymentStateChange({
      ...paymentState,
      method: "netbanking",
      bankCode: code,
    });
  };

  const handleUpiInputChange = (val: string) => {
    setCustomUpiInput(val);
    onPaymentStateChange({
      ...paymentState,
      method: "upi",
      upiId: val.trim(),
    });
  };

  const formattedTotal = "₹" + totalAmount.toLocaleString("en-IN");

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border border-gray-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center shadow-xs">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#052a51]">Payment Method</h2>
            <p className="text-xs text-gray-500">Select your preferred way to pay securely.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Payable
          </span>
          <span className="text-lg sm:text-xl font-black text-[#F26522]">{formattedTotal}</span>
        </div>
      </div>

      {/* Embedded Payment Method Selection List */}
      <div className="space-y-3.5">
        {/* ── METHOD 1: UPI ── */}
        <div
          onClick={() => handleSelectMethod("upi")}
          className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            paymentState.method === "upi"
              ? "border-[#F26522] bg-[#F26522]/5 shadow-xs"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <input
              type="radio"
              name="payment-option"
              checked={paymentState.method === "upi"}
              onChange={() => handleSelectMethod("upi")}
              className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#052a51]">UPI</span>
                  <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-wider">
                    Instant
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  Google Pay • PhonePe • Paytm • Any UPI ID
                </span>
              </div>

              {/* UPI Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <UpiIcon />
                <GPayIcon />
                <PhonePeIcon />
                <PaytmIcon />
              </div>

              {/* UPI Sub-Options Accordion */}
              {paymentState.method === "upi" && (
                <div
                  className="mt-3 pt-3 border-t border-[#F26522]/20 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-gray-700">Choose UPI Option:</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "gpay", label: "Google Pay", icon: <GPayIcon className="h-4 w-auto" /> },
                      { id: "phonepe", label: "PhonePe", icon: <PhonePeIcon className="h-4 w-auto" /> },
                      { id: "paytm", label: "Paytm", icon: <PaytmIcon className="h-4 w-auto" /> },
                      { id: "other", label: "Enter UPI ID", icon: <UpiIcon className="h-4 w-auto" /> },
                    ].map((app) => {
                      const isSelected = paymentState.upiApp === app.id;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => handleUpiAppSelect(app.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? "border-[#052a51] bg-[#052a51] text-white shadow-2xs"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          <div className="h-5 flex items-center justify-center">{app.icon}</div>
                          <span className="text-[11px]">{app.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {paymentState.upiApp === "other" && (
                    <div className="pt-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-600 block">
                        Enter UPI ID (e.g. mobile@upi, username@okhdfcbank)
                      </label>
                      <input
                        type="text"
                        value={customUpiInput}
                        onChange={(e) => handleUpiInputChange(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-medium bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── METHOD 2: CREDIT / DEBIT CARDS ── */}
        <div
          onClick={() => handleSelectMethod("card")}
          className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            paymentState.method === "card"
              ? "border-[#F26522] bg-[#F26522]/5 shadow-xs"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <input
              type="radio"
              name="payment-option"
              checked={paymentState.method === "card"}
              onChange={() => handleSelectMethod("card")}
              className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#052a51]">
                    Credit / Debit Cards
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                    All Major Cards
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  Visa • Mastercard • RuPay • Maestro
                </span>
              </div>

              {/* Card Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <VisaIcon />
                <MastercardIcon />
                <RuPayIcon />
              </div>

              {paymentState.method === "card" && (
                <div
                  className="mt-3 pt-3 border-t border-[#F26522]/20 text-xs text-gray-600 space-y-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-semibold text-[#052a51] flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    <span>Card authentication handled through secure 3D Secure / OTP gateway.</span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Tiletra does not store your card number or CVV credentials.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── METHOD 3: NET BANKING ── */}
        <div
          onClick={() => handleSelectMethod("netbanking")}
          className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            paymentState.method === "netbanking"
              ? "border-[#F26522] bg-[#F26522]/5 shadow-xs"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <input
              type="radio"
              name="payment-option"
              checked={paymentState.method === "netbanking"}
              onChange={() => handleSelectMethod("netbanking")}
              className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#052a51]">Net Banking</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                    50+ Banks
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  Direct Bank Account Transfer
                </span>
              </div>

              {/* NetBanking Badge */}
              <div className="pt-1">
                <NetBankingIcon />
              </div>

              {paymentState.method === "netbanking" && (
                <div
                  className="mt-3 pt-3 border-t border-[#F26522]/20 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-gray-700">Popular Banks:</p>

                  {/* Popular Bank Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {POPULAR_BANKS.map((b) => {
                      const isSelected = paymentState.bankCode === b.code;
                      return (
                        <button
                          key={b.code}
                          type="button"
                          onClick={() => handleBankSelect(b.code)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer ${
                            isSelected
                              ? "border-[#052a51] bg-[#052a51] text-white shadow-2xs"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          <span>{b.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* All Banks Dropdown */}
                  <div className="pt-1 space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">
                      Or Select from All Supported Indian Banks:
                    </label>
                    <div className="relative">
                      <select
                        value={paymentState.bankCode || ""}
                        onChange={(e) => handleBankSelect(e.target.value)}
                        className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-medium bg-white appearance-none cursor-pointer"
                      >
                        <option value="">-- Choose Other Bank --</option>
                        {ALL_BANKS.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── METHOD 4: CASH ON DELIVERY (COD) ── */}
        <div
          onClick={() => handleSelectMethod("cod")}
          className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            paymentState.method === "cod"
              ? "border-[#F26522] bg-[#F26522]/5 shadow-xs"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <input
              type="radio"
              name="payment-option"
              checked={paymentState.method === "cod"}
              onChange={() => handleSelectMethod("cod")}
              className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#052a51]">
                    Cash on Delivery (COD)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    Available on All Items
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <span>💵 Pay at Doorstep</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pay with cash or scan the delivery driver&apos;s UPI QR code when your tile crates arrive at your doorstep.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="h-12 sm:h-13 px-4 sm:px-6 border-2 border-gray-200 hover:border-gray-300 text-[#052a51] font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            ← Back
          </button>

          {paymentState.method === "cod" ? (
            <button
              id="cod-place-order-btn"
              type="button"
              onClick={onPaySubmit}
              disabled={isProcessing}
              className="flex-1 h-12 sm:h-13 bg-[#052a51] hover:bg-[#0b3b6d] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing your order...</span>
                </>
              ) : (
                <>
                  <Check size={16} className="text-[#F26522]" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          ) : (
            <button
              id="online-pay-btn"
              type="button"
              onClick={onPaySubmit}
              disabled={isProcessing}
              className="flex-1 h-12 sm:h-13 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing secure payment...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Pay {formattedTotal}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Security Guarantee Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500 pt-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>🔒 256-bit Bank-Grade Encryption · 100% Safe & Verified</span>
        </div>
      </div>
    </div>
  );
}
