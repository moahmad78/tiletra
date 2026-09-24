import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import sharp from "sharp";

interface DownloadResult {
  originalUrl: string;
  targetPath: string;
  success: boolean;
  error?: string;
  sizeBytes?: number;
}

function downloadFile(url: string, destPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(url, { headers: { "User-Agent": "IntriHub-Migration/1.0" } }, (res) => {
      // Handle redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status code ${res.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
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

function parseCloudinaryRelativePath(url: string): { relativeKey: string; folder: string; filename: string } | null {
  if (!url || typeof url !== "string") return null;
  // Match cloudinary URLs e.g. .../upload/.../intrihub/products/prod-...
  const match = url.match(/\/intrihub\/(.+)$/);
  if (match && match[1]) {
    const cleanPath = match[1].split("?")[0];
    const parts = cleanPath.split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "misc";
    const filename = parts[parts.length - 1];
    return {
      relativeKey: cleanPath,
      folder,
      filename,
    };
  }
  return null;
}

async function main() {
  console.log("==================================================");
  console.log("🔍 IntriHub Phase 1 & 2: Inventory & Download Assets");
  console.log("==================================================");

  const publicImagesDir = path.resolve(process.cwd(), "public", "images");
  fs.mkdirSync(path.join(publicImagesDir, "products"), { recursive: true });
  fs.mkdirSync(path.join(publicImagesDir, "categories"), { recursive: true });
  fs.mkdirSync(path.join(publicImagesDir, "banners"), { recursive: true });
  fs.mkdirSync(path.join(publicImagesDir, "brand"), { recursive: true });
  fs.mkdirSync(path.join(publicImagesDir, "uploads"), { recursive: true });

  const urlMap = new Map<string, { folder: string; subPath: string }>();

  // 1. Gather Categories
  const categories = await prisma.category.findMany();
  console.log(`Found ${categories.length} categories.`);
  for (const cat of categories) {
    if (cat.image && cat.image.includes("res.cloudinary.com")) {
      const parsed = parseCloudinaryRelativePath(cat.image);
      if (parsed) {
        urlMap.set(cat.image, { folder: "categories", subPath: parsed.relativeKey });
      }
    }
  }

  // 2. Gather Products & Variants
  const products = await prisma.product.findMany({
    include: { variants: true },
  });
  console.log(`Found ${products.length} products.`);
  for (const prod of products) {
    if (Array.isArray(prod.images)) {
      for (const img of prod.images) {
        if (img && img.includes("res.cloudinary.com")) {
          const parsed = parseCloudinaryRelativePath(img);
          if (parsed) {
            urlMap.set(img, { folder: "products", subPath: parsed.relativeKey });
          }
        }
      }
    }
    for (const v of prod.variants) {
      if (v.image && v.image.includes("res.cloudinary.com")) {
        const parsed = parseCloudinaryRelativePath(v.image);
        if (parsed) {
          urlMap.set(v.image, { folder: "products", subPath: parsed.relativeKey });
        }
      }
      if (v.swatchImage && v.swatchImage.includes("res.cloudinary.com")) {
        const parsed = parseCloudinaryRelativePath(v.swatchImage);
        if (parsed) {
          urlMap.set(v.swatchImage, { folder: "products", subPath: parsed.relativeKey });
        }
      }
    }
  }

  // 3. Gather Offer Banners & Banners
  const offerBanners = await prisma.offerBanner.findMany();
  console.log(`Found ${offerBanners.length} offer banners.`);
  for (const b of offerBanners) {
    if (b.image && b.image.includes("res.cloudinary.com")) {
      const parsed = parseCloudinaryRelativePath(b.image);
      if (parsed) {
        urlMap.set(b.image, { folder: "banners", subPath: parsed.relativeKey });
      }
    }
  }

  const legacyBanners = await prisma.banner.findMany();
  console.log(`Found ${legacyBanners.length} banners.`);
  for (const b of legacyBanners) {
    if (b.image && b.image.includes("res.cloudinary.com")) {
      const parsed = parseCloudinaryRelativePath(b.image);
      if (parsed) {
        urlMap.set(b.image, { folder: "banners", subPath: parsed.relativeKey });
      }
    }
  }

  console.log(`\n📊 Total Unique Cloudinary URLs Identified: ${urlMap.size}`);

  const results: DownloadResult[] = [];
  const failed: { url: string; error: string }[] = [];

  let downloadedCount = 0;
  for (const [url, info] of urlMap.entries()) {
    const destPath = path.join(publicImagesDir, info.subPath);
    try {
      if (!fs.existsSync(destPath)) {
        console.log(`📥 Downloading: ${url} -> ${destPath}`);
        const buf = await downloadFile(url, destPath);
        downloadedCount++;
        results.push({ originalUrl: url, targetPath: destPath, success: true, sizeBytes: buf.length });
      } else {
        console.log(`⚡ Already exists: ${destPath}`);
        results.push({ originalUrl: url, targetPath: destPath, success: true, sizeBytes: fs.statSync(destPath).size });
      }

      // Generate responsive variants if this is a product or banner
      const ext = path.extname(destPath);
      const baseNameWithoutExt = destPath.slice(0, -ext.length);

      if (info.folder === "products" || info.subPath.startsWith("products/")) {
        const masterBuffer = fs.readFileSync(destPath);
        // 400px variant
        const var400 = `${baseNameWithoutExt}-400.webp`;
        if (!fs.existsSync(var400)) {
          await sharp(masterBuffer)
            .resize({ width: 400, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(var400);
        }
        // 800px variant
        const var800 = `${baseNameWithoutExt}-800.webp`;
        if (!fs.existsSync(var800)) {
          await sharp(masterBuffer)
            .resize({ width: 800, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(var800);
        }
        // 1200px variant
        const var1200 = `${baseNameWithoutExt}-1200.webp`;
        if (!fs.existsSync(var1200)) {
          await sharp(masterBuffer)
            .resize({ width: 1200, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(var1200);
        }
      } else if (info.folder === "banners" || info.subPath.startsWith("banners/")) {
        const masterBuffer = fs.readFileSync(destPath);
        // 750px banner
        const var750 = `${baseNameWithoutExt}-750.webp`;
        if (!fs.existsSync(var750)) {
          await sharp(masterBuffer)
            .resize({ width: 750, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(var750);
        }
        // 1400px banner
        const var1400 = `${baseNameWithoutExt}-1400.webp`;
        if (!fs.existsSync(var1400)) {
          await sharp(masterBuffer)
            .resize({ width: 1400, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(var1400);
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to download ${url}:`, err.message);
      failed.push({ url, error: err.message || String(err) });
      results.push({ originalUrl: url, targetPath: destPath, success: false, error: err.message });
    }
  }

  // Write migration inventory and failures
  fs.writeFileSync(path.resolve(process.cwd(), "migrate-inventory.json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.resolve(process.cwd(), "migrate-failed.json"), JSON.stringify(failed, null, 2));

  console.log("\n==================================================");
  console.log(`✅ Completed Image Download & Variant Generation!`);
  console.log(`Total URLs: ${urlMap.size}`);
  console.log(`Newly Downloaded: ${downloadedCount}`);
  console.log(`Failed: ${failed.length}`);
  console.log("==================================================");
}

main()
  .catch((e) => console.error("Fatal error:", e))
  .finally(() => prisma.$disconnect());
