"use client";

import { SupportedLanguage } from "./config";

/**
 * Sets the active Google Translate language using googtrans cookies and DOM event dispatch.
 * @param lang "en" | "hi" | "kn"
 */
export function setGoogleTranslateLanguage(lang: SupportedLanguage) {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const rootDomain = domainParts.length > 1 ? "." + domainParts.slice(-2).join(".") : hostname;

  // 1. Persist in local storage & intrihub_lang cookie for user preference
  try {
    localStorage.setItem("intrihub_lang", lang);
    document.cookie = `intrihub_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (err) {
    console.error("Failed to save language preference:", err);
  }

  // 2. Clear or set Google Translate 'googtrans' cookies across all domain scopes
  if (lang === "en") {
    // Revert to original English
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname}; path=/;`;
    if (rootDomain !== hostname) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${rootDomain}; path=/;`;
    }

    const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (combo) {
      combo.value = "";
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // A clean reload is required for Google Translate to restore original English DOM nodes
    setTimeout(() => {
      window.location.reload();
    }, 120);
    return;
  }

  // Non-English (Hindi or Kannada)
  const cookieVal = `/en/${lang}`;
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; domain=${hostname}; path=/;`;
  if (rootDomain !== hostname) {
    document.cookie = `googtrans=${cookieVal}; domain=${rootDomain}; path=/;`;
  }

  // 3. Trigger Google Translate combo dropdown in DOM
  const triggerCombo = (): boolean => {
    const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (!combo) return false;

    combo.value = lang;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    combo.dispatchEvent(new Event("input", { bubbles: true }));

    try {
      const evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", true, true);
      combo.dispatchEvent(evt);
    } catch {}

    return true;
  };

  const triggered = triggerCombo();

  // If combo was triggered, verify if translation took effect within 250ms. If not, auto-reload cleanly!
  if (triggered) {
    setTimeout(() => {
      const isTranslated =
        document.documentElement.classList.contains("translated-ltr") ||
        document.documentElement.classList.contains("translated-rtl");
      if (!isTranslated) {
        window.location.reload();
      }
    }, 250);
  } else {
    // If widget combo wasn't mounted in DOM yet, reload with newly set cookie
    setTimeout(() => {
      window.location.reload();
    }, 120);
  }
}

/**
 * Returns the currently active language according to googtrans cookie or localStorage
 */
export function getActiveGoogleLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";

  try {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (match && match[1]) {
      const parts = decodeURIComponent(match[1]).split("/");
      const targetLang = parts[parts.length - 1];
      if (targetLang === "hi" || targetLang === "kn") {
        return targetLang;
      }
    }
  } catch {}

  try {
    const stored = localStorage.getItem("intrihub_lang");
    if (stored === "hi" || stored === "kn") {
      return stored;
    }
  } catch {}

  return "en";
}
