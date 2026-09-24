#!/usr/bin/env node
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import sharp from "sharp";

const args = process.argv.slice(2);
const writeMode = args.includes("--write");
const targetDir = args.find((a) => !a.startsWith("--")) || ".";

const CLOUDINARY_REGEX = /https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(?:[a-z]{1,3}_[^\/]*\/)*(?:v[0-9]+\/)?intrihub\/([a-zA-Z0-9_\-\.\/]+)/g;

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".vscode",
  "play-store-screenshots",
]);

const VALID_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".html",
  ".css",
  ".md",
]);

const publicImagesDir = path.resolve(process.cwd(), "public", "images");

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(url, { headers: { "User-Agent": "IntriHub-Migrate/1.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, buffer);
        resolve(buffer);
      });
      res.on("error", reject);
    });
    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function generateVariants(destPath, relativeKey) {
  const ext = path.extname(destPath);
  const baseWithoutExt = destPath.slice(0, -ext.length);

  try {
    const buffer = fs.readFileSync(destPath);
    if (relativeKey.startsWith("products/")) {
      const var400 = `${baseWithoutExt}-400.webp`;
      const var800 = `${baseWithoutExt}-800.webp`;
      const var1200 = `${baseWithoutExt}-1200.webp`;
      if (!fs.existsSync(var400)) {
        await sharp(buffer).resize({ width: 400, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(var400);
      }
      if (!fs.existsSync(var800)) {
        await sharp(buffer).resize({ width: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(var800);
      }
      if (!fs.existsSync(var1200)) {
        await sharp(buffer).resize({ width: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(var1200);
      }
    } else if (relativeKey.startsWith("banners/")) {
      const var750 = `${baseWithoutExt}-750.webp`;
      const var1400 = `${baseWithoutExt}-1400.webp`;
      if (!fs.existsSync(var750)) {
        await sharp(buffer).resize({ width: 750, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(var750);
      }
      if (!fs.existsSync(var1400)) {
        await sharp(buffer).resize({ width: 1400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(var1400);
      }
    }
  } catch (err) {
    console.warn(`[Variant generation warning] for ${destPath}:`, err.message);
  }
}

function scanFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name) && !fullPath.includes("public" + path.sep + "images")) {
        scanFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function run() {
  console.log("==================================================");
  console.log(`🚀 IntriHub Image Migration Tool`);
  console.log(`Mode: ${writeMode ? "WRITE (Rewrite URLs in files)" : "DRY RUN (Download & Inventory)"}`);
  console.log(`Target directory: ${path.resolve(targetDir)}`);
  console.log("==================================================");

  const files = scanFiles(path.resolve(targetDir));
  console.log(`Scanned ${files.length} candidate files.`);

  const discoveredUrls = new Map();
  const fileModifications = new Map();

  for (const file of files) {
    // Skip this script itself and generated inventory
    if (file.endsWith("migrate-images.mjs") || file.endsWith("migrate-inventory.json") || file.endsWith("migrate-failed.json")) {
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    let match;
    let hasMatches = false;
    const regex = new RegExp(CLOUDINARY_REGEX);

    while ((match = regex.exec(content)) !== null) {
      const fullUrl = match[0];
      const relPath = match[1];
      discoveredUrls.set(fullUrl, relPath);
      hasMatches = true;
    }

    if (hasMatches && writeMode) {
      const rewritten = content.replace(CLOUDINARY_REGEX, (_m, relPath) => `/images/${relPath}`);
      fileModifications.set(file, rewritten);
    }
  }

  console.log(`\nDiscovered ${discoveredUrls.size} unique Cloudinary URLs across code/data files.`);

  const failed = [];
  let downloadedCount = 0;

  for (const [url, relPath] of discoveredUrls.entries()) {
    const destPath = path.join(publicImagesDir, relPath);
    try {
      if (!fs.existsSync(destPath)) {
        console.log(`📥 Downloading: ${url} -> /images/${relPath}`);
        await downloadFile(url, destPath);
        downloadedCount++;
      }
      await generateVariants(destPath, relPath);
    } catch (err) {
      console.error(`❌ Failed download for ${url}:`, err.message);
      failed.push({ url, relPath, error: err.message });
    }
  }

  if (writeMode && fileModifications.size > 0) {
    console.log(`\n✍️ Rewriting ${fileModifications.size} files...`);
    for (const [file, newContent] of fileModifications.entries()) {
      fs.writeFileSync(file, newContent, "utf8");
      console.log(`✅ Rewritten: ${path.relative(process.cwd(), file)}`);
    }
  }

  fs.writeFileSync(path.resolve(process.cwd(), "migrate-failed.json"), JSON.stringify(failed, null, 2));

  console.log("\n==================================================");
  console.log(`🎉 Migration Completed!`);
  console.log(`Unique URLs Processed: ${discoveredUrls.size}`);
  console.log(`Newly Downloaded: ${downloadedCount}`);
  console.log(`Failed: ${failed.length}`);
  if (writeMode) {
    console.log(`Files Rewritten: ${fileModifications.size}`);
  }
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
