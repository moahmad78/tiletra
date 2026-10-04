import { LanguageOption } from "./types";

/**
 * Pinned languages priority order per PRD Section 6 (FR-2):
 * English (original) at the top, then Hindi, Kannada, Tamil, Telugu,
 * Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu.
 */
export const PINNED_LANGUAGE_CODES: readonly string[] = [
  "en",
  "hi",
  "kn",
  "ta",
  "te",
  "ml",
  "mr",
  "bn",
  "gu",
  "pa",
  "ur",
];

/**
 * Fallback static map of native language names in case Intl.DisplayNames is not supported.
 */
export const NATIVE_LANGUAGE_NAMES: Record<string, { name: string; nativeName: string }> = {
  en: { name: "English", nativeName: "English (Original)" },
  hi: { name: "Hindi", nativeName: "हिन्दी" },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ" },
  ta: { name: "Tamil", nativeName: "தமிழ்" },
  te: { name: "Telugu", nativeName: "తెలుగు" },
  ml: { name: "Malayalam", nativeName: "മലയാളം" },
  mr: { name: "Marathi", nativeName: "मराठी" },
  bn: { name: "Bengali", nativeName: "বাংলা" },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી" },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  ur: { name: "Urdu", nativeName: "اردو" },
  as: { name: "Assamese", nativeName: "অসমীয়া" },
  or: { name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  sa: { name: "Sanskrit", nativeName: "संस्कृतम्" },
  ar: { name: "Arabic", nativeName: "العربية" },
  es: { name: "Spanish", nativeName: "Español" },
  fr: { name: "French", nativeName: "Français" },
  de: { name: "German", nativeName: "Deutsch" },
  zh: { name: "Chinese (Simplified)", nativeName: "中文 (简体)" },
  "zh-CN": { name: "Chinese (Simplified)", nativeName: "中文 (简体)" },
  "zh-TW": { name: "Chinese (Traditional)", nativeName: "中文 (繁體)" },
  ja: { name: "Japanese", nativeName: "日本語" },
  ko: { name: "Korean", nativeName: "한국어" },
  ru: { name: "Russian", nativeName: "Русский" },
  pt: { name: "Portuguese", nativeName: "Português" },
  it: { name: "Italian", nativeName: "Italiano" },
  tr: { name: "Turkish", nativeName: "Türkçe" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt" },
  th: { name: "Thai", nativeName: "ไทย" },
  id: { name: "Indonesian", nativeName: "Bahasa Indonesia" },
  ms: { name: "Malay", nativeName: "Bahasa Melayu" },
  fa: { name: "Persian", nativeName: "فارسی" },
  ne: { name: "Nepali", nativeName: "नेपाली" },
  si: { name: "Sinhala", nativeName: "සිංහල" },
  my: { name: "Burmese", nativeName: "မြန်မာ" },
  sw: { name: "Swahili", nativeName: "Kiswahili" },
  nl: { name: "Dutch", nativeName: "Nederlands" },
  pl: { name: "Polish", nativeName: "Polski" },
  sv: { name: "Swedish", nativeName: "Svenska" },
  el: { name: "Greek", nativeName: "Ελληνικά" },
  he: { name: "Hebrew", nativeName: "עברית" },
};

/**
 * Resolve display name and native name for any language code using standard Intl API.
 */
export function resolveLanguageNames(code: string, fallbackText?: string): { name: string; nativeName: string } {
  const normalizedCode = code.toLowerCase().trim();

  if (NATIVE_LANGUAGE_NAMES[normalizedCode]) {
    return NATIVE_LANGUAGE_NAMES[normalizedCode];
  }

  let englishName = fallbackText || normalizedCode;
  let nativeName = fallbackText || normalizedCode;

  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined") {
      const enDisplay = new Intl.DisplayNames(["en"], { type: "language" });
      const resolvedEn = enDisplay.of(normalizedCode);
      if (resolvedEn) englishName = resolvedEn;

      const nativeDisplay = new Intl.DisplayNames([normalizedCode], { type: "language" });
      const resolvedNative = nativeDisplay.of(normalizedCode);
      if (resolvedNative) nativeName = resolvedNative;
    }
  } catch {
    // Fallback if code format isn't recognized by Intl
  }

  // Capitalize first letter of native name if Latin
  if (/^[a-z]/.test(nativeName)) {
    nativeName = nativeName.charAt(0).toUpperCase() + nativeName.slice(1);
  }
  if (/^[a-z]/.test(englishName)) {
    englishName = englishName.charAt(0).toUpperCase() + englishName.slice(1);
  }

  return { name: englishName, nativeName };
}
