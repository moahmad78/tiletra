import { prisma } from "../lib/prisma";
import { uploadToCloudinary } from "../lib/cloudinary";

async function uploadUrlOrBase64ToCloudinary(url: string, folder: string, name: string): Promise<string | null> {
  if (!url) return null;
  // If already hosted on Cloudinary, skip
  if (url.includes("res.cloudinary.com")) {
    return url;
  }

  try {
    // If it's a relative URL to uploads
    if (url.startsWith("/api/uploads/") || url.startsWith("/uploads/")) {
      const fileName = url.split("/").pop();
      if (fileName) {
        const dbFile = await (prisma as any).uploadedFile.findUnique({
          where: { fileName }
        });
        if (dbFile && dbFile.dataBase64) {
          const mime = dbFile.mimeType || "image/webp";
          const dataUri = `data:${mime};base64,${dbFile.dataBase64}`;
          const res = await uploadToCloudinary(dataUri, folder, name);
          return res.secure_url;
        }
      }
    }

    // If it's an external HTTP/HTTPS URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await uploadToCloudinary(url, folder, name);
      return res.secure_url;
    }

    return null;
  } catch (err: any) {
    console.warn(`[Cloudinary Migration] Failed for ${url}:`, err.message || err);
    return null;
  }
}

async function runMigration() {
  console.log("==========================================");
  console.log("🚀 Starting Intrihub Cloudinary Migration");
  console.log("==========================================");

  // 1. Migrate Categories
  console.log("\n📦 Migrating Category images...");
  const categories = await prisma.category.findMany();
  let catUpdated = 0;

  for (const cat of categories) {
    let changed = false;
    let newImage = cat.image;
    let newIcon = cat.icon;

    if (cat.image && !cat.image.includes("res.cloudinary.com")) {
      let sourceImage = cat.image;
      if (cat.name.includes("Outdoor")) {
        sourceImage = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80";
      }
      const cdnUrl = await uploadUrlOrBase64ToCloudinary(sourceImage, "intrihub/categories", `cat-${cat.slug || cat.id}`);
      if (cdnUrl) {
        newImage = cdnUrl;
        changed = true;
      }
    }

    if (cat.icon && !cat.icon.includes("res.cloudinary.com") && (cat.icon.startsWith("http") || cat.icon.startsWith("/api/uploads"))) {
      const cdnUrl = await uploadUrlOrBase64ToCloudinary(cat.icon, "intrihub/categories/icons", `icon-${cat.slug || cat.id}`);
      if (cdnUrl) {
        newIcon = cdnUrl;
        changed = true;
      }
    }

    if (changed) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: newImage, icon: newIcon }
      });
      catUpdated++;
      console.log(`✅ Category [${cat.name}] updated with Cloudinary CDN.`);
    }
  }
  console.log(`🎉 Finished categories. Updated: ${catUpdated}/${categories.length}`);

  // 2. Migrate Products
  console.log("\n🛍️ Migrating Product images...");
  const products = await prisma.product.findMany();
  let prodUpdated = 0;

  for (const prod of products) {
    let changed = false;
    let newImages: string[] = [];

    if (Array.isArray(prod.images) && prod.images.length > 0) {
      for (let i = 0; i < prod.images.length; i++) {
        const imgUrl = prod.images[i];
        if (imgUrl && !imgUrl.includes("res.cloudinary.com")) {
          const cdnUrl = await uploadUrlOrBase64ToCloudinary(imgUrl, "intrihub/products", `prod-${prod.slug || prod.id}-${i}`);
          if (cdnUrl) {
            newImages.push(cdnUrl);
            changed = true;
          } else {
            newImages.push(imgUrl);
          }
        } else if (imgUrl) {
          newImages.push(imgUrl);
        }
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          images: newImages
        }
      });
      prodUpdated++;
      console.log(`✅ Product [${prod.name}] updated with Cloudinary CDN.`);
    }
  }
  console.log(`🎉 Finished products. Updated: ${prodUpdated}/${products.length}`);

  // 3. Migrate Offer Banners
  console.log("\n🎨 Migrating Offer Banners...");
  const offerBanners = await prisma.offerBanner.findMany();
  let bannerUpdated = 0;
  for (const b of offerBanners) {
    if (b.image && !b.image.includes("res.cloudinary.com")) {
      const cdnUrl = await uploadUrlOrBase64ToCloudinary(b.image, "intrihub/banners", `banner-${b.id}`);
      if (cdnUrl) {
        await prisma.offerBanner.update({
          where: { id: b.id },
          data: { image: cdnUrl }
        });
        bannerUpdated++;
        console.log(`✅ OfferBanner [${b.title}] updated with Cloudinary CDN.`);
      }
    }
  }
  console.log(`🎉 Finished Offer Banners. Updated: ${bannerUpdated}/${offerBanners.length}`);

  console.log("\n==========================================");
  console.log("✨ Cloudinary Migration Completed Successfully!");
  console.log("==========================================");
}

runMigration()
  .catch((err) => {
    console.error("Migration fatal error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
