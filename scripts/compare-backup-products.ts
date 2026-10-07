import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== COMPARING BACKUP 2026-09-24 WITH LIVE DATABASE ===");
  const backupProductsPath = path.resolve(process.cwd(), "backups", "db-2026-09-24T12-25-54-019Z", "products.json");
  const backupProducts: any[] = JSON.parse(fs.readFileSync(backupProductsPath, "utf8"));
  console.log(`Backup contains ${backupProducts.length} products.`);

  const nullInBackup = backupProducts.filter((p) => !p.vendorId);
  console.log(`In 2026-09-24 backup, ${nullInBackup.length} products had null vendorId.`);
  for (const p of nullInBackup) {
    console.log(`  - [${p.id}] "${p.name}" (vendorId: ${p.vendorId})`);
  }

  // Map of backup products by id and by slug
  const backupById = new Map<string, any>();
  const backupBySlug = new Map<string, any>();
  for (const bp of backupProducts) {
    backupById.set(bp.id, bp);
    backupBySlug.set(bp.slug, bp);
  }

  console.log("\n--- Checking Live Products against 2026-09-24 Backup ---");
  for (const lp of liveProducts) {
    const matchedById = backupById.get(lp.id);
    const matchedBySlug = backupBySlug.get(lp.slug);

    if (matchedById) {
      if (matchedById.vendorId !== lp.vendorId) {
        console.log(`[VENDOR MISMATCH ID] ${lp.id} ("${lp.name}"): Live vendorId='${lp.vendorId}' (${lp.vendor?.businessName}) vs Backup vendorId='${matchedById.vendorId}'`);
      }
    } else if (matchedBySlug) {
      if (matchedBySlug.vendorId !== lp.vendorId) {
        console.log(`[VENDOR MISMATCH SLUG] ${lp.id} ("${lp.name}"): Live vendorId='${lp.vendorId}' (${lp.vendor?.businessName}) vs Backup vendorId='${matchedBySlug.vendorId}'`);
      }
    } else {
      console.log(`[NEW ITEM (NOT IN 09-24 BACKUP)] ${lp.id} ("${lp.name}") | Live vendorId='${lp.vendorId}' (${lp.vendor?.businessName}) | Created: ${lp.createdAt.toISOString()}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
