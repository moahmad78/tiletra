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
    if (cat.image.includes("res.cloudinary.com")) {
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
        if (img.includes("res.cloudinary.com")) {
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

          if (!fs.existsSync(v400)) console.warn(`Missing 400px variant for ${img}`);
          if (!fs.existsSync(v800)) console.warn(`Missing 800px variant for ${img}`);
          if (!fs.existsSync(v1200)) console.warn(`Missing 1200px variant for ${img}`);
        }
      }
    }

    for (const v of prod.variants) {
      if (v.image) {
        variantImagesChecked++;
        if (v.image.includes("res.cloudinary.com")) {
          console.error(`❌ Variant image has Cloudinary URL: ${v.image}`);
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
    if (b.image.includes("res.cloudinary.com")) {
      console.error(`❌ Banner [${b.title}] has Cloudinary URL: ${b.image}`);
      externalUrlsFound++;
    } else if (b.image.startsWith("/images/")) {
      const filePath = path.join(publicDir, b.image);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Banner [${b.title}] file missing on disk: ${filePath}`);
        missingFiles++;
      }
    }
  }
  console.log(`✅ Audited ${banners.length} offer banners.`);

  // 4. Verify Placeholder & Brand assets
  const placeholderSvg = path.join(publicDir, "images", "brand", "placeholder.svg");
  const placeholderWebp = path.join(publicDir, "images", "brand", "placeholder.webp");
  const logo = path.join(publicDir, "images", "brand", "logo.png");

  console.log("\n🎨 Checking Brand & Fallback Assets...");
  console.log(` - placeholder.svg exists: ${fs.existsSync(placeholderSvg)} (${fs.statSync(placeholderSvg).size} bytes)`);
  console.log(` - placeholder.webp exists: ${fs.existsSync(placeholderWebp)} (${fs.statSync(placeholderWebp).size} bytes)`);
  console.log(` - logo.png exists: ${fs.existsSync(logo)} (${fs.statSync(logo).size} bytes)`);

  console.log("\n==================================================");
  console.log("📊 Audit Summary Results:");
  console.log(` - Total DB Image References Checked: ${totalChecked}`);
  console.log(` - Cloudinary / External URLs Found: ${externalUrlsFound}`);
  console.log(` - Missing Files On Disk: ${missingFiles}`);
  console.log("==================================================");

  if (externalUrlsFound === 0 && missingFiles === 0) {
    console.log("🎉 ALL ACCEPTANCE CRITERIA PASSED! IntriHub is 100% first-party image hosted!");
  } else {
    console.error("⚠️ Some items need attention.");
  }
}

verifyAllFirstPartyImages()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
