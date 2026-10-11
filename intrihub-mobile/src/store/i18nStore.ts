import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, {
  SupportedLanguage,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  STORAGE_KEY,
  HAS_SELECTED_KEY,
  handleRtlDirection,
} from "../i18n";

export type { SupportedLanguage, LanguageInfo };
export { SUPPORTED_LANGUAGES };

interface I18nState {
  language: SupportedLanguage;
  isReady: boolean;
  isRTL: boolean;
  hasSelectedLanguage: boolean;
  initLanguage: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage, syncBackend?: boolean) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  language: (i18n.language as SupportedLanguage) || "en",
  isReady: false,
  isRTL: i18n.language === "ur",
  hasSelectedLanguage: false,

  initLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const hasSelected = await AsyncStorage.getItem(HAS_SELECTED_KEY);

      const validCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
      const resolved = (
        stored && validCodes.includes(stored as SupportedLanguage)
      )
        ? (stored as SupportedLanguage)
        : ((i18n.language as SupportedLanguage) || "en");

      const isRTL = handleRtlDirection(resolved);
      await i18n.changeLanguage(resolved);

      set({
        language: resolved,
        isRTL,
        isReady: true,
        hasSelectedLanguage: hasSelected === "true",
      });
    } catch {
      const isRTL = handleRtlDirection("en");
      set({ language: "en", isRTL, isReady: true, hasSelectedLanguage: false });
    }
  },

  setLanguage: async (newLang: SupportedLanguage, syncBackend = true) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;

    const isRTL = handleRtlDirection(newLang);
    try {
      await i18n.changeLanguage(newLang);
    } catch (err) {
      console.warn("[i18n] Error changing language in i18next:", err);
    }

    set({ language: newLang, isRTL, hasSelectedLanguage: true });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
      await AsyncStorage.setItem(HAS_SELECTED_KEY, "true");
    } catch {}

    if (syncBackend) {
      try {
        const { default: axios } = await import("axios");
        await axios.post("https://www.intrihub.com/api/user/language", { language: newLang });
      } catch {}
    }
  },

  t: (key: string, params?: Record<string, string | number>): string => {
    const lang = get().language || (i18n.language as SupportedLanguage) || "en";
    return (i18n.t(key, { ...params, lng: lang } as any) as unknown as string) || key;
  },
}));

/**
 * Universal Mobile useTranslation hook
 * Triggers instant re-render on language toggle across the entire application
 */
export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  const isRTL = useI18nStore((s) => s.isRTL);
  const isReady = useI18nStore((s) => s.isReady);
  const hasSelectedLanguage = useI18nStore((s) => s.hasSelectedLanguage);

  // Return reactive t function bound to current language
  const t = (key: string, params?: Record<string, string | number>): string => {
    return (i18n.t(key, { ...params, lng: language } as any) as unknown as string) || key;
  };

  return {
    t,
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    isRTL,
    isReady,
    hasSelectedLanguage,
  };
}
