const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== VENDORS & ASSOCIATED USER TOKENS ===");
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      businessName: true,
      contactPhone: true,
      status: true,
      ownerId: true,
    }
  });

  for (const v of vendors) {
    const owner = await prisma.user.findUnique({
      where: { id: v.ownerId },
      select: { id: true, name: true, phone: true, email: true, role: true, pushToken: true }
    });

    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId: v.ownerId },
      select: { token: true, role: true, platform: true, updatedAt: true }
    });

    console.log(`\nVendor: ${v.businessName} (ID: ${v.id}) [Status: ${v.status}]`);
    console.log(`  Owner: ${owner?.name || "N/A"} (${owner?.phone || "No phone"}, ${owner?.email || "No email"}, role: ${owner?.role})`);
    console.log(`  User.pushToken: ${owner?.pushToken ? owner.pushToken.slice(0, 22) + "..." : "NONE"}`);
    console.log(`  DeviceTokens (${deviceTokens.length}):`);
    deviceTokens.forEach((dt, i) => {
      console.log(`    ${i+1}. [${dt.platform}] ${dt.token.slice(0, 25)}... (role: ${dt.role}, updated: ${dt.updatedAt.toISOString()})`);
    });
  }

  console.log("\n=== RECENT DEVICE TOKENS (ALL ROLES) ===");
  const allRecent = await prisma.deviceToken.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true, role: true }
      }
    }
  });
  allRecent.forEach((dt, i) => {
    console.log(`${i+1}. User: ${dt.user?.name || "Unknown"} (${dt.user?.phone || dt.userId}) [Role: ${dt.role}/${dt.user?.role}] Platform: ${dt.platform} Token: ${dt.token.slice(0, 25)}... Updated: ${dt.updatedAt.toISOString()}`);
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
