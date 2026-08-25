"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Clock, Download, Share2, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface UpiQrFormProps {
  totalAmount: number;
  orderId: string;
  onPaymentSuccess: (paymentId: string) => void;
}

export default function UpiQrForm({
  totalAmount,
  orderId,
  onPaymentSuccess,
}: UpiQrFormProps) {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isPolling, setIsPolling] = useState(true);

  // Payload for UPI Intent / QR Code
  const upiPayload = `upi://pay?pa=intrihub@razorpay&pn=Intrihub%20Building%20Materials&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiPayload
  )}&margin=10`;

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Status polling
  useEffect(() => {
    if (secondsLeft <= 0 || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout-v2/status?orderId=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID" || data.paymentStatus === "Paid") {
            setIsPolling(false);
            toast.success("Payment received successfully!");
            onPaymentSuccess(data.razorpayPaymentId || `pay_qr_${Date.now()}`);
          }
        }
      } catch {
        // silent polling catch
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [secondsLeft, isPolling, orderId, onPaymentSuccess]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `intrihub-qr-${orderId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payment QR downloaded!");
    } catch {
      toast.error("Failed to download QR image");
    }
  };

  const handleShareQr = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiPayload);
      toast.success("UPI Intent link copied to clipboard!");
    }
  };

  return (
    <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-gray-200/80 pb-3">
        <span className="font-bold text-gray-700 flex items-center gap-1.5">
          <QrCode size={16} className="text-[#F26522]" />
          Scan & Pay with any UPI App
        </span>
        <span
          className={`font-black flex items-center gap-1 px-2.5 py-0.5 rounded-md ${
            secondsLeft > 120
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
          }`}
        >
          <Clock size={13} />
          {secondsLeft > 0 ? `Expires in ${formatTimer(secondsLeft)}` : "QR Expired"}
        </span>
      </div>

      <div className="relative inline-block bg-white p-3.5 rounded-2xl border-2 border-[#052a51] shadow-xs">
        {secondsLeft > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrImageUrl}
            alt="Dynamic UPI QR Code"
            className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-lg"
          />
        ) : (
          <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-rose-600">QR Code Expired</p>
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(15 * 60);
                setIsPolling(true);
                toast.info("Generated new QR session");
              }}
              className="px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} />
              <span>Regenerate QR</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={secondsLeft <= 0}
          className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Download size={13} />
          <span>Download QR</span>
        </button>
        <button
          type="button"
          onClick={handleShareQr}
          disabled={secondsLeft <= 0}
          className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Share2 size={13} />
          <span>Copy UPI Link</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 pt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Waiting for payment confirmation from your UPI app...</span>
      </div>
    </div>
  );
}
