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
 * Mounts off-screen, accessible-neutral container for Google Website Translator.
 * Ensures strict compliance with WCAG 4.1.2 and axe-core aria-hidden-focus rule.
 */
export default function GoogleTranslateBootstrap() {
  useEffect(() => {
    const neutralizeFocus = () => {
      const container = document.getElementById("google_translate_element");
      if (!container) return;
      const focusables = container.querySelectorAll<HTMLElement>(
        "select, a, button, input, [tabindex]"
      );
      focusables.forEach((el) => {
        el.tabIndex = -1;
        el.setAttribute("tabindex", "-1");
        el.setAttribute("aria-hidden", "true");
      });
    };

    neutralizeFocus();

    // Observe any dynamic additions into the Google Translate element
    const container = document.getElementById("google_translate_element");
    let observer: MutationObserver | null = null;
    if (container && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        neutralizeFocus();
      });
      observer.observe(container, { childList: true, subtree: true });
    }

    const initTranslate = () => {
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
      neutralizeFocus();
    };

    initTranslate();
    const t1 = setTimeout(initTranslate, 600);
    const t2 = setTimeout(initTranslate, 1800);
    const t3 = setTimeout(neutralizeFocus, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (observer) {
        observer.disconnect();
      }
    };
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
      tabIndex={-1}
      inert
      className="notranslate"
    />
  );
}
