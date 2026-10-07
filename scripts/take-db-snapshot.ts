import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function createDatabaseSnapshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotName = `snapshot-pre-recovery-${timestamp}`;
  const backupDir = path.resolve(process.cwd(), "backups", snapshotName);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`📦 Taking Full Database Snapshot: ${snapshotName}`);
  console.log(`Directory: ${backupDir}\n`);

  const [
    products,
    productVariants,
    productAttributes,
    priceTiers,
    vendors,
    users,
    impersonationSessions,
    adminAuditLogs,
    orders,
    orderItems,
    categories,
    uploadedFiles,
  ] = await Promise.all([
    prisma.product.findMany({ include: { variants: true, attributes: true, priceTiers: true } }),
    prisma.productVariant.findMany(),
    prisma.productAttribute.findMany(),
    prisma.priceTier.findMany(),
    prisma.vendor.findMany({ include: { owner: true } }),
    prisma.user.findMany(),
    prisma.impersonationSession.findMany(),
    prisma.adminAuditLog.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.category.findMany(),
    (prisma as any).uploadedFile.findMany({ select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } }),
  ]);

  fs.writeFileSync(path.join(backupDir, "products.json"), JSON.stringify(products, null, 2));
  fs.writeFileSync(path.join(backupDir, "product_variants.json"), JSON.stringify(productVariants, null, 2));
  fs.writeFileSync(path.join(backupDir, "product_attributes.json"), JSON.stringify(productAttributes, null, 2));
  fs.writeFileSync(path.join(backupDir, "price_tiers.json"), JSON.stringify(priceTiers, null, 2));
  fs.writeFileSync(path.join(backupDir, "vendors.json"), JSON.stringify(vendors, null, 2));
  fs.writeFileSync(path.join(backupDir, "users.json"), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(backupDir, "impersonation_sessions.json"), JSON.stringify(impersonationSessions, null, 2));
  fs.writeFileSync(path.join(backupDir, "admin_audit_logs.json"), JSON.stringify(adminAuditLogs, null, 2));
  fs.writeFileSync(path.join(backupDir, "orders.json"), JSON.stringify(orders, null, 2));
  fs.writeFileSync(path.join(backupDir, "order_items.json"), JSON.stringify(orderItems, null, 2));
  fs.writeFileSync(path.join(backupDir, "categories.json"), JSON.stringify(categories, null, 2));
  fs.writeFileSync(path.join(backupDir, "uploaded_files_summary.json"), JSON.stringify(uploadedFiles, null, 2));

  // Write metadata manifest
  const manifest = {
    snapshotName,
    createdAt: new Date().toISOString(),
    counts: {
      products: products.length,
      productVariants: productVariants.length,
      productAttributes: productAttributes.length,
      priceTiers: priceTiers.length,
      vendors: vendors.length,
      users: users.length,
      impersonationSessions: impersonationSessions.length,
      adminAuditLogs: adminAuditLogs.length,
      orders: orders.length,
      orderItems: orderItems.length,
      categories: categories.length,
      uploadedFiles: uploadedFiles.length,
    },
  };
  fs.writeFileSync(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("✅ Snapshot successfully created with manifest:");
  console.log(JSON.stringify(manifest, null, 2));
  return snapshotName;
}

createDatabaseSnapshot()
  .catch((e) => {
    console.error("Snapshot error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
