import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import kn from "../../locales/kn.json";
import ta from "../../locales/ta.json";
import te from "../../locales/te.json";
import ml from "../../locales/ml.json";
import mr from "../../locales/mr.json";
import bn from "../../locales/bn.json";
import gu from "../../locales/gu.json";
import pa from "../../locales/pa.json";
import ur from "../../locales/ur.json";
import or from "../../locales/or.json";

export type SupportedLanguage =
  | "en"
  | "hi"
  | "kn"
  | "ta"
  | "te"
  | "ml"
  | "mr"
  | "bn"
  | "gu"
  | "pa"
  | "ur"
  | "or";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", isRTL: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", isRTL: false },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", isRTL: false },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", isRTL: false },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", isRTL: false },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", isRTL: false },
  { code: "mr", name: "Marathi", nativeName: "मराठी", isRTL: false },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", isRTL: false },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", isRTL: false },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", isRTL: false },
  { code: "ur", name: "Urdu", nativeName: "اردو", isRTL: true },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", isRTL: false },
];

export const STORAGE_KEY = "intrihub_mobile_language";
export const HAS_SELECTED_KEY = "intrihub_mobile_has_selected_lang";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  ta: { translation: ta },
  te: { translation: te },
  ml: { translation: ml },
  mr: { translation: mr },
  bn: { translation: bn },
  gu: { translation: gu },
  pa: { translation: pa },
  ur: { translation: ur },
  or: { translation: or },
};

// Detect device fallback locale
const deviceLocales = Localization.getLocales();
const rawDeviceCode = deviceLocales[0]?.languageCode || "en";
const initialLanguage = (
  SUPPORTED_LANGUAGES.some((l) => l.code === rawDeviceCode)
    ? rawDeviceCode
    : "en"
) as SupportedLanguage;

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: {
    escapeValue: false, // React Native handles text escaping
  },
  react: {
    useSuspense: false, // Avoid suspense flashing on native renders
  },
});

/**
 * Handle RTL layout direction for languages like Urdu
 */
export function handleRtlDirection(langCode: SupportedLanguage): boolean {
  const isRtl = langCode === "ur";
  if (I18nManager.isRTL !== isRtl) {
    try {
      I18nManager.allowRTL(isRtl);
      I18nManager.forceRTL(isRtl);
    } catch {}
  }
  return isRtl;
}

export default i18n;
