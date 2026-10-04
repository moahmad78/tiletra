import { cookies } from "next/headers";
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
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

export async function getServerTranslation() {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const lang = (SUPPORTED_LANGUAGES.some((l) => l.code === rawLang)
    ? rawLang
    : DEFAULT_LANGUAGE) as SupportedLanguage;

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(translations[lang], key);

    // Fallback to English if translation is missing
    if (!text && lang !== DEFAULT_LANGUAGE) {
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
  };

  return {
    lang,
    t,
    languages: SUPPORTED_LANGUAGES,
  };
}
