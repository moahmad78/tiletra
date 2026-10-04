export interface LanguageOption {
  code: string;
  name: string;        // e.g. "Hindi" or "French"
  nativeName: string;  // e.g. "हिन्दी" or "Français"
  isPinned?: boolean;
}

export interface LanguageContextValue {
  currentLang: string;
  currentLanguageInfo: LanguageOption;
  isReady: boolean;
  isTranslating: boolean;
  languages: LanguageOption[];
  setLanguage: (langCode: string) => void;
  restoreOriginal: () => void;
}
