import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups", `db-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`📦 Creating Database Backup in: ${backupDir}`);

  // Fetch all models
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({ include: { variants: true, attributes: true } });
  const variants = await prisma.productVariant.findMany();
  const offerBanners = await prisma.offerBanner.findMany();
  const banners = await prisma.banner.findMany();
  const uploadedFiles = await (prisma as any).uploadedFile.findMany();
  const vendors = await prisma.vendor.findMany();
  const reviews = await prisma.review.findMany({ include: { media: true } });
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, avatar: true } });

  fs.writeFileSync(path.join(backupDir, "categories.json"), JSON.stringify(categories, null, 2));
  fs.writeFileSync(path.join(backupDir, "products.json"), JSON.stringify(products, null, 2));
  fs.writeFileSync(path.join(backupDir, "product_variants.json"), JSON.stringify(variants, null, 2));
  fs.writeFileSync(path.join(backupDir, "offer_banners.json"), JSON.stringify(offerBanners, null, 2));
  fs.writeFileSync(path.join(backupDir, "banners.json"), JSON.stringify(banners, null, 2));
  fs.writeFileSync(path.join(backupDir, "uploaded_files.json"), JSON.stringify(uploadedFiles, null, 2));
  fs.writeFileSync(path.join(backupDir, "vendors.json"), JSON.stringify(vendors, null, 2));
  fs.writeFileSync(path.join(backupDir, "reviews.json"), JSON.stringify(reviews, null, 2));
  fs.writeFileSync(path.join(backupDir, "users.json"), JSON.stringify(users, null, 2));

  console.log(`✅ Backup successfully written:`);
  console.log(` - Categories: ${categories.length}`);
  console.log(` - Products: ${products.length}`);
  console.log(` - Product Variants: ${variants.length}`);
  console.log(` - Offer Banners: ${offerBanners.length}`);
  console.log(` - Uploaded Files: ${uploadedFiles.length}`);
  console.log(` - Vendors: ${vendors.length}`);

  // Create legacy-image-map.json
  const inventoryPath = path.resolve(process.cwd(), "migrate-inventory.json");
  const legacyMap: Record<string, string> = {};

  if (fs.existsSync(inventoryPath)) {
    const inv = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
    for (const item of inv) {
      if (item.originalUrl) {
        const match = item.originalUrl.match(/\/intrihub\/(.+)$/);
        if (match && match[1]) {
          legacyMap[item.originalUrl] = `/images/${match[1].split("?")[0]}`;
        }
      }
    }
  }

  // Also add any other mapped paths
  for (const c of categories) {
    if (c.image) {
      legacyMap[c.image] = c.image;
    }
  }
  for (const p of products) {
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        legacyMap[img] = img;
      }
    }
  }

  fs.mkdirSync(path.resolve(process.cwd(), "backups"), { recursive: true });
  fs.writeFileSync(path.resolve(process.cwd(), "backups", "legacy-image-map.json"), JSON.stringify(legacyMap, null, 2));
  console.log(`✅ Rollback legacy map created at: backups/legacy-image-map.json (${Object.keys(legacyMap).length} entries)`);
}

backupDatabase()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
