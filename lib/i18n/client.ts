"use client";

import { useI18nStore, useTranslation as useStoreTranslation } from "./store";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./config";
import en from "./locales/en.json";

export { useI18nStore, SUPPORTED_LANGUAGES, type SupportedLanguage };

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Client-side React hook for website translations.
 * Since website uses Google Website Translator (which translates the entire DOM from English),
 * this hook provides clean English base strings (with fallback and parameter interpolation)
 * so that Google Translate translates 100% of the page cleanly without double-translation conflict.
 */
export function useTranslation() {
  const store = useStoreTranslation();

  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let fallback: string | undefined;
    let actualParams: Record<string, string | number> | undefined;

    if (typeof fallbackOrParams === "string") {
      fallback = fallbackOrParams;
      actualParams = params;
    } else if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
      actualParams = fallbackOrParams;
    }

    // Always fetch base English string for Web DOM
    let text = getNestedValue(en, key) || fallback || key;

    if (actualParams) {
      for (const [pKey, pVal] of Object.entries(actualParams)) {
        text = text.replace(new RegExp(`{{\\s*${pKey}\\s*}}`, "g"), String(pVal));
      }
    }

    return text;
  };

  return {
    ...store,
    t,
  };
}
