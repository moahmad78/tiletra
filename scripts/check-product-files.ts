import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true }
  });

  console.log(`Checking ${products.length} products...`);
  let onDisk = 0;
  let inDb = 0;
  let missing = 0;

  for (const p of products) {
    for (const img of p.images) {
      if (img.startsWith("/api/uploads/")) {
        const filename = img.replace("/api/uploads/", "");
        const localPath = path.resolve(process.cwd(), "public", "uploads", filename);
        const existsDisk = fs.existsSync(localPath);
        
        let existsDb = false;
        try {
          const dbFile = await (prisma as any).uploadedFile.findUnique({
            where: { fileName: filename },
            select: { id: true, dataBase64: true }
          });
          existsDb = !!(dbFile && dbFile.dataBase64);
        } catch (e) {
          // ignore
        }

        if (existsDisk) onDisk++;
        else if (existsDb) inDb++;
        else {
          missing++;
          console.log(`MISSING IMAGE: product "${p.name}" (${p.id}) -> ${img}`);
        }
      }
    }
  }

  console.log(`\nResults: OnDisk=${onDisk}, InDB=${inDb}, Missing=${missing}`);

  // Also check if uploadedFile has entries
  try {
    const totalDbFiles = await (prisma as any).uploadedFile.count();
    console.log(`Total rows in uploadedFile table: ${totalDbFiles}`);
  } catch (e: any) {
    console.log("Could not count uploadedFile:", e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
