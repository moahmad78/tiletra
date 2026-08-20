import { prisma } from "../lib/prisma";

async function main() {
  console.log("Upgrading product images in Neon Cloud Database...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  for (const p of products) {
    console.log(`\nProcessing product: ${p.name} (${p.id})`);
    const newImages: string[] = [];

    for (const img of p.images) {
      if (img.startsWith("data:")) {
        newImages.push(img);
        continue;
      }

      const fileName = img.split("/").pop() || "";
      const dbFile = await (prisma as any).uploadedFile.findUnique({
        where: { fileName },
      });

      if (dbFile && dbFile.dataBase64) {
        // Embed the direct high-res data URI directly into the product record in Neon DB
        const dataUri = `data:${dbFile.mimeType || "image/webp"};base64,${dbFile.dataBase64}`;
        newImages.push(dataUri);
        console.log(`✅ Embedded permanent Data URI for ${fileName} (${Math.round(dbFile.sizeBytes / 1024)} KB)`);
      } else {
        newImages.push(img);
      }
    }

    if (newImages.length > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: { images: newImages },
      });
      console.log(`💾 Successfully updated product "${p.name}" in Neon DB with direct permanent cloud media!`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
