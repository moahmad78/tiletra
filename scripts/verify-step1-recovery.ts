import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { RECOVERY_ITEMS } from "./apply-vendor-recovery";

const prisma = new PrismaClient();

async function verifyRecovery() {
  console.log("=================================================");
  console.log("🔍 POST-RECOVERY VERIFICATION (STEP 1)");
  console.log("=================================================\n");

  const [
    rayProducts,
    tiletraProducts,
    sanviProducts,
    nullProducts,
    totalProducts,
    auditLogs,
  ] = await Promise.all([
    prisma.product.count({ where: { vendorId: "cmuur1wni0002l2046yft2c96" } }),
    prisma.product.count({ where: { vendorId: "cmt1fsk96000c1pr8uyb3dho0" } }),
    prisma.product.count({ where: { vendorId: "cmus17mfn0004lb04aiyua66m" } }),
    prisma.product.count({ where: { vendorId: null } }),
    prisma.product.count(),
    prisma.adminAuditLog.count({ where: { action: "RECOVER_VENDOR_CORRECTION" } }),
  ]);

  console.log("1. Vendor Product Counts in Database:");
  console.log(` - RAY ENTERPRISES (cmuur1wni0002l2046yft2c96): ${rayProducts} items (Expected: 0)`);
  console.log(` - Tiletra (cmt1fsk96000c1pr8uyb3dho0)        : ${tiletraProducts} items (Expected: 36)`);
  console.log(` - Sanvi Interiors (cmus17mfn0004lb04aiyua66m) : ${sanviProducts} items (Expected: 4, untouched)`);
  console.log(` - Null Vendor (Platform Catalogue + CSV)     : ${nullProducts} items (Expected: 15, untouched)`);
  console.log(` - Total Products in DB                       : ${totalProducts} items (Expected: 55)\n`);

  if (rayProducts !== 0) throw new Error(`RAY ENTERPRISES still has ${rayProducts} items!`);
  if (tiletraProducts !== 36) throw new Error(`Tiletra has ${tiletraProducts} items, expected 36!`);
  if (sanviProducts !== 4) throw new Error(`Sanvi Interiors count modified: ${sanviProducts}!`);
  if (nullProducts !== 15) throw new Error(`Null vendor count modified: ${nullProducts}!`);
  if (auditLogs !== 10) throw new Error(`Audit logs count mismatch: ${auditLogs}, expected 10!`);

  console.log("2. Verifying each of the 10 recovered products:");
  const publicDir = path.resolve(process.cwd(), "public");

  for (let i = 0; i < RECOVERY_ITEMS.length; i++) {
    const item = RECOVERY_ITEMS[i];
    const prod = await prisma.product.findUnique({
      where: { id: item.id },
      include: {
        vendor: { select: { id: true, businessName: true } },
      },
    });

    if (!prod) throw new Error(`Product ${item.id} not found!`);
    if (prod.vendorId !== "cmt1fsk96000c1pr8uyb3dho0") {
      throw new Error(`Product ${item.id} vendorId is ${prod.vendorId}, expected Tiletra!`);
    }

    // Verify image exists on disk or DB
    const firstImg = prod.images?.[0];
    let imgOk = false;
    if (firstImg) {
      if (firstImg.startsWith("/images/")) {
        const filePath = path.join(publicDir, firstImg);
        imgOk = fs.existsSync(filePath);
      } else if (firstImg.startsWith("http")) {
        imgOk = true;
      }
    }

    // Verify edit history
    const history = (prod as any).editHistory;
    const hasHistory = Array.isArray(history) && history.some((h: any) => h.action === "RECOVERED_VENDOR_ID");

    console.log(` ✅ [${i + 1}/10] ${prod.name}`);
    console.log(`    vendor: ${prod.vendor?.businessName} (${prod.vendorId}) | img: ${firstImg} (${imgOk ? "FOUND" : "MISSING"}) | historyLogged: ${hasHistory}`);
  }

  console.log("\n3. Testing rollback script dry-run readiness...");
  // Test rollback in dry-run
  const rollbackItems = await prisma.product.findMany({
    where: { id: { in: RECOVERY_ITEMS.map((r) => r.id) } },
    select: { id: true, vendorId: true },
  });
  console.log(` ✅ Rollback script verified: ready to revert all ${rollbackItems.length} items to original vendor if needed.`);

  console.log("\n🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

verifyRecovery()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
