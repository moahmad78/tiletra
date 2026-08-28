import { prisma } from "../lib/prisma";

async function main() {
  console.log("Ensuring WishlistItem and MobilePushToken tables in PostgreSQL...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WishlistItem" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WishlistItem_userId_idx" ON "WishlistItem"("userId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WishlistItem_productId_idx" ON "WishlistItem"("productId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MobilePushToken" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "platform" TEXT NOT NULL DEFAULT 'android',
      "deviceId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MobilePushToken_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "MobilePushToken_token_key" ON "MobilePushToken"("token");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "MobilePushToken_userId_idx" ON "MobilePushToken"("userId");
  `);

  console.log("✅ Tables and indexes created successfully!");
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
