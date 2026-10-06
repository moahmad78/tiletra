import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING ALL PRODUCTS WITH MISSING/PLACEHOLDER IMAGES ===");
  const products = await prisma.product.findMany({
    include: {
      vendor: {
        select: { id: true, businessName: true, status: true },
      },
      variants: {
        select: { id: true, sku: true, size: true, color: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const broken: any[] = [];
  for (const prod of products) {
    const isMissing =
      !prod.images ||
      prod.images.length === 0 ||
      prod.images.every((img) => !img || img === "/placeholders/product.svg" || img.includes("placeholder"));

    if (isMissing) {
      broken.push({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categorySlug: prod.categorySlug,
        vendorId: prod.vendorId,
        vendorName: prod.vendor?.businessName,
        images: prod.images,
        createdByCpoId: prod.createdByCpoId,
        createdByAdminId: prod.createdByAdminId,
        variantCount: prod.variants.length,
      });
    }
  }

  console.log(`Total Products: ${products.length}`);
  console.log(`Total Broken/Placeholder Products: ${broken.length}`);
  console.log(JSON.stringify(broken, null, 2));

  const uploadedFiles = await prisma.uploadedFile.findMany({
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
  });
  console.log(`\nTotal UploadedFiles in DB: ${uploadedFiles.length}`);
  console.log(JSON.stringify(uploadedFiles.slice(0, 10), null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
