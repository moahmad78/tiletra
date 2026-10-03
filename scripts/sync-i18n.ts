import fs from "fs";
import path from "path";

function syncLocales() {
  const sourceDir = path.resolve(__dirname, "../lib/i18n/locales");
  const targets = [
    path.resolve(__dirname, "../intrihub-mobile/locales"),
    path.resolve(__dirname, "../intrihub-business/locales"),
  ];

  const files = ["en.json", "hi.json", "kn.json"];

  for (const targetDir of targets) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const file of files) {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`[SYNCED] ${file} -> ${path.relative(path.resolve(__dirname, ".."), destFile)}`);
      }
    }
  }

  console.log("✨ All mobile and business locales synced successfully.");
}

syncLocales();
