import fs from "fs";
import path from "path";

async function main() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.log(".env does not exist");
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  const keys = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=")[0].trim());

  console.log("Neon/DB related keys in .env:");
  for (const k of keys) {
    if (k.toUpperCase().includes("NEON") || k.toUpperCase().includes("DATABASE") || k.toUpperCase().includes("BRANCH") || k.toUpperCase().includes("POSTGRES")) {
      console.log(`- ${k}`);
    }
  }

  // Also check if Neon API can be called with SQL via prisma.$queryRaw
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true, email: true, name: true },
    });
    console.log("Admin user:", adminUser);
  } catch (e: any) {
    console.log("Could not query:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
