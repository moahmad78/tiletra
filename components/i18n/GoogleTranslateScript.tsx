"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { getActiveGoogleLanguage } from "@/lib/i18n/google-translate";

// ── 1. Global React DOM Crash Prevention Monkeypatch ──
// Google Translate wraps text nodes in <font> tags. When React attempts to
// remove or insert nodes during re-render, it throws "NotFoundError: Failed to execute 'removeChild' on 'Node'".
// This monkeypatch safely ignores the mismatch if the parentNode was modified by an external script.
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[i18n] Google Translate DOM mismatch intercepted: removeChild");
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[i18n] Google Translate DOM mismatch intercepted: insertBefore");
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function GoogleTranslateScript() {
  const pathname = usePathname();

  useEffect(() => {
    // 2. Define the global initialization callback required by element.js
    window.googleTranslateElementInit = function () {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,kn",
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );
      }
    };
  }, []);

  // 3. On SPA page change in Next.js, ensure translation persists if non-English
  useEffect(() => {
    const activeLang = getActiveGoogleLanguage();
    if (activeLang !== "en") {
      const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (combo && combo.value !== activeLang) {
        combo.value = activeLang;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, [pathname]);

  // 4. Suppress Google Translate from setting body.style.top = '40px' or creating top/bottom blank space
  useEffect(() => {
    const resetBodyShift = () => {
      if (typeof document === "undefined") return;
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      if (document.body.style.position === "relative") {
        document.body.style.position = "";
      }
    };

    resetBodyShift();
    const observer = new MutationObserver(resetBodyShift);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        style={{
          display: "none",
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <Script
        id="google-translate-script"
        strategy="afterInteractive"
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      />
    </>
  );
}
