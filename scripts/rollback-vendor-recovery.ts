import { PrismaClient } from "@prisma/client";
import { RECOVERY_ITEMS } from "./apply-vendor-recovery";

const prisma = new PrismaClient();

async function rollbackRecovery() {
  const isExecutionApproved = process.argv.includes("--execute");

  if (!isExecutionApproved) {
    console.log("🛑 DRY-RUN MODE: Use --execute to commit rollback.");
    console.log(`Plan: Rollback ${RECOVERY_ITEMS.length} products to their previous vendorId (RAY ENTERPRISES / gruton).`);
    return;
  }

  console.log("⏪ EXECUTING ROLLBACK IN A SINGLE DATABASE TRANSACTION...");

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No admin user found to record rollback audit logs.");
  }

  const results = await prisma.$transaction(async (tx) => {
    const rolledBackList = [];

    for (const item of RECOVERY_ITEMS) {
      const updated = await tx.product.update({
        where: { id: item.id },
        data: {
          vendorId: item.fromVendorId,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          vendorId: item.fromVendorId,
          action: "ROLLBACK_VENDOR_CORRECTION",
          entity: "Product",
          entityId: item.id,
          actorRole: "SYSTEM",
          before: { vendorId: item.toVendorId, vendorName: "Tiletra" },
          after: { vendorId: item.fromVendorId, vendorName: "gruton / RAY ENTERPRISES" },
        },
      });

      rolledBackList.push({ id: updated.id, name: updated.name, vendorId: updated.vendorId });
    }

    return rolledBackList;
  });

  console.log(`✅ Rollback committed successfully! ${results.length} products restored.`);
}

rollbackRecovery()
  .catch((e) => {
    console.error("❌ Rollback failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
