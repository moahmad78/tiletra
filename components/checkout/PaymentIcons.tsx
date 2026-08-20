"use client";

import React from "react";

// 1. UPI Official Vector Badge
export function UpiIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="Unified Payments Interface (UPI)"
    >
      <svg viewBox="0 0 70 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* UPI text and chevron */}
        <path d="M7 6h4.5v7.5c0 2-1 3.5-3.5 3.5s-3.5-1.5-3.5-3.5V6H7v7.5c0 .8.4 1.5 1.2 1.5.8 0 1.3-.7 1.3-1.5V6z" fill="#000" />
        <path d="M14.5 6h4.5c2 0 3.5 1.2 3.5 3.2s-1.5 3.3-3.5 3.3H17v4.5h-2.5V6zm2.5 4.5h2c.8 0 1.2-.4 1.2-1.2s-.4-1.2-1.2-1.2h-2v2.4z" fill="#000" />
        <path d="M25 6h2.5v11H25V6z" fill="#000" />
        {/* UPI Triangles */}
        <polygon points="34,6 40,12 34,18" fill="#097939" />
        <polygon points="41,6 47,12 41,18" fill="#ED752E" />
      </svg>
    </div>
  );
}

// 2. Google Pay (GPay) Badge
export function GPayIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-2 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="Google Pay"
    >
      <svg viewBox="0 0 48 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* G icon */}
        <path d="M12.5 12.2c0-.5 0-.9-.1-1.3H7.5v2.5h2.8c-.1.7-.5 1.3-1.1 1.7v1.4h1.8c1.1-1 1.5-2.6 1.5-4.3z" fill="#4285F4" />
        <path d="M7.5 17.3c1.6 0 3-.5 4-1.4l-1.8-1.4c-.5.4-1.2.6-2.2.6-1.7 0-3.1-1.1-3.6-2.7H2v1.5c1 2.1 3.1 3.4 5.5 3.4z" fill="#34A853" />
        <path d="M3.9 12.4c-.1-.4-.2-.9-.2-1.4 0-.5.1-1 .2-1.4V8.1H2C1.5 9.1 1.2 10.5 1.2 12s.3 2.9.8 3.9l1.9-1.5z" fill="#FBBC05" />
        <path d="M7.5 6.7c.9 0 1.7.3 2.3.9l1.7-1.7C10.5 5 9.1 4.5 7.5 4.5c-2.4 0-4.5 1.4-5.5 3.5l1.9 1.5c.5-1.6 1.9-2.8 3.6-2.8z" fill="#EA4335" />
        {/* Pay Text */}
        <text x="16" y="16" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#5F6368">Pay</text>
      </svg>
    </div>
  );
}

// 3. PhonePe Badge
export function PhonePeIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-[#5f259f] rounded-md border border-[#5f259f] shadow-2xs ${className}`}
      title="PhonePe"
    >
      <svg viewBox="0 0 46 22" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* PhonePe White Pe mark */}
        <rect x="2" y="3" width="16" height="16" rx="8" fill="#fff" />
        <path d="M12.5 14.5l-2-2.5h-1v2.5H8V7.5h3.2c1.4 0 2.3.8 2.3 2.1 0 1-.6 1.7-1.5 2l2 2.9h-1.5zm-3-4h1.5c.6 0 1-.3 1-.8s-.4-.8-1-.8H9.5v1.6z" fill="#5f259f" />
        <text x="21" y="15" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="#fff">PhonePe</text>
      </svg>
    </div>
  );
}

// 4. Paytm Badge
export function PaytmIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="Paytm"
    >
      <svg viewBox="0 0 48 20" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="14" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="900" fill="#002E6E">Pay</text>
        <text x="22" y="14" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="900" fill="#00B9F5">tm</text>
      </svg>
    </div>
  );
}

// 5. Visa Badge
export function VisaIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="Visa Card"
    >
      <svg viewBox="0 0 38 20" className="h-4.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="15" fontFamily="Impact, Arial Black, sans-serif" fontStyle="italic" fontSize="14" fontWeight="bold" fill="#1A1F71">
          VISA
        </text>
      </svg>
    </div>
  );
}

// 6. Mastercard Badge
export function MastercardIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="Mastercard"
    >
      <svg viewBox="0 0 32 20" className="h-4.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="10" r="7.5" fill="#EB001B" />
        <circle cx="21" cy="10" r="7.5" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

// 7. RuPay Badge
export function RuPayIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-1.5 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs ${className}`}
      title="RuPay Debit & Credit Cards"
    >
      <svg viewBox="0 0 52 20" className="h-4.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="14" fontFamily="Arial, sans-serif" fontStyle="italic" fontSize="11" fontWeight="900" fill="#0C2340">
          RuPay
        </text>
        <polygon points="40,5 45,10 40,15" fill="#00A859" />
        <polygon points="45,5 50,10 45,15" fill="#F37021" />
      </svg>
    </div>
  );
}

// 8. Net Banking Badge
export function NetBankingIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md border border-slate-200 shadow-2xs text-[10px] font-bold ${className}`}
      title="Net Banking (SBI, HDFC, ICICI, Axis & 50+ Banks)"
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
        <path d="M10 2L2 6v2h16V6L10 2zm-6 7v6h2V9H4zm5 0v6h2V9H9zm5 0v6h2V9h-2zM2 17v2h16v-2H2z" />
      </svg>
      <span>NetBanking</span>
    </div>
  );
}

// 9. COD / Cash Badge
export function CodCashBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold text-xs shadow-2xs ${className}`}
      title="Cash on Delivery Available"
    >
      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
        ₹
      </div>
      <span className="font-extrabold">Pay Cash on Delivery</span>
    </div>
  );
}

// Responsive Payment Methods Icons Row
export function OnlinePaymentIconsRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <UpiIcon />
      <GPayIcon />
      <PhonePeIcon />
      <PaytmIcon />
      <VisaIcon />
      <MastercardIcon />
      <RuPayIcon />
      <NetBankingIcon />
    </div>
  );
}
