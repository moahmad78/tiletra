import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const PRODUCT_IMAGE_FALLBACK_MAP: Record<string, string> = {
  "epoxy-grout-1-kg-1777": "/images/products/prod-roff-t34-starlike-epoxy-tile-grout-5kg-5672-0.webp",
  "tile-adhesive-nsa-145-white-20kg-6378": "/images/products/prod-roff-t09-nsa-tile-adhesive-white-20-kg-bag-7370-0.webp",
  "tile-adhesive-nsa-125-white-20kg-6335": "/images/products/prod-roff-t06-vfa-tile-adhesive-white-20-kg-bag-6-off-5862-0.webp",
  "tile-adhesive-nsa-105-white-20kg-3001": "/images/products/prod-roff-t04-vfa-tile-adhesive-white-20-kg-bag-6-off-3696-0.webp",
  "tile-adhesive-nsa-95-grey-20kg-7969": "/images/products/prod-roff-t07-extrofix-tile-adhesive-grey-20-kg-bag-8541-0.webp",
  "tile-adhesive-nsa-75-grey-20kg-1481": "/images/products/prod-roff-t03-0387-0.webp",
  "tile-adhesive-nsa-55-grey-20-kg-7585": "/images/products/prod-roff-t02-4843-0.webp",
  "tile-adhesive-nsa-45-grey-20-kg-3159": "/images/products/prod-roff-t01-9984-0.webp",
  "tile-adhesive-nas-35-grey-20-kg-8350": "/images/products/prod-roff-t01-9984-0.webp",
  "adhesive-nsa-15-grey-20kg-8922": "/images/products/prod-roff-t01-9984-0.webp",
};

let uploadedFileNames = new Set<string>();

function checkFileExists(imgUrl: string): boolean {
  if (!imgUrl || typeof imgUrl !== "string") return false;
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) return true;
  if (imgUrl.startsWith("data:image")) return true;

  if (imgUrl.startsWith("/images/")) {
    const diskPath = path.join(PUBLIC_DIR, imgUrl);
    return fs.existsSync(diskPath);
  }

  if (imgUrl.startsWith("/api/uploads/") || imgUrl.startsWith("/uploads/")) {
    const filename = path.basename(imgUrl);
    const diskPath = path.join(PUBLIC_DIR, "uploads", filename);
    if (fs.existsSync(diskPath)) return true;

    // Check Neon DB in-memory set
    return uploadedFileNames.has(filename);
  }

  return false;
}

async function main() {
  const applyHeal = process.argv.includes("--apply") || process.argv.includes("--heal");

  console.log("=== INTRIHUB CPO & CATALOG IMAGE MIGRATION AUDIT ===");
  console.log(`Mode: ${applyHeal ? "APPLY / REPAIR" : "DRY-RUN AUDIT"}\n`);

  const [dbFiles, products] = await Promise.all([
    prisma.uploadedFile.findMany({ select: { fileName: true } }),
    prisma.product.findMany({
      include: {
        vendor: { select: { id: true, businessName: true } },
        variants: { select: { id: true, size: true, color: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  uploadedFileNames = new Set(dbFiles.map((f) => f.fileName));
  console.log(`Loaded ${dbFiles.length} uploaded files in Neon DB.`);

  const missingImageProducts: any[] = [];
  const normalizedProducts: any[] = [];
  const repairedProducts: any[] = [];

  for (const prod of products) {
    let images = Array.isArray(prod.images) ? [...prod.images] : [];

    // Filter out placeholders and empty strings
    const cleanedImages = images.filter(
      (img) => img && typeof img === "string" && img.trim() && img !== "/placeholders/product.svg" && !img.includes("placeholder")
    );

    const isMissing = cleanedImages.length === 0;

    // Verify existing images exist
    const missingFiles: string[] = [];
    for (const img of cleanedImages) {
      const exists = await checkFileExists(img);
      if (!exists) {
        missingFiles.push(img);
      }
    }

    if (isMissing || missingFiles.length > 0) {
      missingImageProducts.push({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categorySlug: prod.categorySlug,
        vendorId: prod.vendorId,
        vendorName: prod.vendor?.businessName || "Unknown",
        currentImages: prod.images,
        missingFiles,
      });
    }

    if (cleanedImages.length !== images.length) {
      normalizedProducts.push({
        id: prod.id,
        name: prod.name,
        before: images,
        after: cleanedImages,
      });
    }

    const needsHeal = cleanedImages.length === 0 && Boolean(PRODUCT_IMAGE_FALLBACK_MAP[prod.slug]);
    const needsNormalize = cleanedImages.length !== images.length;

    // Auto-heal / update if requested and needed
    if (applyHeal && (needsHeal || needsNormalize)) {
      let finalImages = [...cleanedImages];
      if (needsHeal) {
        finalImages = [PRODUCT_IMAGE_FALLBACK_MAP[prod.slug]];
        repairedProducts.push({
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          repairedImage: PRODUCT_IMAGE_FALLBACK_MAP[prod.slug],
        });
      }

      console.log(`[UPDATING ${repairedProducts.length + normalizedProducts.length}] ${prod.name} -> ${finalImages.length} images`);

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          images: finalImages,
          variants: finalImages[0]
            ? {
                updateMany: {
                  where: {
                    OR: [
                      { image: null },
                      { image: "" },
                      { image: "/placeholders/product.svg" },
                    ],
                  },
                  data: {
                    image: finalImages[0],
                  },
                },
              }
            : undefined,
        },
      });
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalProductsChecked: products.length,
    productsNormalized: normalizedProducts.length,
    productsRepaired: repairedProducts.length,
    productsWithMissingImages: missingImageProducts,
  };

  const reportPath = path.resolve(process.cwd(), "scripts", "image-migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Total Products Audited: ${products.length}`);
  console.log(`Products with Missing/Broken Images: ${missingImageProducts.length}`);
  console.log(`Products Normalized: ${normalizedProducts.length}`);
  if (applyHeal) {
    console.log(`Products Successfully Repaired in DB: ${repairedProducts.length}`);
  }
  console.log(`\nReport written to: ${reportPath}`);
}

main()
  .catch((e) => console.error("Migration error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
