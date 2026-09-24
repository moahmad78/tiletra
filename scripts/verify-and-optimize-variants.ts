import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const SIZE_BUDGETS = {
  product400: 35 * 1024,
  product800: 100 * 1024,
  product1200: 180 * 1024,
  banner750: 90 * 1024,
  banner1400: 180 * 1024,
};

async function main() {
  console.log("=================================================");
  console.log("PHASE 3: FILES ON DISK VS REFERENCES & BUDGET AUDIT");
  console.log("=================================================\n");

  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } });
  const banners = await prisma.offerBanner.findMany({ select: { id: true, title: true, image: true } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true, image: true } });

  console.log(`Auditing: ${products.length} products, ${banners.length} banners, ${categories.length} categories.`);

  let missingMasterCount = 0;
  let generatedVariantsCount = 0;
  let reoptimizedVariantsCount = 0;
  const namingIssues: string[] = [];

  // 1. Audit Categories
  console.log("\n1. Checking Category Images...");
  for (const cat of categories) {
    if (!cat.image || !cat.image.startsWith("/images/")) continue;
    const diskPath = path.join(PUBLIC_DIR, cat.image);
    if (!fs.existsSync(diskPath)) {
      console.error(`[MISSING MASTER] Category "${cat.name}" -> ${cat.image}`);
      missingMasterCount++;
    }
  }

  // 2. Audit & Generate Product Variants
  console.log("\n2. Checking Product Master Images & Variants (-400, -800, -1200)...");
  const productWidths = [
    { width: 400, suffix: "-400.webp", maxBytes: SIZE_BUDGETS.product400 },
    { width: 800, suffix: "-800.webp", maxBytes: SIZE_BUDGETS.product800 },
    { width: 1200, suffix: "-1200.webp", maxBytes: SIZE_BUDGETS.product1200 },
  ];

  for (const prod of products) {
    for (const imgUrl of prod.images) {
      if (!imgUrl.startsWith("/images/")) continue;
      const masterPath = path.join(PUBLIC_DIR, imgUrl);
      if (!fs.existsSync(masterPath)) {
        console.error(`[MISSING MASTER] Product "${prod.name}" -> ${imgUrl}`);
        missingMasterCount++;
        continue;
      }

      const parsed = path.parse(masterPath);
      for (const { width, suffix, maxBytes } of productWidths) {
        const variantPath = path.join(parsed.dir, `${parsed.name}${suffix}`);
        if (!fs.existsSync(variantPath)) {
          // Generate missing variant
          await sharp(masterPath)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 })
            .toFile(variantPath);
          console.log(`[GENERATED VARIANT] ${path.relative(PUBLIC_DIR, variantPath)}`);
          generatedVariantsCount++;
        }

        // Check size budget
        let stat = fs.statSync(variantPath);
        if (stat.size > maxBytes) {
          console.warn(`[OVER BUDGET] ${path.relative(PUBLIC_DIR, variantPath)}: ${(stat.size / 1024).toFixed(1)} KB > ${(maxBytes / 1024).toFixed(0)} KB. Re-optimizing...`);
          // Re-encode with lower quality until it meets budget
          let quality = 75;
          while (stat.size > maxBytes && quality >= 40) {
            await sharp(masterPath)
              .resize({ width, withoutEnlargement: true })
              .webp({ quality, effort: 6 })
              .toFile(variantPath);
            stat = fs.statSync(variantPath);
            quality -= 5;
          }
          console.log(`  -> New size: ${(stat.size / 1024).toFixed(1)} KB (quality=${quality + 5})`);
          reoptimizedVariantsCount++;
        }
      }
    }
  }

  // 3. Audit & Generate Banner Variants
  console.log("\n3. Checking Banner Master Images & Variants (-750, -1400)...");
  const bannerWidths = [
    { width: 750, suffix: "-750.webp", maxBytes: SIZE_BUDGETS.banner750 },
    { width: 1400, suffix: "-1400.webp", maxBytes: SIZE_BUDGETS.banner1400 },
  ];

  for (const banner of banners) {
    if (!banner.image || !banner.image.startsWith("/images/")) continue;
    const masterPath = path.join(PUBLIC_DIR, banner.image);
    if (!fs.existsSync(masterPath)) {
      console.error(`[MISSING MASTER] Banner "${banner.title}" -> ${banner.image}`);
      missingMasterCount++;
      continue;
    }

    const parsed = path.parse(masterPath);
    for (const { width, suffix, maxBytes } of bannerWidths) {
      const variantPath = path.join(parsed.dir, `${parsed.name}${suffix}`);
      if (!fs.existsSync(variantPath)) {
        await sharp(masterPath)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toFile(variantPath);
        console.log(`[GENERATED VARIANT] ${path.relative(PUBLIC_DIR, variantPath)}`);
        generatedVariantsCount++;
      }

      // Check size budget
      let stat = fs.statSync(variantPath);
      if (stat.size > maxBytes) {
        console.warn(`[OVER BUDGET] ${path.relative(PUBLIC_DIR, variantPath)}: ${(stat.size / 1024).toFixed(1)} KB > ${(maxBytes / 1024).toFixed(0)} KB. Re-optimizing...`);
        let quality = 75;
        while (stat.size > maxBytes && quality >= 40) {
          await sharp(masterPath)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality, effort: 6 })
            .toFile(variantPath);
          stat = fs.statSync(variantPath);
          quality -= 5;
        }
        console.log(`  -> New size: ${(stat.size / 1024).toFixed(1)} KB (quality=${quality + 5})`);
        reoptimizedVariantsCount++;
      }
    }
  }

  // 4. Check Filename Conventions across public/images/
  console.log("\n4. Checking lowercase ASCII hyphen-separated filename convention...");
  function checkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDir(fullPath);
      } else {
        const basename = entry.name;
        // Check ASCII lowercase, digits, hyphens, periods
        if (!/^[a-z0-9\-\.]+$/.test(basename)) {
          namingIssues.push(path.relative(PUBLIC_DIR, fullPath));
        }
      }
    }
  }
  checkDir(path.join(PUBLIC_DIR, "images"));

  console.log("\n=================================================");
  console.log("PHASE 3 AUDIT & OPTIMIZATION RESULTS:");
  console.log(`- Missing Master Images:         ${missingMasterCount}`);
  console.log(`- Generated Missing Variants:    ${generatedVariantsCount}`);
  console.log(`- Re-optimized Over-Budget:      ${reoptimizedVariantsCount}`);
  console.log(`- Non-standard Filenames:        ${namingIssues.length}`);
  if (namingIssues.length > 0) {
    console.log("  Non-standard files:", namingIssues);
  }
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Error in Phase 3 verification:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
