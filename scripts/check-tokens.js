const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { email: 'vendor@intrihub.com' },
    select: { id: true, email: true, pushToken: true }
  });
  console.log('Target User:', user);
  const totalDeviceTokens = await prisma.deviceToken.count();
  console.log('Total deviceTokens in DB:', totalDeviceTokens);
  const totalUsersWithPush = await prisma.user.count({ where: { pushToken: { not: null } } });
  console.log('Total users with pushToken in DB:', totalUsersWithPush);

  const sample = await prisma.deviceToken.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  console.log('Recent 5 deviceTokens in DB:');
  for (const s of sample) {
    console.log(' - User:', s.userId, 'Platform:', s.platform, 'Updated:', s.updatedAt, 'Token:', s.token ? s.token.slice(0, 20) + '...' : null);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
