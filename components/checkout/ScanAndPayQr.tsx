"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { UpiIcon, GPayIcon, PhonePeIcon, PaytmIcon } from "./PaymentIcons";

interface ScanAndPayQrProps {
  totalAmount: number; // in INR
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onPaymentSuccess: (paymentId: string, qrId: string) => void;
  onCancel?: () => void;
}

export default function ScanAndPayQr({
  totalAmount,
  customerName,
  customerPhone,
  customerEmail,
  onPaymentSuccess,
  onCancel,
}: ScanAndPayQrProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    qrId: string;
    paymentUrl: string;
    qrDataUrl: string;
    expireBy: number;
    amount: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins in seconds
  const [isCopied, setIsCopied] = useState(false);
  const [paymentDetected, setPaymentDetected] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateQr = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentDetected(false);

      const res = await fetch("/api/create-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // in paise
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          customerName: customerName || "Customer",
          customerPhone: customerPhone || "9876543210",
          customerEmail: customerEmail || "customer@intrihub.com",
          notes: {
            customerName: customerName || "Customer",
            customerPhone: customerPhone || "",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate QR code");
      }

      setQrData(data);
      const remaining = Math.max(0, data.expireBy - Math.floor(Date.now() / 1000));
      setTimeLeft(remaining > 0 ? remaining : 900);
    } catch (err: any) {
      console.error("QR Generation Error:", err);
      setError(err?.message || "Could not generate QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [totalAmount, customerName, customerPhone]);

  // Initial QR generation
  useEffect(() => {
    generateQr();
  }, [generateQr]);

  // Expiry Countdown Timer
  useEffect(() => {
    if (!qrData || timeLeft <= 0 || paymentDetected) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, timeLeft, paymentDetected]);

  // Status Polling
  useEffect(() => {
    if (!qrData?.qrId || timeLeft <= 0 || paymentDetected) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/check-qr-status?qrId=${qrData.qrId}`);
        const data = await res.json();

        if (data.isPaid && !paymentDetected) {
          setPaymentDetected(true);
          toast.success("⚡ Payment received! Confirming your order...");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          onPaymentSuccess(data.paymentId || `pay_${Date.now()}`, qrData.qrId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [qrData?.qrId, timeLeft, paymentDetected, onPaymentSuccess]);

  // Format Timer MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Download QR
  const handleDownloadQr = () => {
    if (!qrData?.qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrData.qrDataUrl;
    link.download = `Intrihub-Pay-QR-${Math.round(totalAmount)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  // Share QR or Payment Link
  const handleShare = async () => {
    if (!qrData?.paymentUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pay for Intrihub Order",
          text: `Scan or click this link to pay ₹${totalAmount.toLocaleString("en-IN")} for your Intrihub tiles order:`,
          url: qrData.paymentUrl,
        });
        toast.success("Payment link shared!");
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: Copy link
      await navigator.clipboard.writeText(qrData.paymentUrl);
      setIsCopied(true);
      toast.success("Payment link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#052a51] text-white flex items-center justify-center">
            <QrCode size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#052a51]">Scan & Pay via UPI QR</h4>
            <p className="text-[11px] text-gray-500">Scan with GPay, PhonePe, Paytm or any UPI App</p>
          </div>
        </div>

        {timeLeft > 0 && !loading && !error && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold text-xs">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700">Expires in</span>
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-xs font-bold text-[#052a51]">Generating secure UPI QR code...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <p className="text-xs text-red-600 font-bold">{error}</p>
          <button
            type="button"
            onClick={generateQr}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a3e74] cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      ) : timeLeft <= 0 ? (
        <div className="py-8 text-center space-y-3 bg-white rounded-2xl border border-dashed border-red-200 p-6">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h5 className="text-sm font-black text-[#052a51]">QR Code Expired</h5>
          <p className="text-xs text-gray-500">The 15-minute checkout window has elapsed for this QR.</p>
          <button
            type="button"
            onClick={generateQr}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Generate New QR</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* QR Container */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
            {/* Amount Callout */}
            <div className="mb-3 text-center">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">Exact Amount to Pay</span>
              <span className="text-xl sm:text-2xl font-black text-[#052a51]">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            {/* QR Image Frame */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
              {paymentDetected ? (
                <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] flex flex-col items-center justify-center bg-emerald-50 rounded-xl gap-2 text-emerald-700 animate-in fade-in">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                  <span className="text-xs font-black">Payment Confirmed!</span>
                </div>
              ) : (
                qrData?.qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrData.qrDataUrl}
                    alt="Scan UPI QR Code"
                    width={220}
                    height={220}
                    className="w-[190px] h-[190px] sm:w-[220px] sm:h-[220px] object-contain rounded-lg"
                  />
                )
              )}
            </div>

            {/* Listening Pulse Indicator */}
            {!paymentDetected && (
              <div className="mt-3.5 flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Listening for real-time payment confirmation...</span>
              </div>
            )}

            {/* Supported UPI Apps */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Accepted On:</span>
              <UpiIcon className="h-5" />
              <GPayIcon className="h-5" />
              <PhonePeIcon className="h-5" />
              <PaytmIcon className="h-5" />
            </div>
          </div>

          {/* Action Buttons: Download & Share */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[#052a51] text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Download size={14} className="text-[#F26522]" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[#052a51] text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="text-[#052a51]" />
                  <span>Share QR / Link</span>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/70 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
            <ShieldCheck size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Once you complete payment in your UPI app, this page will automatically redirect to your confirmed order receipt.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
