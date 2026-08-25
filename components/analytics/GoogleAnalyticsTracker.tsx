"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalyticsTracker({
  measurementId,
}: {
  measurementId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gaId =
    measurementId ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    "G-EGVGF17EPS";

  useEffect(() => {
    if (!pathname || typeof window === "undefined" || !window.gtag) {
      return;
    }

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Send page_view event on client-side route navigation
    window.gtag("config", gaId, {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}
