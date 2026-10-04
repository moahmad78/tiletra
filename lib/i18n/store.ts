import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_COOKIE,
} from "./config";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";

const translations: Record<SupportedLanguage, any> = {
  en,
  hi,
  kn,
};

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

interface I18nState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage, syncBackend?: boolean) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`));
    if (match && match[1] && SUPPORTED_LANGUAGES.some((l) => l.code === match[1])) {
      return match[1] as SupportedLanguage;
    }
  }
  return DEFAULT_LANGUAGE;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),

      setLanguage: async (newLang: SupportedLanguage, syncBackend = true) => {
        if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;

        // 1. Update local reactive state
        set({ language: newLang });

        // 2. Set document cookie for SSR/SEO middleware
        if (typeof document !== "undefined") {
          document.cookie = `${LANGUAGE_COOKIE}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
          document.documentElement.lang = newLang;
        }

        // 3. Sync with backend if user is authenticated
        if (syncBackend) {
          try {
            const { updateUserLanguageInDb } = await import("@/lib/actions/auth");
            await updateUserLanguageInDb(newLang);
          } catch (e) {
            // Non-critical, local state already set
          }
        }
      },

      t: (key: string, params?: Record<string, string | number>): string => {
        const currentLang = get().language || DEFAULT_LANGUAGE;
        let text = getNestedValue(translations[currentLang], key);

        // Fallback to English if translation is missing
        if (!text && currentLang !== DEFAULT_LANGUAGE) {
          text = getNestedValue(translations[DEFAULT_LANGUAGE], key);
        }

        // Final fallback to key itself
        if (!text) {
          text = key;
        }

        // Interpolate params (e.g. {{count}})
        if (params) {
          for (const [paramKey, paramVal] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(paramVal));
          }
        }

        return text;
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  const t = useI18nStore((s) => s.t);

  return {
    t,
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}
