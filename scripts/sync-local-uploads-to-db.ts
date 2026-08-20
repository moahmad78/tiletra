import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import sharp from "sharp";

async function syncDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  console.log(`\nScanning ${dirPath} (${files.length} items)...`);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"].includes(ext);
    if (!isImage) continue;

    const rawBuffer = fs.readFileSync(fullPath);
    let processedBuffer = rawBuffer;
    let mimeType =
      ext === ".webp"
        ? "image/webp"
        : ext === ".png"
        ? "image/png"
        : ext === ".svg"
        ? "image/svg+xml"
        : ext === ".gif"
        ? "image/gif"
        : "image/jpeg";

    if (ext !== ".svg" && ext !== ".ico") {
      try {
        processedBuffer = await sharp(rawBuffer)
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .toBuffer();
      } catch (err) {
        // Keep rawBuffer if sharp resize isn't supported
        processedBuffer = rawBuffer;
      }
    }

    const base64Data = processedBuffer.toString("base64");

    const record = await (prisma as any).uploadedFile.upsert({
      where: { fileName: file },
      update: {
        mimeType,
        dataBase64: base64Data,
        sizeBytes: processedBuffer.length,
      },
      create: {
        fileName: file,
        mimeType,
        dataBase64: base64Data,
        sizeBytes: processedBuffer.length,
      },
    });

    console.log(`✅ Synced to Neon Cloud DB: ${file} (${Math.round(processedBuffer.length / 1024)} KB) -> DB ID: ${record.id}`);
  }
}

async function main() {
  console.log("🚀 Starting Cloud Database Image Sync...");
  
  // 1. Sync public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await syncDirectory(uploadsDir);

  // 2. Sync public/placeholders
  const placeholdersDir = path.join(process.cwd(), "public", "placeholders");
  await syncDirectory(placeholdersDir);

  // 3. Sync public/logo
  const logoDir = path.join(process.cwd(), "public", "logo");
  await syncDirectory(logoDir);

  console.log("\n🎉 All local images have been permanently synced to Neon PostgreSQL Cloud Database!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
