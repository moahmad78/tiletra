import { prisma } from "../lib/prisma";
import { uploadToCloudinary } from "../lib/cloudinary";

async function main() {
  console.log("Checking Offer Banners in DB...");
  const banners = await prisma.offerBanner.findMany();
  console.log(`Found ${banners.length} offer banners.`);

  let updated = 0;
  for (const b of banners) {
    if (b.imageUrl && !b.imageUrl.includes("res.cloudinary.com")) {
      try {
        let uploadSource = b.imageUrl;
        if (b.imageUrl.startsWith("/api/uploads/")) {
          const fileName = b.imageUrl.split("/").pop();
          const dbFile = await (prisma as any).uploadedFile.findUnique({ where: { fileName } });
          if (dbFile?.dataBase64) {
            uploadSource = `data:${dbFile.mimeType || "image/webp"};base64,${dbFile.dataBase64}`;
          }
        }
        const res = await uploadToCloudinary(uploadSource, "intrihub/banners", `banner-${b.id}`);
        if (res?.secure_url) {
          await prisma.offerBanner.update({
            where: { id: b.id },
            data: { imageUrl: res.secure_url }
          });
          console.log(`✅ Banner [${b.title}] updated to Cloudinary: ${res.secure_url}`);
          updated++;
        }
      } catch (err: any) {
        console.warn(`Failed to migrate banner ${b.id}:`, err.message || err);
      }
    }
  }
  console.log(`Finished banners. Updated: ${updated}/${banners.length}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
