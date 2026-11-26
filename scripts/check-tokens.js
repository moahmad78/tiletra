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
    take: 1
  });
  console.log('DeviceToken keys in DB:', sample[0] ? Object.keys(sample[0]) : 'None');
  if (sample[0]) console.log('Sample record:', sample[0]);
}

run().catch(console.error).finally(() => prisma.$disconnect());
