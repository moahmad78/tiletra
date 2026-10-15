import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "cement-concrete": "/images/categories/cat-cement-concrete.jpg",
  "steel-rebar": "/images/categories/cat-steel-rebar.jpg",
  "bricks-blocks": "/images/categories/cat-bricks-blocks.jpg",
  "sand-aggregates": "/images/categories/cat-sand-aggregates.jpg",
  "roofing-sheets": "/images/categories/cat-roofing-sheets.jpg",
  "site-tools-safety": "/images/categories/cat-tools-consumables.jpg",
  "tools-hardware": "/images/categories/cat-tools-consumables.jpg",
  "tiles-flooring": "/images/categories/cat-tiles-stone.jpg",
  "tiles-stone": "/images/categories/cat-tiles-stone.jpg",
  "floor-tiles": "/images/categories/cat-tiles-stone.jpg",
  "wall-tiles": "/images/categories/cat-tiles-stone.jpg",
  "plywood-laminates-surfaces": "/images/categories/cat-plywood.jpg",
  "plywood": "/images/categories/cat-plywood.jpg",
  "hardware-fasteners": "/images/categories/cat-hardware.webp",
  "hardware": "/images/categories/cat-hardware.webp",
  "lights-lighting": "/images/categories/cat-lighting.jpg",
  "lighting": "/images/categories/cat-lighting.jpg",
  "kitchen-wardrobe-fittings": "/images/categories/cat-kitchen-wardrobe.jpg",
  "kitchen-wardrobe": "/images/categories/cat-kitchen-wardrobe.jpg",
  "paint-finishes": "/images/categories/cat-paint-finishes.jpg",
  "paints": "/images/categories/cat-paint-finishes.jpg",
  "paints-finishes": "/images/categories/cat-paint-finishes.jpg",
  "glass-mirrors-profiles": "/images/categories/cat-glass-mirror.jpg",
  "glass-mirrors": "/images/categories/cat-glass-mirror.jpg",
  "ceiling-drywall": "/images/categories/cat-false-ceiling.jpg",
  "false-ceiling": "/images/categories/cat-false-ceiling.jpg",
  "electricals-wires": "/images/categories/cat-electrical.jpg",
  "electrical": "/images/categories/cat-electrical.jpg",
  "plumbing-tanks": "/images/categories/cat-plumbing.jpg",
  "plumbing": "/images/categories/cat-plumbing.jpg",
  "sanitaryware-bath": "/images/categories/cat-sanitaryware-bath.jpg",
  "sanitaryware": "/images/categories/cat-sanitaryware-bath.jpg",
  "doors-windows-locks": "/images/categories/cat-doors-windows.jpg",
  "doors-windows": "/images/categories/cat-doors-windows.jpg",
  "waterproofing-adhesives": "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
  "adhesives-sealants-waterproofing": "/images/categories/cat-adhesives-sealants-waterproofing.jpg",
  "solar-energy": "/images/categories/cat-solar-energy.jpg",
  "fans-ventilation": "/images/categories/cat-fans-ventilation.jpg",
  "home-decor": "/images/categories/cat-decor-accessories.jpg",
  "decor-accessories": "/images/categories/cat-decor-accessories.jpg",
};

async function fixAllImages() {
  const publicDir = path.resolve(process.cwd(), "public");
  console.log("==================================================");
  console.log("🛠️ FIXING ALL HERO BANNERS, CATEGORIES & PRODUCTS");
  console.log(`Public Dir: ${publicDir}`);
  console.log("==================================================\n");

  // 1. Fix Offer Banners
  console.log("🖼️ 1. Fixing Hero Offer Banners...");
  const bannerImages = [
    { id: "slide-1", image: "/images/banners/banner-slide-1.jpg" },
    { id: "slide-2", image: "/images/banners/banner-slide-2.jpg" },
    { id: "slide-3", image: "/images/banners/banner-slide-3.jpg" },
  ];

  for (const b of bannerImages) {
    await prisma.offerBanner.updateMany({
      where: { id: b.id },
      data: { image: b.image },
    });
    console.log(`✅ Updated banner [${b.id}] -> ${b.image}`);
  }

  // Also update any other banner if it has placeholder
  const otherBanners = await prisma.offerBanner.findMany();
  for (const ob of otherBanners) {
    if (ob.image.includes("placeholder") || !ob.image) {
      await prisma.offerBanner.update({
        where: { id: ob.id },
        data: { image: "/images/banners/banner-slide-1.jpg" },
      });
      console.log(`✅ Fallback applied to banner [${ob.title}] -> /images/banners/banner-slide-1.jpg`);
    }
  }

  // 2. Fix Categories
  console.log("\n📁 2. Auditing and Fixing Category Images...");
  const categories = await prisma.category.findMany();
  let catUpdated = 0;

  for (const c of categories) {
    const targetFile = c.image.startsWith("/images/") ? path.join(publicDir, c.image) : "";
    const isMissing = !targetFile || !fs.existsSync(targetFile) || c.image.includes("placeholder");

    if (isMissing) {
      const fallback =
        CATEGORY_IMAGE_MAP[c.slug] ||
        CATEGORY_IMAGE_MAP[c.slug.replace(/-/g, "")] ||
        "/images/categories/cat-tiles-stone.jpg";

      await prisma.category.update({
        where: { id: c.id },
        data: { image: fallback },
      });
      console.log(`✅ Category [${c.name}] (${c.slug}) fixed -> ${fallback}`);
      catUpdated++;
    }
  }
  console.log(`Total categories updated: ${catUpdated}/${categories.length}`);

  // 3. Fix Products
  console.log("\n🛍️ 3. Auditing and Fixing Product Images...");
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  let prodUpdated = 0;
  let varUpdated = 0;

  for (const p of products) {
    const catSlug = p.categorySlug || "";
    const categoryFallback = CATEGORY_IMAGE_MAP[catSlug] || "/images/categories/cat-tiles-stone.jpg";

    let imagesChanged = false;
    let validImages: string[] = [];

    if (Array.isArray(p.images) && p.images.length > 0) {
      for (const img of p.images) {
        if (typeof img === "string" && img.startsWith("/images/")) {
          const fullPath = path.join(publicDir, img);
          if (fs.existsSync(fullPath)) {
            validImages.push(img);
          } else {
            imagesChanged = true;
          }
        } else {
          imagesChanged = true;
        }
      }
    } else {
      imagesChanged = true;
    }

    if (validImages.length === 0) {
      validImages = [categoryFallback];
      imagesChanged = true;
    }

    if (imagesChanged) {
      await prisma.product.update({
        where: { id: p.id },
        data: { images: validImages },
      });
      prodUpdated++;
    }

    // Fix variants for this product
    for (const v of p.variants) {
      let vImg = v.image;
      const vPath = vImg && vImg.startsWith("/images/") ? path.join(publicDir, vImg) : "";
      const isVMissing = !vImg || !vPath || !fs.existsSync(vPath) || vImg.includes("placeholder");

      if (isVMissing) {
        const replacement = validImages[0] || categoryFallback;
        await prisma.productVariant.update({
          where: { id: v.id },
          data: {
            image: replacement,
            images: [replacement],
          },
        });
        varUpdated++;
      }
    }
  }

  console.log(`Total products updated with verified images: ${prodUpdated}/${products.length}`);
  console.log(`Total variants updated with verified images: ${varUpdated}`);

  console.log("\n==================================================");
  console.log("🎉 ALL IMAGES AUDITED, VERIFIED, AND FIXED!");
  console.log("==================================================");
}

fixAllImages()
  .catch((e) => {
    console.error("Error fixing images:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
