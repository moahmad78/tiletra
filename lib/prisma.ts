import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Database Connection Security Check in Production
if (process.env.NODE_ENV === "production") {
  const dbUrl = process.env.DATABASE_URL || "";
  const isLocal =
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1") ||
    dbUrl.includes("::1");

  if (dbUrl && !isLocal) {
    const hasSsl =
      dbUrl.includes("sslmode=require") ||
      dbUrl.includes("sslmode=verify-full") ||
      dbUrl.includes("ssl=true") ||
      dbUrl.includes("sslmode=prefer");

    if (!hasSsl) {
      console.warn(
        "[SEC-WARN] [DATABASE_SSL_MISSING] Production DATABASE_URL does not explicitly mandate SSL encryption. Ensure '?sslmode=require' is appended to prevent plaintext interception."
      );
    }
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
