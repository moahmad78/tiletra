import { prisma } from "../lib/prisma";

const redirectsToSeed = [
  { fromPath: "/shop/sahil", toPath: "/shop", statusCode: 301 },
  { fromPath: "/shop/outdoor-tiles", toPath: "/shop/tiles-stone", statusCode: 301 },
  { fromPath: "/shop/bathroom-tiles", toPath: "/shop/tiles-stone", statusCode: 301 },
  { fromPath: "/shop/kitchen-tiles", toPath: "/shop/tiles-stone", statusCode: 301 },
  { fromPath: "/shop/wall-tiles", toPath: "/shop/tiles-stone", statusCode: 301 },
  { fromPath: "/shop/sanitaryware", toPath: "/shop/plumbing-sanitary", statusCode: 301 },
  { fromPath: "/shop/granite-marble", toPath: "/shop/tiles-stone", statusCode: 301 },
  { fromPath: "/shop/tile-adhesives", toPath: "/shop/adhesives-sealants-waterproofing", statusCode: 301 },
  { fromPath: "/inspiration", toPath: "/shop", statusCode: 301 },
  { fromPath: "/designs", toPath: "/shop", statusCode: 301 },
];

async function main() {
  console.log("Seeding GSC 301 redirects in database...");
  for (const item of redirectsToSeed) {
    const res = await prisma.redirect.upsert({
      where: { fromPath: item.fromPath },
      update: {
        toPath: item.toPath,
        statusCode: item.statusCode,
      },
      create: {
        fromPath: item.fromPath,
        toPath: item.toPath,
        statusCode: item.statusCode,
      },
    });
    console.log(`✓ 301 Redirect: ${res.fromPath} -> ${res.toPath}`);
  }
  console.log("All GSC redirects seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding redirects:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
