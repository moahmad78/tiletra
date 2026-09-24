import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function verifyAllFirstPartyImages() {
  console.log("==================================================");
  console.log("🔍 IntriHub First-Party Image System Audit");
  console.log("==================================================");

  const publicDir = path.resolve(process.cwd(), "public");
  let totalChecked = 0;
  let missingFiles = 0;
  let externalUrlsFound = 0;

  // 1. Audit Categories
  console.log("\n📦 Auditing Categories in DB...");
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    totalChecked++;
    if (cat.image.includes("res.cloudinary.com") || cat.image.includes("cloudinary")) {
      console.error(`❌ Category [${cat.name}] still has Cloudinary URL: ${cat.image}`);
      externalUrlsFound++;
    } else if (cat.image.startsWith("/images/")) {
      const filePath = path.join(publicDir, cat.image);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Category [${cat.name}] file missing on disk: ${filePath}`);
        missingFiles++;
      }
    }
  }
  console.log(`✅ Audited ${categories.length} categories.`);

  // 2. Audit Products & Variants
  console.log("\n🛍️ Auditing Products & Variants in DB...");
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  let variantImagesChecked = 0;
  for (const prod of products) {
    if (Array.isArray(prod.images)) {
      for (const img of prod.images) {
        totalChecked++;
        if (img.includes("res.cloudinary.com") || img.includes("cloudinary")) {
          console.error(`❌ Product [${prod.name}] has Cloudinary URL: ${img}`);
          externalUrlsFound++;
        } else if (img.startsWith("/images/")) {
          const filePath = path.join(publicDir, img);
          if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Product [${prod.name}] file missing on disk: ${filePath}`);
            missingFiles++;
          }

          // Check if responsive variants exist
          const ext = path.extname(filePath);
          const base = filePath.slice(0, -ext.length);
          const v400 = `${base}-400.webp`;
          const v800 = `${base}-800.webp`;
          const v1200 = `${base}-1200.webp`;

          if (!fs.existsSync(v400)) {
            console.warn(`Missing 400px variant for ${img}`);
            missingFiles++;
          }
          if (!fs.existsSync(v800)) {
            console.warn(`Missing 800px variant for ${img}`);
            missingFiles++;
          }
          if (!fs.existsSync(v1200)) {
            console.warn(`Missing 1200px variant for ${img}`);
            missingFiles++;
          }
        }
      }
    }

    for (const v of prod.variants) {
      if (v.image) {
        variantImagesChecked++;
        if (v.image.includes("res.cloudinary.com") || v.image.includes("cloudinary")) {
          console.error(`❌ Variant image has Cloudinary URL: ${v.image}`);
          externalUrlsFound++;
        }
      }
      if (v.swatchImage) {
        variantImagesChecked++;
        if (v.swatchImage.includes("res.cloudinary.com") || v.swatchImage.includes("cloudinary")) {
          console.error(`❌ Variant swatch has Cloudinary URL: ${v.swatchImage}`);
          externalUrlsFound++;
        }
      }
    }
  }
  console.log(`✅ Audited ${products.length} products and ${variantImagesChecked} variant images.`);

  // 3. Audit Offer Banners
  console.log("\n📢 Auditing Offer Banners in DB...");
  const banners = await prisma.offerBanner.findMany();
  for (const b of banners) {
    totalChecked++;
    if (b.image.includes("res.cloudinary.com") || b.image.includes("cloudinary")) {
      console.error(`❌ Banner [${b.title}] has Cloudinary URL: ${b.image}`);
      externalUrlsFound++;
    } else if (b.image.startsWith("/images/")) {
      const filePath = path.join(publicDir, b.image);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Banner [${b.title}] file missing on disk: ${filePath}`);
        missingFiles++;
      }
      const ext = path.extname(filePath);
      const base = filePath.slice(0, -ext.length);
      if (!fs.existsSync(`${base}-750.webp`)) missingFiles++;
      if (!fs.existsSync(`${base}-1400.webp`)) missingFiles++;
    }
  }
  console.log(`✅ Audited ${banners.length} offer banners.`);

  // 4. Audit Vendors & Documents
  console.log("\n🏢 Auditing Vendors in DB...");
  const vendors = await prisma.vendor.findMany();
  for (const v of vendors) {
    for (const docField of ["logo", "shopPhotoUrl", "panDocUrl", "aadharDocUrl", "gstDocUrl"] as const) {
      const val = v[docField];
      if (val && (val.includes("cloudinary.com") || val.includes("res.cloudinary.com"))) {
        console.error(`❌ Vendor [${v.businessName}] has Cloudinary in ${docField}: ${val}`);
        externalUrlsFound++;
      }
    }
  }
  console.log(`✅ Audited ${vendors.length} vendors.`);

  // 5. Verify Placeholders
  console.log("\n🖼️ Auditing Placeholders & Core Assets...");
  const placeholderProductSvg = path.join(publicDir, "images", "placeholder-product.svg");
  const placeholderCategorySvg = path.join(publicDir, "images", "placeholder-category.svg");
  const placeholderBannerSvg = path.join(publicDir, "images", "placeholder-banner.svg");

  if (!fs.existsSync(placeholderProductSvg)) console.error("❌ Missing placeholder-product.svg");
  if (!fs.existsSync(placeholderCategorySvg)) console.error("❌ Missing placeholder-category.svg");
  if (!fs.existsSync(placeholderBannerSvg)) console.error("❌ Missing placeholder-banner.svg");

  console.log("\n==================================================");
  console.log("📊 Summary Report:");
  console.log(`   - Total DB Image Records Checked: ${totalChecked}`);
  console.log(`   - Missing Files on Disk:           ${missingFiles}`);
  console.log(`   - Cloudinary URLs Remaining in DB: ${externalUrlsFound}`);
  console.log("==================================================");

  if (missingFiles > 0 || externalUrlsFound > 0) {
    process.exit(1);
  }
}

verifyAllFirstPartyImages()
  .catch((e) => {
    console.error("Verification script failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
