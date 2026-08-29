import { prisma } from "../lib/prisma";

async function inspectAndCleanStrayUsers() {
  console.log("=== Inspecting Users in Database ===");
  const allUsers = await prisma.user.findMany({
    include: { vendor: true },
  });

  console.log(`Total users found: ${allUsers.length}`);
  const strayUsers: string[] = [];

  for (const u of allUsers) {
    const isVendor = u.role === "vendor" || !!u.vendor;
    const isAdmin = u.role === "admin" || u.role === "superadmin" || u.email === "admin@intrihub.com";
    console.log(`User: id=${u.id} email=${u.email} role=${u.role} hasVendor=${!!u.vendor}`);

    if (!isVendor && !isAdmin) {
      if (u.email && (u.email.includes("test_") || u.email.includes("random") || u.email.includes("snymz") || u.email.includes("wi63qp"))) {
        strayUsers.push(u.id);
      }
    }
  }

  if (strayUsers.length > 0) {
    console.log(`Deleting ${strayUsers.length} stray test user records...`);
    await prisma.user.deleteMany({
      where: { id: { in: strayUsers } },
    });
    console.log("Cleaned stray test users successfully.");
  } else {
    console.log("No stray test users found.");
  }
}

inspectAndCleanStrayUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
