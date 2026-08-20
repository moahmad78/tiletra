"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Check,
  Lock,
  QrCode,
  ShieldCheck,
  ChevronDown,
  Info,
  Calendar,
  KeyRound,
  User,
  Download,
  Share2,
  RefreshCw,
  Clock,
  CheckCircle2,
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
} from "./PaymentIcons";
import { toast } from "sonner";

export type PaymentMethodType = "upi" | "card" | "netbanking" | "cod";

export interface PaymentSelectionState {
  method: PaymentMethodType;
  upiApp?: "gpay" | "phonepe" | "paytm" | "other" | "qr";
  upiId?: string;
  bankCode?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
}

interface PaymentSectionProps {
  totalAmount: number;
  paymentState: PaymentSelectionState;
  onPaymentStateChange: (state: PaymentSelectionState) => void;
  isProcessing: boolean;
  onPaySubmit: () => void;
  onBack: () => void;
  orderId?: string;
}

const POPULAR_BANKS = [
  { code: "SBIN", name: "SBI" },
  { code: "HDFC", name: "HDFC" },
  { code: "ICIC", name: "ICICI" },
  { code: "UTIB", name: "Axis" },
  { code: "KKBK", name: "Kotak" },
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

export default function PaymentSection({
  totalAmount,
  paymentState,
  onPaymentStateChange,
  isProcessing,
  onPaySubmit,
  onBack,
  orderId = "TILE" + Math.floor(100000 + Math.random() * 900000),
}: PaymentSectionProps) {
  const [customUpiInput, setCustomUpiInput] = useState(paymentState.upiId || "");
  const [cardNumber, setCardNumber] = useState(paymentState.cardNumber || "");
  const [cardExpiry, setCardExpiry] = useState(paymentState.cardExpiry || "");
  const [cardCvv, setCardCvv] = useState(paymentState.cardCvv || "");
  const [cardName, setCardName] = useState(paymentState.cardName || "");

  // QR State & Timer (15 minutes countdown)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(15 * 60);
  const [qrStatus, setQrStatus] = useState<"WAITING" | "PROCESSING" | "PAID" | "EXPIRED">("WAITING");

  const formattedTotal = "₹" + totalAmount.toLocaleString("en-IN");

  // Timer countdown for QR
  useEffect(() => {
    if (paymentState.method !== "upi" || paymentState.upiApp !== "qr") return;

    if (qrSecondsLeft <= 0) {
      setQrStatus("EXPIRED");
      return;
    }

    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState.method, paymentState.upiApp, qrSecondsLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectMethod = (method: PaymentMethodType) => {
    onPaymentStateChange({
      ...paymentState,
      method,
    });
  };

  const handleUpiAppSelect = (app: "gpay" | "phonepe" | "paytm" | "other" | "qr") => {
    onPaymentStateChange({
      ...paymentState,
      method: "upi",
      upiApp: app,
    });
    if (app === "qr") {
      setQrSecondsLeft(15 * 60);
      setQrStatus("WAITING");
    }
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

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
    onPaymentStateChange({
      ...paymentState,
      cardNumber: formatted,
    });
  };

  // Format Card Expiry (MM / YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    let formatted = raw;
    if (raw.length >= 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(formatted);
    onPaymentStateChange({
      ...paymentState,
      cardExpiry: formatted,
    });
  };

  // Format Card CVV (3 or 4 digits)
  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(raw);
    onPaymentStateChange({
      ...paymentState,
      cardCvv: raw,
    });
  };

  // Dynamic QR Image URL generator (Standard UPI payload)
  const qrUpiPayload = `upi://pay?pa=intrihub@razorpay&pn=Tiletra%20Intrihub&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrUpiPayload
  )}&margin=10`;

  // Download QR handler
  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiletra-payment-${orderId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payment QR code downloaded!");
    } catch {
      toast.error("Failed to download QR image");
    }
  };

  // Share QR handler
  const handleShareQr = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tiletra Payment QR",
          text: `Scan & Pay ₹${totalAmount.toLocaleString(
            "en-IN"
          )} for Tiletra Order #${orderId}`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(qrUpiPayload);
      toast.success("UPI payment intent copied to clipboard!");
    }
  };

  // Determine card type icon
  const getCardIcon = () => {
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.startsWith("4")) return <VisaIcon />;
    if (
      clean.startsWith("51") ||
      clean.startsWith("52") ||
      clean.startsWith("53") ||
      clean.startsWith("54") ||
      clean.startsWith("55")
    )
      return <MastercardIcon />;
    if (
      clean.startsWith("60") ||
      clean.startsWith("65") ||
      clean.startsWith("81") ||
      clean.startsWith("82")
    )
      return <RuPayIcon />;
    return (
      <div className="flex items-center gap-1">
        <VisaIcon />
        <MastercardIcon />
        <RuPayIcon />
      </div>
    );
  };

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
      </div>

      {/* Embedded Payment Method Cards (Accordion Expansion) */}
      <div className="space-y-3">
        {/* ── METHOD 1: UPI ── */}
        <div
          onClick={() => handleSelectMethod("upi")}
          className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
            paymentState.method === "upi"
              ? "border-[#F26522] bg-[#F26522]/5 shadow-xs"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <input
                type="radio"
                name="payment-option"
                checked={paymentState.method === "upi"}
                onChange={() => handleSelectMethod("upi")}
                className="w-4 h-4 accent-[#F26522] cursor-pointer shrink-0"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-black text-[#052a51]">UPI</span>
                <span className="text-xs text-gray-500 font-medium">Fast & secure</span>
              </div>
            </div>

            {/* Expanded UPI Options */}
            {paymentState.method === "upi" && (
              <div
                className="mt-4 pt-3.5 border-t border-[#F26522]/20 space-y-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold text-gray-700">Choose UPI option:</p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "gpay", label: "Google Pay", icon: <GPayIcon className="h-4 w-auto" /> },
                    { id: "phonepe", label: "PhonePe", icon: <PhonePeIcon className="h-4 w-auto" /> },
                    { id: "paytm", label: "Paytm", icon: <PaytmIcon className="h-4 w-auto" /> },
                    { id: "other", label: "UPI ID", icon: <UpiIcon className="h-4 w-auto" /> },
                    {
                      id: "qr",
                      label: "Scan QR",
                      icon: (
                        <div className="h-4 flex items-center gap-1 text-[#052a51] font-black text-[11px]">
                          <QrCode size={16} className="text-[#F26522]" />
                          <span>QR</span>
                        </div>
                      ),
                    },
                  ].map((app) => {
                    const isSelected = (paymentState.upiApp || "gpay") === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleUpiAppSelect(app.id as any)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
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

                {/* Option A: Enter UPI ID input field */}
                {paymentState.upiApp === "other" && (
                  <div className="pt-1.5 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 block">
                      Enter UPI ID / VPA:
                    </label>
                    <input
                      type="text"
                      value={customUpiInput}
                      onChange={(e) => handleUpiInputChange(e.target.value)}
                      placeholder="username@okhdfcbank or mobile@upi"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-medium bg-white"
                    />
                    <p className="text-[10px] text-gray-500">
                      A payment request will be sent to your UPI application for authorization.
                    </p>
                  </div>
                )}

                {/* Option B: Scan & Pay QR Code Container */}
                {paymentState.upiApp === "qr" && (
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-orange-200 shadow-2xs text-center space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <QrCode size={18} className="text-[#F26522]" />
                        <span className="text-xs font-bold text-[#052a51]">Scan & Pay with any UPI App</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Clock size={13} />
                        <span>Expires in {formatTimer(qrSecondsLeft)}</span>
                      </div>
                    </div>

                    {/* QR Image Box */}
                    <div className="flex flex-col items-center justify-center py-2">
                      {qrStatus === "EXPIRED" ? (
                        <div className="w-48 h-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 p-4">
                          <p className="text-xs font-bold text-rose-600">QR Code Expired</p>
                          <button
                            type="button"
                            onClick={() => {
                              setQrSecondsLeft(15 * 60);
                              setQrStatus("WAITING");
                              toast.info("Generated fresh QR Code");
                            }}
                            className="px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RefreshCw size={13} />
                            <span>Regenerate QR</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative p-2 bg-white rounded-2xl border-2 border-gray-200 shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrImageUrl}
                            alt="Tiletra Payment QR Code"
                            className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
                          />
                        </div>
                      )}

                      <div className="mt-3 space-y-0.5">
                        <p className="text-xs text-gray-500 font-medium">Payable Amount</p>
                        <p className="text-lg font-black text-[#F26522]">{formattedTotal}</p>
                      </div>
                    </div>

                    {/* Download and Share Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        disabled={qrStatus === "EXPIRED"}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Download size={14} />
                        <span>Download QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleShareQr}
                        disabled={qrStatus === "EXPIRED"}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Share2 size={14} />
                        <span>Share QR</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500 pt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Waiting for payment detection...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <input
                type="radio"
                name="payment-option"
                checked={paymentState.method === "card"}
                onChange={() => handleSelectMethod("card")}
                className="w-4 h-4 accent-[#F26522] cursor-pointer shrink-0"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-black text-[#052a51]">
                  Credit / Debit Card
                </span>
                <span className="text-xs text-gray-500 font-medium">Visa • Mastercard • RuPay</span>
              </div>
            </div>

            {/* Expanded Secure Tokenized Card Fields */}
            {paymentState.method === "card" && (
              <div
                className="mt-4 pt-3.5 border-t border-[#F26522]/20 space-y-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700">Enter Card Details:</p>
                  {getCardIcon()}
                </div>

                <div className="space-y-3">
                  {/* Card Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• 8892"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-mono font-medium bg-white"
                      />
                      <CreditCard
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 block">Expiry (MM/YY)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleCardExpiryChange}
                          placeholder="MM/YY"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-mono font-medium bg-white"
                        />
                        <Calendar
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 block">CVV</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={handleCardCvvChange}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-mono font-medium bg-white"
                        />
                        <KeyRound
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">Name on Card</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => {
                          setCardName(e.target.value);
                          onPaymentStateChange({ ...paymentState, cardName: e.target.value });
                        }}
                        placeholder="Cardholder Full Name"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-medium bg-white uppercase"
                      />
                      <User
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>3D Secure / OTP authorization will be verified with your issuing bank.</span>
                </div>
              </div>
            )}
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
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <input
                type="radio"
                name="payment-option"
                checked={paymentState.method === "netbanking"}
                onChange={() => handleSelectMethod("netbanking")}
                className="w-4 h-4 accent-[#F26522] cursor-pointer shrink-0"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-black text-[#052a51]">Net Banking</span>
                <span className="text-xs text-gray-500 font-medium">All major banks</span>
              </div>
            </div>

            {/* Expanded Net Banking Selector */}
            {paymentState.method === "netbanking" && (
              <div
                className="mt-4 pt-3.5 border-t border-[#F26522]/20 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold text-gray-700">Popular Banks:</p>

                {/* Popular Bank Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {POPULAR_BANKS.map((b) => {
                    const isSelected = paymentState.bankCode === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => handleBankSelect(b.code)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer ${
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

                {/* Full Bank Dropdown */}
                <div className="pt-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Or select another bank:
                  </label>
                  <div className="relative">
                    <select
                      value={paymentState.bankCode || ""}
                      onChange={(e) => handleBankSelect(e.target.value)}
                      className="w-full h-10 px-3.5 pr-8 rounded-xl border border-gray-300 focus:outline-none focus:border-[#F26522] text-xs font-medium bg-white appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose Bank --</option>
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

                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>You will be securely redirected to your bank&apos;s authorized portal.</span>
                </div>
              </div>
            )}
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
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <input
                type="radio"
                name="payment-option"
                checked={paymentState.method === "cod"}
                onChange={() => handleSelectMethod("cod")}
                className="w-4 h-4 accent-[#F26522] cursor-pointer shrink-0"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base font-black text-[#052a51]">
                  Cash on Delivery
                </span>
                <span className="text-xs text-gray-500 font-medium">Pay when your order arrives</span>
              </div>
            </div>

            {/* Expanded COD Details */}
            {paymentState.method === "cod" && (
              <div
                className="mt-4 pt-3.5 border-t border-[#F26522]/20 space-y-1.5 text-xs text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-semibold text-[#052a51]">
                  💵 Pay at your doorstep with cash or by scanning the driver&apos;s UPI QR code.
                </p>
                <p className="text-[11px] text-gray-500">
                  No online payment is required right now.
                </p>
              </div>
            )}
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
              disabled={isProcessing || (paymentState.method === "upi" && paymentState.upiApp === "qr" && qrStatus === "EXPIRED")}
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

        {/* Accurate Security Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500 pt-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>🔒 Secure payment processing</span>
        </div>
      </div>
    </div>
  );
}
