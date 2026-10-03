import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import kn from "../../locales/kn.json";

export type SupportedLanguage = "en" | "hi" | "kn";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

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
  isReady: boolean;
  hasSelectedLanguage: boolean;
  initLanguage: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage, syncBackend?: boolean) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "intrihub_mobile_language";
const HAS_SELECTED_KEY = "intrihub_mobile_has_selected_lang";

export const useI18nStore = create<I18nState>((set, get) => ({
  language: "en",
  isReady: false,
  hasSelectedLanguage: false,

  initLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const hasSelected = await AsyncStorage.getItem(HAS_SELECTED_KEY);

      const resolved = (stored === "hi" || stored === "kn" || stored === "en") ? stored : "en";
      set({
        language: resolved,
        isReady: true,
        hasSelectedLanguage: hasSelected === "true",
      });
    } catch {
      set({ language: "en", isReady: true, hasSelectedLanguage: false });
    }
  },

  setLanguage: async (newLang: SupportedLanguage, syncBackend = true) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;

    set({ language: newLang, hasSelectedLanguage: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
      await AsyncStorage.setItem(HAS_SELECTED_KEY, "true");
    } catch {}

    if (syncBackend) {
      try {
        // Optional backend language update via mobile API
        const { default: axios } = await import("axios");
        await axios.post("https://www.intrihub.com/api/user/language", { language: newLang });
      } catch {}
    }
  },

  t: (key: string, params?: Record<string, string | number>): string => {
    const currentLang = get().language || "en";
    let text = getNestedValue(translations[currentLang], key);

    if (!text && currentLang !== "en") {
      text = getNestedValue(translations.en, key);
    }

    if (!text) {
      text = key;
    }

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(paramVal));
      }
    }

    return text;
  },
}));

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  const t = useI18nStore((s) => s.t);
  const hasSelectedLanguage = useI18nStore((s) => s.hasSelectedLanguage);

  return {
    t,
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    hasSelectedLanguage,
  };
}
