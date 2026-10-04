import fs from "fs";
import path from "path";

type JsonObject = { [key: string]: any };

function getNestedEntries(obj: JsonObject, prefix = ""): Array<{ key: string; value: string }> {
  let entries: Array<{ key: string; value: string }> = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      entries = entries.concat(getNestedEntries(obj[key], fullPath));
    } else {
      entries.push({ key: fullPath, value: String(obj[key]) });
    }
  }
  return entries;
}

function extractPlaceholders(str: string): string[] {
  const matches = str.match(/{{\s*[\w\d_]+\s*}}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, "").trim()).sort();
}

function validateTranslations() {
  const localesDir = path.resolve(process.cwd(), "lib/i18n/locales");
  const enPath = path.join(localesDir, "en.json");
  const hiPath = path.join(localesDir, "hi.json");
  const knPath = path.join(localesDir, "kn.json");

  if (!fs.existsSync(enPath)) {
    console.error("❌ Base translation file en.json not found!");
    process.exit(1);
  }

  const enData: JsonObject = JSON.parse(fs.readFileSync(enPath, "utf-8"));
  const enEntries = getNestedEntries(enData);
  const enMap = new Map(enEntries.map((e) => [e.key, e.value]));
  const enKeys = new Set(enMap.keys());

  const targetLangs = [
    { code: "hi", name: "Hindi (हिन्दी)", path: hiPath },
    { code: "kn", name: "Kannada (ಕನ್ನಡ)", path: knPath },
  ];

  let hasError = false;

  console.log(`\n🌐 [i18n Deep Validation] Auditing ${enKeys.size} translation keys across all locales...\n`);

  for (const lang of targetLangs) {
    if (!fs.existsSync(lang.path)) {
      console.error(`❌ Translation file missing for ${lang.name}: ${lang.path}`);
      hasError = true;
      continue;
    }

    const langData: JsonObject = JSON.parse(fs.readFileSync(lang.path, "utf-8"));
    const langEntries = getNestedEntries(langData);
    const langMap = new Map(langEntries.map((e) => [e.key, e.value]));
    const langKeys = new Set(langMap.keys());

    // 1. Missing keys check
    const missingKeys: string[] = [];
    for (const key of enKeys) {
      if (!langKeys.has(key)) {
        missingKeys.push(key);
      }
    }

    // 2. Extra orphan keys check
    const orphanKeys: string[] = [];
    for (const key of langKeys) {
      if (!enKeys.has(key)) {
        orphanKeys.push(key);
      }
    }

    // 3. Empty or un-translated values check
    const emptyKeys: string[] = [];
    const placeholderMismatches: string[] = [];

    for (const [key, val] of langMap.entries()) {
      if (!val || val.trim() === "") {
        emptyKeys.push(key);
      }

      // Check placeholder parity
      const enVal = enMap.get(key);
      if (enVal) {
        const enPlaceholders = extractPlaceholders(enVal);
        const langPlaceholders = extractPlaceholders(val);
        if (JSON.stringify(enPlaceholders) !== JSON.stringify(langPlaceholders)) {
          placeholderMismatches.push(
            `${key} (Expected: [${enPlaceholders.join(", ")}], Found: [${langPlaceholders.join(", ")}])`
          );
        }
      }
    }

    if (missingKeys.length > 0) {
      console.error(`❌ ${lang.name} is missing ${missingKeys.length} keys:`);
      missingKeys.slice(0, 10).forEach((k) => console.error(`   - ${k}`));
      if (missingKeys.length > 10) console.error(`   ... and ${missingKeys.length - 10} more`);
      hasError = true;
    }

    if (orphanKeys.length > 0) {
      console.warn(`⚠️  ${lang.name} has ${orphanKeys.length} extra keys not present in en.json:`);
      orphanKeys.slice(0, 5).forEach((k) => console.warn(`   + ${k}`));
    }

    if (emptyKeys.length > 0) {
      console.error(`❌ ${lang.name} has ${emptyKeys.length} empty values:`);
      emptyKeys.slice(0, 5).forEach((k) => console.error(`   - ${k}`));
      hasError = true;
    }

    if (placeholderMismatches.length > 0) {
      console.error(`❌ ${lang.name} has placeholder mismatches:`);
      placeholderMismatches.forEach((m) => console.error(`   - ${m}`));
      hasError = true;
    }

    if (missingKeys.length === 0 && emptyKeys.length === 0 && placeholderMismatches.length === 0) {
      console.log(`✅ ${lang.name}: 100% key parity & placeholder match (${langKeys.size} keys verified).`);
    }
  }

  if (hasError) {
    console.error("\n❌ i18n validation failed! Please fix the errors above.\n");
    process.exit(1);
  } else {
    console.log("\n🎉 All translation files passed validation with 100% parity!\n");
  }
}

validateTranslations();
