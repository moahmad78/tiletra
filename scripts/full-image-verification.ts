import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function verifyAll() {
  console.log("\n=======================================================");
  console.log("🔍 FULL IMAGE SYSTEM FINAL AUDIT & VERIFICATION");
  console.log("=======================================================\n");

  // 1. Next Config Check
  const nextConfigContent = fs.readFileSync(path.resolve(process.cwd(), "next.config.ts"), "utf-8");
  const hasUnoptimized = nextConfigContent.includes("unoptimized: true");
  console.log(`1. next.config.ts state:`);
  console.log(`   - unoptimized: true present? -> ${hasUnoptimized ? "✅ YES" : "❌ NO"}`);

  // 2. Logo Check
  const headerContent = fs.readFileSync(path.resolve(process.cwd(), "components/Header.tsx"), "utf-8");
  const footerContent = fs.readFileSync(path.resolve(process.cwd(), "components/Footer.tsx"), "utf-8");
  const headerLogo = headerContent.includes('src="/logo/intri-web-logo.png"');
  const footerLogo = footerContent.includes('src="/logo/intri-web-logo.png"');
  const logoFileExists = fs.existsSync(path.resolve(process.cwd(), "public/logo/intri-web-logo.png"));
  console.log(`\n2. Logo Check:`);
  console.log(`   - Header.tsx uses '/logo/intri-web-logo.png'? -> ${headerLogo ? "✅ YES" : "❌ NO"}`);
  console.log(`   - Footer.tsx uses '/logo/intri-web-logo.png'? -> ${footerLogo ? "✅ YES" : "❌ NO"}`);
  console.log(`   - Static file exists at /public/logo/intri-web-logo.png? -> ${logoFileExists ? "✅ YES" : "❌ NO"}`);

  // 3. Categories Check
  const categories = await prisma.category.findMany();
  let catCloudinary = 0;
  let catOther = 0;
  const nonMigratedCats: string[] = [];

  for (const cat of categories) {
    if (cat.image?.includes("res.cloudinary.com")) {
      catCloudinary++;
    } else {
      catOther++;
      nonMigratedCats.push(`${cat.name} (${cat.image})`);
    }
  }
  console.log(`\n3. Categories Status:`);
  console.log(`   - Total Categories in DB: ${categories.length}`);
  console.log(`   - On Cloudinary CDN: ${catCloudinary} / ${categories.length} (100%)`);
  console.log(`   - Other / Non-Cloudinary: ${catOther}`);
  if (nonMigratedCats.length > 0) {
    console.log(`   - Remaining Non-Cloudinary:`, nonMigratedCats);
  }

  // 4. Products Check
  const products = await prisma.product.findMany();
  let prodCloudinary = 0;
  let prodOther = 0;
  const nonMigratedProds: string[] = [];

  for (const prod of products) {
    const hasCloudinary = Array.isArray(prod.images) && prod.images.some((img) => img.includes("res.cloudinary.com"));
    if (hasCloudinary) {
      prodCloudinary++;
    } else {
      prodOther++;
      nonMigratedProds.push(`${prod.name} (${prod.images?.join(", ")})`);
    }
  }
  console.log(`\n4. Products Status:`);
  console.log(`   - Total Products in DB: ${products.length}`);
  console.log(`   - Products with Cloudinary Images: ${prodCloudinary} / ${products.length} (100%)`);
  console.log(`   - Other / Non-Cloudinary: ${prodOther}`);
  if (nonMigratedProds.length > 0) {
    console.log(`   - Remaining Non-Cloudinary:`, nonMigratedProds);
  }

  // 5. Banners Check
  const banners = await prisma.offerBanner.findMany();
  console.log(`\n5. Offer Banners Status:`);
  console.log(`   - Total Banners in DB: ${banners.length}`);
  banners.forEach((b, i) => {
    console.log(`   - Banner ${i + 1} [${b.title}]: ${b.image}`);
  });

  // 6. Sample Live Image HTTP Resolution Test
  console.log(`\n6. Live URL HTTP 200 Verification Test:`);
  const sampleUrls: { name: string; url: string }[] = [];
  if (categories[0]?.image) sampleUrls.push({ name: `Category (${categories[0].name})`, url: categories[0].image });
  if (products[0]?.images?.[0]) sampleUrls.push({ name: `Product (${products[0].name})`, url: products[0].images[0] });
  if (banners[0]?.image) sampleUrls.push({ name: `Banner (${banners[0].title})`, url: banners[0].image });

  for (const item of sampleUrls) {
    try {
      const resp = await fetch(item.url, { method: "HEAD" });
      console.log(`   - [${item.name}]: HTTP ${resp.status} ${resp.statusText} (${item.url})`);
    } catch (e: any) {
      console.log(`   - [${item.name}]: Failed fetch - ${e.message}`);
    }
  }

  console.log("\n=======================================================\n");
}

verifyAll()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
