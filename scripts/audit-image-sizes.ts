import { prisma } from "../lib/prisma";
import { categories } from "../lib/data/categories";

async function main() {
  console.log("=== 1. AUDITING UPLOADED FILES IN DATABASE ===");
  const uploadedFiles = await prisma.uploadedFile.findMany({
    select: { fileName: true, mimeType: true, sizeBytes: true }
  });

  let totalUploadedBytes = 0;
  let maxUploadedFile = { fileName: "", sizeBytes: 0, mimeType: "" };
  let sizesList: number[] = [];

  for (const f of uploadedFiles) {
    totalUploadedBytes += f.sizeBytes;
    sizesList.push(f.sizeBytes);
    if (f.sizeBytes > maxUploadedFile.sizeBytes) {
      maxUploadedFile = f;
    }
  }

  const avgUploadedKB = uploadedFiles.length > 0 ? (totalUploadedBytes / uploadedFiles.length / 1024).toFixed(1) : "0";
  const maxUploadedKB = (maxUploadedFile.sizeBytes / 1024).toFixed(1);

  console.log(`Total Uploaded Files: ${uploadedFiles.length}`);
  console.log(`Average Uploaded File Size: ${avgUploadedKB} KB`);
  console.log(`Largest Uploaded File: ${maxUploadedFile.fileName} (${maxUploadedKB} KB, ${maxUploadedFile.mimeType})`);

  // Breakdown by size brackets
  const over500KB = uploadedFiles.filter(f => f.sizeBytes > 500 * 1024);
  const over1MB = uploadedFiles.filter(f => f.sizeBytes > 1024 * 1024);
  console.log(`Files > 500 KB: ${over500KB.length}`);
  console.log(`Files > 1 MB: ${over1MB.length}`);

  console.log("\n=== 2. AUDITING PRODUCT IMAGES ===");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true }
  });

  console.log(`Total Products: ${products.length}`);
  let totalImagesCount = 0;
  for (const p of products) {
    totalImagesCount += p.images.length;
  }
  console.log(`Total Product Images assigned: ${totalImagesCount}`);

  console.log("\n=== 3. AUDITING BANNERS ===");
  const banners = await prisma.offerBanner.findMany();
  console.log(`Total Offer Banners: ${banners.length}`);
  for (const b of banners) {
    console.log(` - "${b.title}": ${b.image}`);
  }

  console.log("\n=== 4. AUDITING CATEGORY IMAGES ===");
  console.log(`Total Curated Categories: ${categories.length}`);
  for (const c of categories.slice(0, 5)) {
    console.log(` - "${c.name}": ${c.image}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
