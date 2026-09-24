import { prisma } from "../lib/prisma";
import { cloudinary } from "../lib/cloudinary";

async function main() {
  console.log("Checking Cloudinary connection...");
  const ping = await cloudinary.api.ping();
  console.log("Cloudinary ping status:", ping);

  try {
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories in Database.`);

    const products = await prisma.product.findMany({
      select: { id: true, title: true, images: true, image: true },
      take: 10
    });
    console.log(`Sample ${products.length} products found in Database.`);
  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
