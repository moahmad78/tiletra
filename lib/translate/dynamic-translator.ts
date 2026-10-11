import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Supported Indian languages mapping
export const SUPPORTED_TARGET_LANGUAGES = new Set([
  "hi", // Hindi
  "kn", // Kannada
  "ta", // Tamil
  "te", // Telugu
  "ml", // Malayalam
  "mr", // Marathi
  "bn", // Bengali
  "gu", // Gujarati
  "pa", // Punjabi
  "ur", // Urdu
  "or", // Odia
  "en", // English
]);

const MAX_TEXT_LENGTH = 1200; // characters
const MAX_BATCH_SIZE = 50; // items per batch

/**
 * Computes deterministic SHA-256 hash for source text + language
 */
export function computeTranslationHash(text: string, targetLang: string): string {
  const normalized = text.trim();
  return crypto
    .createHash("sha256")
    .update(`${normalized}:${targetLang.toLowerCase().trim()}`)
    .digest("hex");
}

/**
 * Translates a single text using Google Cloud Translation API (if key is configured),
 * or Google Translate v2 endpoint fallback.
 * Strictly executes on server side. Secrets never leak.
 */
async function callGoogleTranslateApi(
  text: string,
  targetLang: string
): Promise<string> {
  const apiKey =
    process.env.GOOGLE_TRANSLATION_API_KEY ||
    process.env.GOOGLE_TRANSLATE_API_KEY;

  if (apiKey) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: "text",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data?.data?.translations?.[0]?.translatedText;
        if (translated) return translated;
      }
    } catch (e) {
      console.warn("[DynamicTranslator] Cloud API call failed, attempting fallback:", e);
    }
  }

  // Robust fallback via Google Translate public endpoint
  try {
    const encoded = encodeURIComponent(text);
    const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encoded}`;

    const res = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0]
          .map((chunk: any) => (chunk && chunk[0] ? chunk[0] : ""))
          .join("");
        if (fullTranslation.trim()) {
          return fullTranslation;
        }
      }
    }
  } catch (err) {
    console.error("[DynamicTranslator] Fallback translation failed:", err);
  }

  return text; // Return original text on complete failure
}

export interface DynamicTranslationResult {
  translations: Record<string, string>;
  cachedCount: number;
  freshCount: number;
}

/**
 * Main Dynamic Translation Service with Database Caching
 */
export async function translateDynamicTexts(
  texts: string[],
  targetLang: string
): Promise<DynamicTranslationResult> {
  const normalizedLang = targetLang.toLowerCase().trim();

  // If target language is English or invalid, return original text directly
  if (normalizedLang === "en" || !SUPPORTED_TARGET_LANGUAGES.has(normalizedLang)) {
    const directMap: Record<string, string> = {};
    for (const t of texts) {
      directMap[t] = t;
    }
    return { translations: directMap, cachedCount: texts.length, freshCount: 0 };
  }

  // Filter and limit inputs
  const limitedTexts = texts.slice(0, MAX_BATCH_SIZE);
  const textHashMap = new Map<string, { original: string; hash: string }>();

  for (const rawText of limitedTexts) {
    if (!rawText || typeof rawText !== "string") continue;
    const cleanText = rawText.trim().slice(0, MAX_TEXT_LENGTH);
    if (!cleanText) continue;
    const hash = computeTranslationHash(cleanText, normalizedLang);
    textHashMap.set(cleanText, { original: rawText, hash });
  }

  if (textHashMap.size === 0) {
    return { translations: {}, cachedCount: 0, freshCount: 0 };
  }

  const allHashes = Array.from(textHashMap.values()).map((v) => v.hash);

  // 1. Check Database Cache
  const cachedEntries = await prisma.translationCache.findMany({
    where: {
      hash: { in: allHashes },
      targetLang: normalizedLang,
    },
    select: {
      hash: true,
      translatedText: true,
      sourceText: true,
    },
  });

  const cacheByHash = new Map<string, string>();
  for (const c of cachedEntries) {
    cacheByHash.set(c.hash, c.translatedText);
  }

  const result: Record<string, string> = {};
  const missingTranslations: { cleanText: string; hash: string }[] = [];

  for (const [cleanText, info] of textHashMap.entries()) {
    if (cacheByHash.has(info.hash)) {
      result[info.original] = cacheByHash.get(info.hash)!;
    } else {
      missingTranslations.push({ cleanText, hash: info.hash });
    }
  }

  const cachedCount = cachedEntries.length;
  let freshCount = 0;

  // 2. Translate Missing Texts via Google API
  if (missingTranslations.length > 0) {
    const toInsert: {
      hash: string;
      sourceText: string;
      targetLang: string;
      translatedText: string;
    }[] = [];

    // Translate items concurrently in small batches of 5
    const BATCH_CONCURRENCY = 5;
    for (let i = 0; i < missingTranslations.length; i += BATCH_CONCURRENCY) {
      const slice = missingTranslations.slice(i, i + BATCH_CONCURRENCY);
      const translatedBatch = await Promise.all(
        slice.map(async (item) => {
          const translated = await callGoogleTranslateApi(item.cleanText, normalizedLang);
          return { ...item, translated };
        })
      );

      for (const t of translatedBatch) {
        result[t.cleanText] = t.translated;
        // Also map raw original if different
        const original = textHashMap.get(t.cleanText)?.original;
        if (original) {
          result[original] = t.translated;
        }

        toInsert.push({
          hash: t.hash,
          sourceText: t.cleanText,
          targetLang: normalizedLang,
          translatedText: t.translated,
        });
      }
    }

    freshCount = toInsert.length;

    // 3. Batch Cache in Postgres
    if (toInsert.length > 0) {
      try {
        await prisma.translationCache.createMany({
          data: toInsert,
          skipDuplicates: true,
        });
      } catch (err) {
        console.warn("[DynamicTranslator] Failed to save translation cache to DB:", err);
      }
    }
  }

  return {
    translations: result,
    cachedCount,
    freshCount,
  };
}
