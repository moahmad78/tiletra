import { prisma } from "../lib/prisma";

function convertToLocalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/images/") || url.startsWith("/placeholders/") || url.startsWith("/logo/") || url.startsWith("/uploads/")) {
    return url;
  }
  const match = url.match(/\/intrihub\/(.+)$/);
  if (match && match[1]) {
    const cleanPath = match[1].split("?")[0];
    return `/images/${cleanPath}`;
  }
  return url;
}

async function runDbMigration() {
  console.log("==================================================");
  console.log("🔄 IntriHub Database Image Migration to First-Party");
  console.log("==================================================");

  // 1. Categories
  console.log("\n📦 Migrating Categories...");
  const categories = await prisma.category.findMany();
  let catUpdated = 0;
  for (const cat of categories) {
    const newImage = convertToLocalUrl(cat.image) || "";
    if (newImage !== cat.image) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: newImage },
      });
      catUpdated++;
      console.log(`✅ Category [${cat.name}] image updated to: ${newImage}`);
    }
  }
  console.log(`Finished categories. Updated: ${catUpdated}/${categories.length}`);

  // 2. Products
  console.log("\n🛍️ Migrating Products...");
  const products = await prisma.product.findMany();
  let prodUpdated = 0;
  for (const prod of products) {
    let changed = false;
    let newImages: string[] = [];
    if (Array.isArray(prod.images)) {
      for (const img of prod.images) {
        const local = convertToLocalUrl(img);
        if (local && local !== img) {
          newImages.push(local);
          changed = true;
        } else if (local) {
          newImages.push(local);
        }
      }
    }
    if (changed) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { images: newImages },
      });
      prodUpdated++;
      console.log(`✅ Product [${prod.name}] images updated.`);
    }
  }
  console.log(`Finished products. Updated: ${prodUpdated}/${products.length}`);

  // 3. Product Variants
  console.log("\n🎨 Migrating Product Variants...");
  const variants = await prisma.productVariant.findMany();
  let variantUpdated = 0;
  for (const v of variants) {
    let changed = false;
    const newImage = convertToLocalUrl(v.image);
    const newSwatch = convertToLocalUrl(v.swatchImage);

    if (newImage !== v.image || newSwatch !== v.swatchImage) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: {
          image: newImage,
          swatchImage: newSwatch,
        },
      });
      variantUpdated++;
    }
  }
  console.log(`Finished variants. Updated: ${variantUpdated}/${variants.length}`);

  // 4. Offer Banners
  console.log("\n📢 Migrating Offer Banners...");
  const offerBanners = await prisma.offerBanner.findMany();
  let bannerUpdated = 0;
  for (const b of offerBanners) {
    const newImage = convertToLocalUrl(b.image) || "";
    if (newImage !== b.image) {
      await prisma.offerBanner.update({
        where: { id: b.id },
        data: { image: newImage },
      });
      bannerUpdated++;
      console.log(`✅ OfferBanner [${b.title}] updated to: ${newImage}`);
    }
  }
  console.log(`Finished Offer Banners. Updated: ${bannerUpdated}/${offerBanners.length}`);

  // 5. Legacy Banners
  const legacyBanners = await prisma.banner.findMany();
  let legacyBannerUpdated = 0;
  for (const b of legacyBanners) {
    const newImage = convertToLocalUrl(b.image) || "";
    if (newImage !== b.image) {
      await prisma.banner.update({
        where: { id: b.id },
        data: { image: newImage },
      });
      legacyBannerUpdated++;
    }
  }
  console.log(`Finished Legacy Banners. Updated: ${legacyBannerUpdated}/${legacyBanners.length}`);

  console.log("\n==================================================");
  console.log("✨ Database Image Migration Completed Successfully!");
  console.log("==================================================");
}

runDbMigration()
  .catch((e) => console.error("Database migration error:", e))
  .finally(() => prisma.$disconnect());
