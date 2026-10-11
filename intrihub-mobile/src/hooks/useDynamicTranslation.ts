import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18nStore } from "../store/i18nStore";
import { apiClient } from "../api/client";

// In-memory cache for 0ms instantaneous lookups
const memoryCache: Record<string, Record<string, string>> = {};

/**
 * Loads cached translations from persistent storage into memory
 */
async function getCachedMap(lang: string): Promise<Record<string, string>> {
  if (memoryCache[lang]) return memoryCache[lang];

  try {
    const raw = await AsyncStorage.getItem(`intrihub_dyn_trans_${lang}`);
    if (raw) {
      memoryCache[lang] = JSON.parse(raw);
      return memoryCache[lang];
    }
  } catch {}

  memoryCache[lang] = {};
  return memoryCache[lang];
}

/**
 * Persists translated entries into storage
 */
async function persistTranslations(lang: string, newEntries: Record<string, string>) {
  if (!memoryCache[lang]) memoryCache[lang] = {};
  Object.assign(memoryCache[lang], newEntries);

  try {
    await AsyncStorage.setItem(
      `intrihub_dyn_trans_${lang}`,
      JSON.stringify(memoryCache[lang])
    );
  } catch {}
}

/**
 * Translate dynamic backend strings with fast fallback to original text while loading,
 * and persistent device-level caching for full offline capability.
 */
export function useTranslatedText(sourceText?: string | null): string {
  const currentLang = useI18nStore((s) => s.language);
  const [translated, setTranslated] = useState<string>(sourceText || "");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sourceText || typeof sourceText !== "string" || !sourceText.trim()) {
      setTranslated(sourceText || "");
      return;
    }

    // 1. English is original source text
    if (currentLang === "en") {
      setTranslated(sourceText);
      return;
    }

    const clean = sourceText.trim();

    // 2. Immediate check in memory cache
    if (memoryCache[currentLang]?.[clean]) {
      setTranslated(memoryCache[currentLang][clean]);
      return;
    }

    // 3. Fast fallback: keep showing original text while checking storage or fetching
    setTranslated(sourceText);

    let isCurrent = true;

    async function loadOrFetch() {
      // Check device storage
      const cache = await getCachedMap(currentLang);
      if (cache[clean]) {
        if (isCurrent && isMountedRef.current) {
          setTranslated(cache[clean]);
        }
        return;
      }

      // Fetch from backend dynamic translation endpoint
      try {
        const res = await apiClient.post<{
          success: boolean;
          translations: Record<string, string>;
        }>(
          "/api/translate/dynamic",
          {
            texts: [clean],
            targetLang: currentLang,
          },
          {
            headers: {
              "x-intrihub-app": "mobile",
              "x-intrihub-client-verification": "intrihub-expo-app-v1",
            },
          }
        );

        if (res.data?.success && res.data.translations?.[clean]) {
          const trans = res.data.translations[clean];
          await persistTranslations(currentLang, { [clean]: trans });
          if (isCurrent && isMountedRef.current) {
            setTranslated(trans);
          }
        }
      } catch (err) {
        // Fallback remains clean original text
      }
    }

    loadOrFetch();

    return () => {
      isCurrent = false;
    };
  }, [sourceText, currentLang]);

  return translated;
}

/**
 * Batch translation hook for multiple dynamic items
 */
export function useTranslatedTexts(texts: string[]): Record<string, string> {
  const currentLang = useI18nStore((s) => s.language);
  const [translations, setTranslations] = useState<Record<string, string>>(() => {
    const initMap: Record<string, string> = {};
    for (const t of texts) initMap[t] = t;
    return initMap;
  });

  useEffect(() => {
    if (!texts || texts.length === 0 || currentLang === "en") {
      const map: Record<string, string> = {};
      for (const t of texts) map[t] = t;
      setTranslations(map);
      return;
    }

    let isCurrent = true;

    async function resolveAll() {
      const cache = await getCachedMap(currentLang);
      const resultMap: Record<string, string> = {};
      const missing: string[] = [];

      for (const t of texts) {
        if (!t) continue;
        const clean = t.trim();
        if (cache[clean]) {
          resultMap[t] = cache[clean];
        } else {
          resultMap[t] = t; // fallback
          missing.push(clean);
        }
      }

      setTranslations(resultMap);

      if (missing.length > 0) {
        try {
          const res = await apiClient.post<{
            success: boolean;
            translations: Record<string, string>;
          }>(
            "/api/translate/dynamic",
            {
              texts: missing,
              targetLang: currentLang,
            },
            {
              headers: {
                "x-intrihub-app": "mobile",
                "x-intrihub-client-verification": "intrihub-expo-app-v1",
              },
            }
          );

          if (res.data?.success && res.data.translations) {
            await persistTranslations(currentLang, res.data.translations);
            if (isCurrent) {
              setTranslations((prev) => ({
                ...prev,
                ...res.data.translations,
              }));
            }
          }
        } catch {}
      }
    }

    resolveAll();

    return () => {
      isCurrent = false;
    };
  }, [texts.join("||"), currentLang]);

  return translations;
}
