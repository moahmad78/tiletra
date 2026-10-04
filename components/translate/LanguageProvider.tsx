"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { LanguageOption, LanguageContextValue } from "@/lib/translate/types";
import { PINNED_LANGUAGE_CODES, resolveLanguageNames } from "@/lib/translate/constants";
import {
  applyLanguage,
  restoreOriginalEnglish,
  getSavedLanguagePreference,
} from "@/lib/translate/engine";

const LanguageContext = createContext<LanguageContextValue | null>(null);

const DEFAULT_ENGLISH: LanguageOption = {
  code: "en",
  name: "English",
  nativeName: "English (Original)",
  isPinned: true,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [languages, setLanguages] = useState<LanguageOption[]>([DEFAULT_ENGLISH]);

  // Read saved language on mount
  useEffect(() => {
    const saved = getSavedLanguagePreference();
    if (saved) {
      setCurrentLang(saved);
    }
  }, []);

  // Poll for Google Translate combo and dynamically build the full 100+ language list (FR-2)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 35; // ~10.5 seconds

    const pollCombo = () => {
      const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");

      if (combo && combo.options && combo.options.length > 5) {
        const rawOptions: { code: string; text: string }[] = [];

        for (let i = 0; i < combo.options.length; i++) {
          const opt = combo.options[i];
          const val = opt.value?.trim();
          if (val && val !== "en") {
            rawOptions.push({ code: val, text: opt.text?.trim() });
          }
        }

        // Build LanguageOption list with native + English names
        const builtList: LanguageOption[] = [DEFAULT_ENGLISH];

        // 1. Pinned languages in exact order specified in FR-2
        for (const pinnedCode of PINNED_LANGUAGE_CODES) {
          if (pinnedCode === "en") continue;
          const found = rawOptions.find((o) => o.code.toLowerCase() === pinnedCode.toLowerCase());
          const names = resolveLanguageNames(pinnedCode, found?.text);
          builtList.push({
            code: pinnedCode,
            name: names.name,
            nativeName: names.nativeName,
            isPinned: true,
          });
        }

        // 2. All other world languages sorted alphabetically by English name
        const otherOptions = rawOptions.filter(
          (o) => !PINNED_LANGUAGE_CODES.some((p) => p.toLowerCase() === o.code.toLowerCase())
        );

        const otherBuilt: LanguageOption[] = otherOptions.map((o) => {
          const names = resolveLanguageNames(o.code, o.text);
          return {
            code: o.code,
            name: names.name,
            nativeName: names.nativeName,
            isPinned: false,
          };
        });

        otherBuilt.sort((a, b) => a.name.localeCompare(b.name));

        const finalList = [...builtList, ...otherBuilt];
        setLanguages(finalList);
        setIsReady(true);

        // Auto-apply saved language if not English (FR-5)
        const saved = getSavedLanguagePreference();
        if (saved && saved !== "en") {
          applyLanguage(saved);
        }
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(pollCombo, 300);
      } else {
        // If combo took longer, provide pinned languages as fallback so UI remains functional
        const fallbackList: LanguageOption[] = PINNED_LANGUAGE_CODES.map((code) => {
          const names = resolveLanguageNames(code);
          return {
            code,
            name: names.name,
            nativeName: names.nativeName,
            isPinned: true,
          };
        });
        setLanguages(fallbackList);
        setIsReady(true);
      }
    };

    pollCombo();
  }, []);

  // Switch Language (FR-3: Zero reload)
  const setLanguage = useCallback(async (langCode: string) => {
    setIsTranslating(true);
    setCurrentLang(langCode);

    try {
      await applyLanguage(langCode);
    } finally {
      setTimeout(() => {
        setIsTranslating(false);
      }, 500);
    }
  }, []);

  // Restore Original English (FR-4: Zero reload)
  const restoreOriginal = useCallback(async () => {
    setIsTranslating(true);
    setCurrentLang("en");

    try {
      await restoreOriginalEnglish();
    } finally {
      setTimeout(() => {
        setIsTranslating(false);
      }, 400);
    }
  }, []);

  const currentLanguageInfo = useMemo(() => {
    return languages.find((l) => l.code === currentLang) || languages[0] || DEFAULT_ENGLISH;
  }, [languages, currentLang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      currentLang,
      currentLanguageInfo,
      isReady,
      isTranslating,
      languages,
      setLanguage,
      restoreOriginal,
    }),
    [currentLang, currentLanguageInfo, isReady, isTranslating, languages, setLanguage, restoreOriginal]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a <LanguageProvider>");
  }
  return context;
}
