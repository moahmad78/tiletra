import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.uploadedFile.count();
  console.log(`UploadedFile rows in DB: ${count}`);
  const files = await prisma.uploadedFile.findMany({
    select: { fileName: true, mimeType: true, sizeBytes: true },
    take: 20
  });
  console.log("Sample files in UploadedFile:", files);
}

main().catch(console.error).finally(() => prisma.$disconnect());
