import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// The 10 products to be moved from RAY ENTERPRISES (gruton) to Tiletra
export const RECOVERY_ITEMS = [
  { id: "cmuwa76gn0001le04zivxir7f", name: "ADHESIVE NSA-15 (grey) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwbc3ry0001jt04le41ti1i", name: "TILE ADHESIVE NAS-35 (grey) 20 KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwbhztj0001l804ml1jpdbh", name: "TILE ADHESIVE NSA-45 (grey) 20 KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwbsdm70001l70476vqmjiv", name: "TILE ADHESIVE NSA-55 (grey) 20 KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwbygo70001l7049xyesflq", name: "TILE ADHESIVE NSA-75 (grey) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwc816n0001kt04uxduivvl", name: "TILE ADHESIVE NSA-95 (grey) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuwe687c0001lh047utazxyy", name: "TILE ADHESIVE NSA-105 (white) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuweasto0006kt04q59nb75z", name: "TILE ADHESIVE NSA-125 (white) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuweenqt000bkt04ae3hwkea", name: "TILE ADHESIVE NSA-145 (white) 20KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
  { id: "cmuweva1d0001l704933t3ugc", name: "EPOXY GROUT 1 KG", fromVendorId: "cmuur1wni0002l2046yft2c96", toVendorId: "cmt1fsk96000c1pr8uyb3dho0" },
];

async function applyRecovery() {
  const isExecutionApproved = process.argv.includes("--execute");

  if (!isExecutionApproved) {
    console.log("🛑 DRY-RUN MODE: Final list before execution:");
    for (let i = 0; i < RECOVERY_ITEMS.length; i++) {
      const it = RECOVERY_ITEMS[i];
      const p = await prisma.product.findUnique({
        where: { id: it.id },
        select: { id: true, name: true, vendorId: true, vendor: { select: { businessName: true } } },
      });
      console.log(`${i + 1}. [${it.id}] "${it.name}"`);
      console.log(`   Current in DB: vendorId=${p?.vendorId} (${p?.vendor?.businessName || "None"})`);
      console.log(`   Target in DB : vendorId=${it.toVendorId} (Tiletra)`);
    }

    // Verify non-targeted products
    const [nullCount, sanviCount] = await Promise.all([
      prisma.product.count({ where: { vendorId: null } }),
      prisma.product.count({ where: { vendorId: "cmus17mfn0004lb04aiyua66m" } }),
    ]);
    console.log(`\nIsolation check:`);
    console.log(`- Null-vendor products: ${nullCount} (WILL NOT BE TOUCHED)`);
    console.log(`- Sanvi Interiors products: ${sanviCount} (WILL NOT BE TOUCHED)`);
    console.log(`- RAY ENTERPRISES items to recover: ${RECOVERY_ITEMS.length}`);
    return;
  }

  console.log("🚀 EXECUTING VENDOR RECOVERY IN A SINGLE DATABASE TRANSACTION...");

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  });
  if (!admin) {
    throw new Error("No admin user found to record audit logs.");
  }

  // Pre-fetch all products outside transaction to eliminate round trips
  const existingProducts = await prisma.product.findMany({
    where: { id: { in: RECOVERY_ITEMS.map((i) => i.id) } },
    select: { id: true, name: true, vendorId: true, editHistory: true },
  });
  const existingMap = new Map(existingProducts.map((p) => [p.id, p]));

  const results = await prisma.$transaction(
    async (tx) => {
      const updatedList = [];

      for (const item of RECOVERY_ITEMS) {
        const existing = existingMap.get(item.id);
        if (!existing) {
          throw new Error(`Product ${item.id} not found!`);
        }

        const prevHistory = Array.isArray(existing.editHistory) ? existing.editHistory : [];
        const historyEntry = {
          timestamp: new Date().toISOString(),
          role: "SYSTEM",
          userId: admin.id,
          action: "RECOVERED_VENDOR_ID",
          changes: ["vendorId"],
          before: { vendorId: existing.vendorId },
          after: { vendorId: item.toVendorId },
        };

        // Update Product
        const updated = await tx.product.update({
          where: { id: item.id },
          data: {
            vendorId: item.toVendorId,
            editHistory: [...prevHistory, historyEntry],
          },
        });

        // Write AdminAuditLog entry
        await tx.adminAuditLog.create({
          data: {
            adminId: admin.id,
            vendorId: item.toVendorId,
            action: "RECOVER_VENDOR_CORRECTION",
            entity: "Product",
            entityId: item.id,
            actorRole: "SYSTEM",
            before: { vendorId: existing.vendorId, vendorName: "gruton / RAY ENTERPRISES" },
            after: { vendorId: item.toVendorId, vendorName: "Tiletra" },
          },
        });

        updatedList.push({ id: updated.id, name: updated.name, vendorId: updated.vendorId });
      }

      return updatedList;
    },
    { maxWait: 20000, timeout: 60000 }
  );

  console.log(`✅ Transaction committed successfully! ${results.length} products updated.`);
  const logPath = path.resolve(process.cwd(), "backups", `recovery-execution-log-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Log saved to: ${logPath}`);
}

applyRecovery()
  .catch((e) => {
    console.error("❌ Recovery transaction failed and rolled back:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
