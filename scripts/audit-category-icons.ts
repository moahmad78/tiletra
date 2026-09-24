import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, icon: true },
    orderBy: { order: "asc" },
  });
  console.log(`Total Categories in DB: ${cats.length}\n`);
  for (const c of cats) {
    console.log(`- Slug: ${c.slug.padEnd(35)} Name: "${c.name}" (icon field: ${c.icon})`);
  }
}

main().finally(() => prisma.$disconnect());
