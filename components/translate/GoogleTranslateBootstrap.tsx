"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

/**
 * GoogleTranslateBootstrap (FR-1)
 * Mounts off-screen container for Google Website Translator.
 */
export default function GoogleTranslateBootstrap() {
  useEffect(() => {
    // If google translate script loaded before element was mounted, trigger init
    if (
      typeof window !== "undefined" &&
      window.google &&
      window.google.translate &&
      window.google.translate.TranslateElement &&
      !document.querySelector("select.goog-te-combo")
    ) {
      try {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element"
        );
      } catch {}
    }
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        opacity: 0.01,
        pointerEvents: "none",
        zIndex: -9999,
        display: "block",
        visibility: "visible",
      }}
      aria-hidden="true"
      className="notranslate"
    />
  );
}
