"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Smartphone, Sparkles, Share, PlusSquare, CheckCircle2 } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Register Service Worker for PWA
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);
    setIsIos(isIosDevice && isSafari);

    // 4. Check dismissal cooldown (dismiss for 4 days)
    const dismissedAt = localStorage.getItem("intrihub_pwa_dismissed_at");
    if (dismissedAt) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 4) {
        return;
      }
    }

    // 5. Capture native beforeinstallprompt event (Android, Chrome, Edge, Windows)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Reveal prompt after 3.5s for seamless user onboarding
      setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If on iOS and not dismissed, show prompt after 4s
    if (isIosDevice && isSafari) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback hint
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem("intrihub_pwa_dismissed_at", Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <>
      {/* ── Main PWA Install Floating Banner / Sheet ── */}
      <div className="fixed bottom-[68px] md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-br from-[#052a51] via-[#04203d] to-[#021529] text-white p-4 sm:p-4.5 rounded-3xl shadow-2xl border border-white/15 relative overflow-hidden backdrop-blur-md">
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F26522]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss app install prompt"
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shrink-0 shadow-md border border-white/20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="Intrihub"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F26522] rounded text-white shadow-2xs">
                  Fast App
                </span>
                <span className="text-[10px] text-white/70 font-semibold">★ 4.9 (10k+ users)</span>
              </div>
              <h4 className="text-sm font-black text-white leading-snug">
                Install Intrihub App
              </h4>
              <p className="text-[11px] text-white/75 leading-tight mt-0.5">
                Faster shopping, instant order updates & 1-tap checkout on your phone.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Not Now
            </button>

            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} className="shrink-0" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── iOS Safari Step-by-Step Guide Modal ── */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-[#052a51] shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center mx-auto mb-2">
                <Smartphone size={24} />
              </div>
              <h3 className="text-base font-black">Install Intrihub on iPhone / iPad</h3>
              <p className="text-xs text-gray-500 mt-1">Follow these 2 quick steps to add the app to your Home Screen:</p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                <span className="flex-1">
                  Tap the <strong className="text-[#052a51]">Share</strong> button <Share size={14} className="inline mx-1 text-blue-600" /> at the bottom of Safari.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                <span className="flex-1">
                  Scroll down and tap <strong className="text-[#052a51]">Add to Home Screen</strong> <PlusSquare size={14} className="inline mx-1 text-gray-800" />.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-3 bg-[#052a51] text-white text-xs font-black rounded-xl hover:bg-[#041f3d] transition-all cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
