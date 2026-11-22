const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== TESTING ALL DISTINCT RECENT TOKENS ===");
  const tokens = await prisma.deviceToken.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: {
      user: {
        select: { name: true, role: true, phone: true }
      }
    }
  });

  for (const t of tokens) {
    console.log(`\nTesting ${t.user?.name} (${t.role}/${t.user?.role}) -> ...${t.token.slice(-12)}`);
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: t.token,
          title: "Test Alert",
          body: "Testing FCM credentials",
          sound: "default",
          priority: "high"
        })
      });
      const data = await res.json();
      console.log("Response:", JSON.stringify(data));
    } catch (e) {
      console.error("Fetch error:", e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
