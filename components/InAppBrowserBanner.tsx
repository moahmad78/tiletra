"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, X, AlertCircle, Compass } from "lucide-react";
import { detectInAppBrowser, openInSystemBrowser, type InAppBrowserInfo } from "@/lib/in-app-browser";
import { toast } from "sonner";

interface InAppBrowserBannerProps {
  context?: "checkout" | "general";
}

export default function InAppBrowserBanner({ context = "general" }: InAppBrowserBannerProps) {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const info = detectInAppBrowser();
    if (info.isInApp) {
      setBrowserInfo(info);
    }
  }, []);

  if (!browserInfo?.isInApp || isDismissed) {
    return null;
  }

  const handleOpenBrowser = () => {
    const launched = openInSystemBrowser();
    if (!launched && browserInfo.isIOS) {
      setShowIosGuide(true);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success("Link copied! Paste it in Chrome or Safari to continue.");
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error("Could not copy link. Please manually copy the URL.");
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-300/40 text-amber-950 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left icon & description */}
        <div className="flex items-start gap-2.5 flex-1">
          <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">
              {context === "checkout" ? (
                <>For fast UPI (GPay, PhonePe) & card payments, open in your browser</>
              ) : (
                <>You are viewing this inside {browserInfo.appName || "an in-app browser"}</>
              )}
            </p>
            <p className="text-gray-700 text-[11px] sm:text-xs mt-0.5">
              In-app browsers (like {browserInfo.appName || "WhatsApp/Instagram"}) restrict UPI app redirects. Opening in Chrome or Safari ensures 100% smooth checkout.
            </p>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={handleOpenBrowser}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#052a51] hover:bg-[#083b70] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Browser</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-700 border border-gray-300 font-semibold text-xs transition-colors"
            title="Copy Page Link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-gray-500 hover:text-gray-800 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal / Tooltip Helper */}
      {showIosGuide && browserInfo.isIOS && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-300/30 flex items-center justify-between text-xs text-amber-900 bg-amber-100/60 p-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              On iPhone: Tap the <strong>three dots (⋯)</strong> or <strong>Share</strong> button at the top-right of your screen, then choose <strong>"Open in Safari"</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="text-[11px] font-bold text-amber-800 underline ml-2 shrink-0"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
