"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Check,
  Lock,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Download,
  Share2,
  Clock,
  CheckCircle2,
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
  { code: "SBIN", name: "SBI", badge: "SBI" },
  { code: "HDFC", name: "HDFC Bank", badge: "HDFC" },
  { code: "ICIC", name: "ICICI Bank", badge: "ICICI" },
  { code: "UTIB", name: "Axis Bank", badge: "AXIS" },
  { code: "KKBK", name: "Kotak Bank", badge: "KOTAK" },
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
  orderId = "TL-" + Math.floor(100000 + Math.random() * 900000),
}: PaymentSectionProps) {
  const [customUpiInput, setCustomUpiInput] = useState(paymentState.upiId || "");
  const [cardNumber, setCardNumber] = useState(paymentState.cardNumber || "");
  const [cardExpiry, setCardExpiry] = useState(paymentState.cardExpiry || "");
  const [cardCvv, setCardCvv] = useState(paymentState.cardCvv || "");
  const [cardName, setCardName] = useState(paymentState.cardName || "");

  const [qrSecondsLeft, setQrSecondsLeft] = useState(15 * 60);

  const formattedTotal = "₹" + totalAmount.toLocaleString("en-IN");

  useEffect(() => {
    if (paymentState.method !== "upi" || paymentState.upiApp !== "qr") return;
    if (qrSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState.method, paymentState.upiApp, qrSecondsLeft]);

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectMethod = (method: PaymentMethodType) => {
    onPaymentStateChange({
      ...paymentState,
      method,
      upiApp: method === "upi" ? paymentState.upiApp || "gpay" : undefined,
    });
  };

  const handleUpiAppSelect = (app: "gpay" | "phonepe" | "paytm" | "other" | "qr") => {
    onPaymentStateChange({
      ...paymentState,
      method: "upi",
      upiApp: app,
    });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
    onPaymentStateChange({ ...paymentState, cardNumber: formatted });
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setCardExpiry(val);
    onPaymentStateChange({ ...paymentState, cardExpiry: val });
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(val);
    onPaymentStateChange({ ...paymentState, cardCvv: val });
  };

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardName(val);
    onPaymentStateChange({ ...paymentState, cardName: val });
  };

  const handleBankSelect = (code: string) => {
    onPaymentStateChange({
      ...paymentState,
      method: "netbanking",
      bankCode: code,
    });
  };

  const qrUpiPayload = `upi://pay?pa=intrihub@razorpay&pn=Tiletra%20Intrihub&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrUpiPayload
  )}&margin=8`;

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `intrihub-payment-${orderId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payment QR code downloaded!");
    } catch {
      toast.error("Failed to download QR image");
    }
  };

  const handleShareOrCopyQr = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(qrUpiPayload);
      toast.success("UPI payment address copied!");
    }
  };

  const getCardTypeBadge = () => {
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
      <div className="flex items-center gap-1 opacity-50">
        <VisaIcon />
        <MastercardIcon />
        <RuPayIcon />
      </div>
    );
  };

  const CATEGORIES: {
    id: PaymentMethodType;
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
      subtext: "All Indian Banks supported",
      icon: <Building2 size={18} />,
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      subtext: "Pay cash upon crate arrival",
      icon: <Banknote size={18} />,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#052a51] text-white flex items-center justify-center shadow-2xs">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#052a51]">Payment Options</h2>
            <p className="text-[11px] text-gray-500">Choose your preferred payment method</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <ShieldCheck size={14} />
          <span>100% Safe &amp; Secure</span>
        </div>
      </div>

      <div className="block md:hidden border-b border-gray-100 p-2 bg-gray-50/70 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const isSelected = paymentState.method === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectMethod(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#052a51] text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.icon}
                <span>{cat.title}</span>
                {cat.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-black uppercase ${
                      isSelected ? "bg-[#F26522] text-white" : "bg-orange-100 text-[#F26522]"
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[270px_1fr] min-h-[440px]">
        <div className="hidden md:flex flex-col border-r border-gray-100 bg-gray-50/60 p-2.5 space-y-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = paymentState.method === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectMethod(cat.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-white text-[#052a51] shadow-xs border border-gray-200/90"
                    : "text-gray-600 hover:bg-white/60"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#F26522]/10 text-[#F26522]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {cat.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs ${isSelected ? "font-black" : "font-bold"}`}>
                      {cat.title}
                    </p>
                    {cat.badge && (
                      <span className="text-[9px] px-1 rounded bg-[#F26522]/10 text-[#F26522] font-black uppercase">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                    {cat.subtext}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-1.5 h-6 rounded-full bg-[#F26522] self-center ml-auto shrink-0" />
                )}
              </button>
            );
          })}

          <div className="mt-auto p-3 bg-white rounded-2xl border border-gray-100 text-[11px] text-gray-500 space-y-1">
            <p className="flex items-center gap-1.5 font-bold text-[#052a51]">
              <Lock size={12} className="text-[#2F7A4F]" />
              Bank Grade Security
            </p>
            <p className="text-[10px] text-gray-400 leading-tight">
              Direct checkout with 256-bit encryption. No raw card storage.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-7 flex flex-col justify-between space-y-6">
          {paymentState.method === "upi" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                  Pay using Unified Payments Interface (UPI)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select your UPI app, enter a UPI ID, or scan the dynamic QR code
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
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
                ].map((app) => {
                  const isSelected = (paymentState.upiApp || "gpay") === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleUpiAppSelect(app.id as any)}
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

              {paymentState.upiApp === "other" && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <label className="block text-xs font-bold text-gray-700">
                    Enter Virtual Payment Address (UPI ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customUpiInput}
                      onChange={(e) => {
                        setCustomUpiInput(e.target.value);
                        onPaymentStateChange({
                          ...paymentState,
                          upiId: e.target.value,
                        });
                      }}
                      placeholder="e.g. mobile@okhdfcbank / yourname@paytm"
                      className="w-full h-12 pl-3.5 pr-20 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#2F7A4F] bg-green-50 px-2 py-0.5 rounded">
                      UPI
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    A payment request will be sent to your UPI app for instant one-click approval.
                  </p>
                </div>
              )}

              {paymentState.upiApp === "qr" && (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-gray-200/60 pb-3">
                    <span className="font-bold text-gray-600">Scan with any UPI App</span>
                    <span className="font-black text-[#F26522] flex items-center gap-1">
                      <Clock size={13} /> Expires in {formatMinutesSeconds(qrSecondsLeft)}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl inline-block border-2 border-[#052a51] shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImageUrl}
                      alt="UPI Payment QR"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download size={13} />
                      <span>Download QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareOrCopyQr}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Share2 size={13} />
                      <span>Copy UPI Intent</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Open Google Pay, PhonePe, Paytm, CRED or BHIM on your mobile and scan to complete payment.
                  </p>
                </div>
              )}

              {["gpay", "phonepe", "paytm"].includes(paymentState.upiApp || "") && (
                <div className="p-4 bg-orange-50/60 border border-[#F26522]/20 rounded-2xl text-xs text-gray-700 space-y-1.5">
                  <p className="font-bold text-[#052a51]">
                    Direct App Authorization ({paymentState.upiApp === "gpay" ? "Google Pay" : paymentState.upiApp === "phonepe" ? "PhonePe" : "Paytm"})
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    On mobile, tapping Pay will seamlessly open your UPI app. On desktop, a secure authorization request or QR will display for approval.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onPaySubmit}
                disabled={isProcessing}
                className="w-full min-h-[50px] bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isProcessing ? "Connecting to UPI..." : `Pay ${formattedTotal} with UPI`}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {paymentState.method === "card" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                    Credit / Debit / ATM Card
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Visa, Mastercard, RuPay, Maestro &amp; Diners accepted
                  </p>
                </div>
                <div>{getCardTypeBadge()}</div>
              </div>

              <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full h-12 pl-3.5 pr-20 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold tracking-wider text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getCardTypeBadge()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Valid Thru</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      maxLength={5}
                      placeholder="MM / YY"
                      className="w-full h-12 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>CVV / CVC</span>
                      <span className="text-[10px] text-gray-400 font-normal">3 digits on back</span>
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={handleCardCvvChange}
                      maxLength={4}
                      placeholder="•••"
                      className="w-full h-12 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={handleCardNameChange}
                    placeholder="Full name as printed on card"
                    className="w-full h-12 px-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={16} className="text-[#2F7A4F] shrink-0" />
                <span>
                  Your card details are tokenized securely via Razorpay PCI-DSS Level-1 Gateway.
                </span>
              </div>

              <button
                type="button"
                onClick={onPaySubmit}
                disabled={isProcessing}
                className="w-full min-h-[50px] bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Lock size={15} />
                <span>{isProcessing ? "Authorizing Card..." : `Pay ${formattedTotal}`}</span>
              </button>
            </div>
          )}

          {paymentState.method === "netbanking" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                  Internet Banking
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select your bank to authenticate through your bank&apos;s secure portal
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Popular Banks</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_BANKS.map((b) => {
                    const isSelected = paymentState.bankCode === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => handleBankSelect(b.code)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-[#052a51] bg-[#052a51] text-white shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                              isSelected ? "bg-white text-[#052a51]" : "bg-gray-100 text-[#052a51]"
                            }`}
                          >
                            {b.badge}
                          </span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All Banks Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Or Choose Other Indian Bank
                </label>
                <div className="relative">
                  <select
                    value={paymentState.bankCode || ""}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full h-12 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] appearance-none cursor-pointer"
                  >
                    <option value="">-- Select from 17+ Indian Banks --</option>
                    {ALL_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Redirect Notice */}
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  After clicking proceed, you will be securely redirected to your bank&apos;s net banking login page to authorize the transaction.
                </span>
              </div>

              {/* Pay Action CTA */}
              <button
                type="button"
                onClick={onPaySubmit}
                disabled={isProcessing}
                className="w-full min-h-[50px] bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isProcessing
                    ? "Redirecting to Bank..."
                    : `Proceed to ${paymentState.bankCode ? "Bank" : "Net Banking"} (${formattedTotal})`}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CATEGORY 4: CASH ON DELIVERY (COD)
          ══════════════════════════════════════════════════════════════ */}
          {paymentState.method === "cod" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                    Cash on Delivery
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay in cash when building materials arrive at your site
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Eligible
                </span>
              </div>

              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-950">
                      ₹0 Prepayment Required
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      You will pay the total amount of <strong>{formattedTotal}</strong> directly in cash to our Bangalore freight driver upon safe crate delivery.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200/60 space-y-1.5 text-xs text-emerald-900">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                    <span>Free breakage-proof wooden crate inspection at doorstep</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                    <span>Exact physical invoice with official GST seal included</span>
                  </p>
                </div>
              </div>

              {/* Pay Action CTA */}
              <button
                type="button"
                onClick={onPaySubmit}
                disabled={isProcessing}
                className="w-full min-h-[50px] bg-[#2F7A4F] hover:bg-[#25633f] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isProcessing ? "Placing Order..." : `Confirm Cash on Delivery Order (${formattedTotal})`}
                </span>
                <Check size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Footer Back Button */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-500 hover:text-[#052a51] font-bold transition-colors cursor-pointer py-1"
            >
              ← Change Delivery Address
            </button>
            <span className="text-gray-400 text-[11px]">
              Total Payable: <strong className="text-[#052a51] font-black">{formattedTotal}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
