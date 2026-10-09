"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const redirectedRef = useRef(false);

  const handleRedirect = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    try {
      router.replace("/");
    } catch {
      window.location.replace("/");
    }
  }, [router]);

  useEffect(() => {
    // 3-second auto-redirect countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleRedirect]);

  return (
    <>
      {/* Strict noindex tag for 404 route SEO compliance */}
      <head>
        <title>URL galat hai | IntriHub</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      {/* Fullscreen Dim Backdrop with Centered Modal */}
      <div
        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wrong-url-title"
      >
        {/* Popup Card (Mobile responsive, max-width ~340px, padding 16px on small screens) */}
        <div className="w-full max-w-[340px] bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-100 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Error / Warning Icon */}
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-red-50 text-red-600 flex items-center justify-center ring-8 ring-red-50/60 shadow-xs">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          {/* Heading in Red / Error Colour */}
          <h1
            id="wrong-url-title"
            className="text-xl sm:text-2xl font-black text-red-600 tracking-tight"
          >
            URL galat hai
          </h1>

          {/* Description Text */}
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Ye page nahi mila. Aapko home page par le ja rahe hain...
          </p>

          {/* Visual Countdown Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Redirecting in {countdown}s</span>
          </div>

          {/* Immediate Action Button in Primary Brand Colour */}
          <button
            type="button"
            onClick={handleRedirect}
            className="mt-5 w-full py-3 px-4 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Home par jaayein</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
