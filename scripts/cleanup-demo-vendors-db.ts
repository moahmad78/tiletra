import { prisma } from "../lib/prisma";
import { deleteVendor } from "../lib/actions/admin-vendor";

async function cleanupDemoVendors() {
  console.log("==========================================================================");
  console.log("AUDITING & CLEANING ALL DEMO / FAKE VENDORS IN POSTGRES DATABASE");
  console.log("==========================================================================");

  // Search for any fake/demo vendor names or IDs
  const demoVendors = await prisma.vendor.findMany({
    where: {
      OR: [
        { id: { in: ["vnd-001", "vnd-002", "vnd-003"] } },
        { businessName: { contains: "Sri Balaji", mode: "insensitive" } },
        { businessName: { contains: "Royal Ceramics", mode: "insensitive" } },
        { businessName: { contains: "Apex Plumbing", mode: "insensitive" } },
        { businessName: { contains: "Rival Vendor", mode: "insensitive" } },
        { businessName: { contains: "Test Apex", mode: "insensitive" } },
        { contactEmail: { contains: "@example.com", mode: "insensitive" } },
        { contactEmail: { contains: "balaji.electricals@intrihub.com", mode: "insensitive" } },
        { contactEmail: { contains: "royal.ceramics@intrihub.com", mode: "insensitive" } },
        { contactEmail: { contains: "apex.plumbing@intrihub.com", mode: "insensitive" } },
      ],
    },
    include: { products: true, owner: true },
  });

  console.log(`Found ${demoVendors.length} demo/fake vendor(s) in DB to clean.`);

  for (const v of demoVendors) {
    console.log(`- Deleting demo vendor: "${v.businessName}" (ID: ${v.id}, Phone: ${v.contactPhone})`);
    const res = await deleteVendor(v.id);
    console.log(`  Result: ${res.success ? "Deleted ✓" : `Error: ${res.error}`}`);
  }

  // Also check for any dangling demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: ["usr-vnd-001", "usr-vnd-002", "usr-vnd-003"] } },
        { email: { in: ["balaji.electricals@intrihub.com", "royal.ceramics@intrihub.com", "apex.plumbing@intrihub.com"] } },
        { phone: { in: ["9845012345", "9876543210", "9123456780"] } },
      ],
    },
  });

  console.log(`Found ${demoUsers.length} dangling demo user(s) in DB.`);
  for (const u of demoUsers) {
    console.log(`- Deleting demo user: "${u.name || u.email || u.phone}" (ID: ${u.id})`);
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  }

  // List all remaining legitimate vendors
  const remainingVendors = await prisma.vendor.findMany({
    include: { owner: true, products: true },
  });

  console.log("\n==========================================================================");
  console.log(`ACTIVE REAL VENDORS REMAINING IN DB: ${remainingVendors.length}`);
  remainingVendors.forEach((v, idx) => {
    console.log(`  ${idx + 1}. [${v.id}] ${v.businessName} (Status: ${v.status}, Phone: ${v.contactPhone}, Products: ${v.products.length})`);
  });
  console.log("==========================================================================");
}

cleanupDemoVendors()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
