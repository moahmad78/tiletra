import { prisma } from "../lib/prisma";

async function verify() {
  const count = await (prisma as any).uploadedFile.count();
  console.log(`Total Uploaded Files in Neon Cloud Database: ${count}`);

  const sample = await (prisma as any).uploadedFile.findFirst({
    where: { fileName: { contains: "c885894d4df6bade975851379d9dbb65" } },
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true },
  });

  console.log("Sample image verified in DB:", sample);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
