"use client";

import Script from "next/script";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

/**
 * GoogleTranslateBootstrap (FR-1)
 * Injects Google Website Translator engine once in the root layout.
 * Omission of `includedLanguages` ensures all 100+ world languages are supported.
 */
export default function GoogleTranslateBootstrap() {
  return (
    <>
      {/* 
        Container kept off-screen with visibility: visible & display: block 
        so Google Translate's internal engine does not abort change events.
      */}
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

      {/* Initialize callback before script loads */}
      <Script
        id="google-translate-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.googleTranslateElementInit = function() {
              if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            };
          `,
        }}
      />

      {/* Load Google Website Translator element script */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        id="google-translate-script"
      />
    </>
  );
}
