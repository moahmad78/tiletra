"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles, Smartphone, ExternalLink, DownloadCloud } from "lucide-react";

const ANDROID_PACKAGE_NAME = "com.intrihub.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}&referrer=utm_source%3Dwebsite`;
const ANDROID_INTENT_URL = `intent://open#Intent;scheme=intrihub;package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(
  PLAY_STORE_URL
)};end`;

const STORAGE_KEY_DISMISSED_UNTIL = "intrihub_app_prompt_dismissed_until";
const SESSION_KEY_PAGE_VIEWS = "intrihub_web_session_views";

export default function AppInstallPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if current route should suppress the popup
  const isExcludedRoute = useCallback((path: string | null) => {
    if (!path) return false;
    const lower = path.toLowerCase();
    return (
      lower.startsWith("/admin") ||
      lower.startsWith("/vendor") ||
      lower.startsWith("/cpo") ||
      lower.startsWith("/help") ||
      lower.includes("/checkout/payment") ||
      lower.includes("/checkout-v2/payment")
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Immediately clean up legacy local storage keys
    try {
      localStorage.removeItem("intrihub_app_download_dismissed");
      localStorage.removeItem("intrihub_pwa_dismissed");
      localStorage.removeItem("intrihub_app_installed");
    } catch {}

    // 2. Strict Platform Check: ONLY mobile Android browser
    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(ua) && !/windows|macintosh/i.test(ua);
    if (!isAndroid) {
      // Never show on iPhone, iPad, macOS, Windows or desktop
      return;
    }

    // 3. Not inside our app's WebView or third-party webviews
    const isWebView =
      Boolean((window as any).ReactNativeWebView) ||
      /;\s*wv|fbav|instagram|line\/|micromessenger/i.test(ua) ||
      (/android.*version\/[\d.]+.*chrome\/[\d.]+/i.test(ua) && !/mobile safari/i.test(ua)) ||
      ua.includes("intrihub");
    if (isWebView) {
      return;
    }

    // 4. Not an installed PWA (standalone or fullscreen display mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    if (isStandalone) {
      return;
    }

    // 5. Route exclusion check
    if (isExcludedRoute(window.location.pathname)) {
      return;
    }

    // 6. 7-Day Dismissal Check
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED_UNTIL);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }
    } catch {}

    // 7. Track page views in sessionStorage (never first paint)
    let currentViews = 1;
    try {
      currentViews = parseInt(sessionStorage.getItem(SESSION_KEY_PAGE_VIEWS) || "0", 10) + 1;
      sessionStorage.setItem(SESSION_KEY_PAGE_VIEWS, String(currentViews));
    } catch {}

    // 8. Check StoreSettings killswitch & getInstalledRelatedApps
    let cancelled = false;

    async function evaluateAndSchedule() {
      // Fetch dynamic store killswitch
      try {
        const res = await fetch("/api/mobile/app-install-prompt-status");
        if (res.ok) {
          const data = await res.json();
          if (data?.enabled === false) {
            return;
          }
        }
      } catch {}

      if (cancelled) return;

      // Installed check via navigator.getInstalledRelatedApps (Chrome on Android)
      let appDetectedInstalled = false;
      if ("getInstalledRelatedApps" in navigator) {
        try {
          const related = await (navigator as any).getInstalledRelatedApps();
          if (Array.isArray(related)) {
            const hasApp = related.some(
              (app: any) =>
                app.id === ANDROID_PACKAGE_NAME ||
                app.platform === "play" ||
                (app.url && app.url.includes(ANDROID_PACKAGE_NAME))
            );
            if (hasApp) {
              appDetectedInstalled = true;
              setIsInstalled(true);
            }
          }
        } catch {}
      }

      if (cancelled) return;

      // Never show on first paint!
      // Delay: 3.5s on 1st page view, 1.2s on 2nd+ page view
      const delayMs = currentViews >= 2 ? 1200 : 3500;
      const timer = setTimeout(() => {
        if (!cancelled && !isExcludedRoute(window.location.pathname)) {
          setVisible(true);
        }
      }, delayMs);

      return () => clearTimeout(timer);
    }

    evaluateAndSchedule();

    return () => {
      cancelled = true;
    };
  }, [isExcludedRoute, pathname]);

  const handleDismiss = () => {
    setVisible(false);
    // Dismiss for 7 days
    try {
      const sevenDaysLater = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_DISMISSED_UNTIL, String(sevenDaysLater));
    } catch {}
  };

  const handleAction = () => {
    try {
      // Primary: Android intent URI opens the app if installed, or falls back to Google Play Store
      window.location.href = ANDROID_INTENT_URL;
    } catch {
      window.location.href = PLAY_STORE_URL;
    }
  };

  if (!visible || isExcludedRoute(pathname)) {
    return null;
  }

  return (
    <aside
      aria-label="Install IntriHub App"
      className="fixed bottom-4 left-3 right-3 z-50 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
    >
      <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-[#052A51] via-[#04203D] to-[#021529] p-4 text-white shadow-2xl border border-white/20 backdrop-blur-md relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#F26522]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close app install prompt"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        <div className="flex items-start gap-3.5 pr-7">
          {/* App Icon */}
          <div className="w-13 h-13 rounded-2xl bg-white p-1 shrink-0 shadow-md border border-white/25 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="IntriHub App"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F26522] rounded text-white shadow-2xs flex items-center gap-1">
                <Sparkles size={10} /> Google Play
              </span>
              <span className="text-[11px] text-amber-300 font-bold">★ 4.9</span>
              <span className="text-[10px] text-white/60 font-medium">(10k+ Orders)</span>
            </div>
            <h3 className="text-sm font-black text-white leading-tight">
              {isInstalled ? "Open IntriHub on Android" : "Experience IntriHub App"}
            </h3>
            <p className="text-[11px] text-white/75 leading-snug mt-0.5 line-clamp-2">
              Faster orders, live truck tracking &amp; wholesale factory prices directly on your phone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-3.5 pt-2.5 border-t border-white/10">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Not now
          </button>

          <button
            type="button"
            onClick={handleAction}
            className="flex-1 py-2.5 px-4 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isInstalled ? (
              <>
                <ExternalLink size={14} className="shrink-0" />
                <span>Open in App</span>
              </>
            ) : (
              <>
                <DownloadCloud size={14} className="shrink-0" />
                <span>Install on Play Store</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
