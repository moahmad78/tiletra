import fs from "fs";
import path from "path";

type JsonObject = { [key: string]: any };

function getNestedKeys(obj: JsonObject, prefix = ""): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getNestedKeys(obj[key], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function validateTranslations() {
  const localesDir = path.resolve(__dirname, "../lib/i18n/locales");
  const enPath = path.join(localesDir, "en.json");
  const hiPath = path.join(localesDir, "hi.json");
  const knPath = path.join(localesDir, "kn.json");

  if (!fs.existsSync(enPath)) {
    console.error("❌ Base translation file en.json not found!");
    process.exit(1);
  }

  const enData: JsonObject = JSON.parse(fs.readFileSync(enPath, "utf-8"));
  const enKeys = new Set(getNestedKeys(enData));

  const targetLangs = [
    { code: "hi", name: "Hindi (हिन्दी)", path: hiPath },
    { code: "kn", name: "Kannada (ಕನ್ನಡ)", path: knPath },
  ];

  let hasError = false;

  console.log(`\n🌐 [i18n Parity Test] Auditing ${enKeys.size} translation keys across all locales...\n`);

  for (const lang of targetLangs) {
    if (!fs.existsSync(lang.path)) {
      console.error(`❌ Translation file missing for ${lang.name}: ${lang.path}`);
      hasError = true;
      continue;
    }

    const langData: JsonObject = JSON.parse(fs.readFileSync(lang.path, "utf-8"));
    const langKeys = new Set(getNestedKeys(langData));

    const missingKeys: string[] = [];
    for (const key of enKeys) {
      if (!langKeys.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      console.error(`❌ ${lang.name} is missing ${missingKeys.length} keys:`);
      missingKeys.forEach((k) => console.error(`   - ${k}`));
      hasError = true;
    } else {
      console.log(`✅ ${lang.name}: 100% key parity (${langKeys.size}/${enKeys.size} keys present)`);
    }
  }

  if (hasError) {
    console.error("\n❌ i18n Validation FAILED! Ensure all languages have complete key parity.\n");
    process.exit(1);
  } else {
    console.log("\n🎉 All translation files have 100% key parity!\n");
  }
}

validateTranslations();
