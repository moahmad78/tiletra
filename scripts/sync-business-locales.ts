import fs from "fs";
import path from "path";

const mobileLocalesDir = path.resolve(__dirname, "../intrihub-mobile/locales");
const businessLocalesDir = path.resolve(__dirname, "../intrihub-business/locales");

const enBusiness = JSON.parse(
  fs.readFileSync(path.join(businessLocalesDir, "en.json"), "utf8")
);

const languages = [
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "or", name: "Odia" },
];

async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encoded}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const trans = data[0].map((c: any) => c?.[0] || "").join("");
        if (trans.trim()) return trans.trim();
      }
    }
  } catch {}
  return text;
}

async function translateObj(obj: any, mobileObj: any, targetLang: string): Promise<any> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // 1. Try mobile equivalent
      if (mobileObj && typeof mobileObj[key] === "string") {
        result[key] = mobileObj[key];
      } else {
        result[key] = await translateText(value, targetLang);
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = await translateObj(
        value,
        mobileObj ? mobileObj[key] : undefined,
        targetLang
      );
    }
  }
  return result;
}

async function run() {
  console.log("Syncing all 12 business locales...");
  for (const lang of languages) {
    const mobileFile = path.join(mobileLocalesDir, `${lang.code}.json`);
    const existingMobile = fs.existsSync(mobileFile)
      ? JSON.parse(fs.readFileSync(mobileFile, "utf8"))
      : null;

    const businessFile = path.join(businessLocalesDir, `${lang.code}.json`);
    let existingBusiness = fs.existsSync(businessFile)
      ? JSON.parse(fs.readFileSync(businessFile, "utf8"))
      : null;

    if (existingBusiness && (lang.code === "hi" || lang.code === "kn")) {
      console.log(`✔ Preserving existing curated ${lang.code}.json`);
      continue;
    }

    console.log(`Generating ${lang.name} (${lang.code})...`);
    const translated = await translateObj(enBusiness, existingMobile, lang.code);
    fs.writeFileSync(businessFile, JSON.stringify(translated, null, 2), "utf8");
    console.log(`✔ Wrote ${lang.code}.json`);
  }
  console.log("All business locales generated successfully!");
}

run().catch(console.error);
