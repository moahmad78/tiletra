import { prisma } from "../lib/prisma";
import { createRedirect, getRedirectForPath } from "../lib/redirects";

async function seedKnownGscRedirects() {
  console.log("==========================================================================");
  console.log("SEEDING KNOWN GSC 404 PERMANENT REDIRECTS (PRD Section 6, Item 10)");
  console.log("==========================================================================\n");

  const known404s = [
    {
      from: "/product/solid-pine-wood-core-flush-door-7x3",
      to: "/shop/doors-windows",
    },
    {
      from: "/product/moroccan-heritage-pattern-kitchen",
      to: "/shop/wall-surface",
    },
  ];

  for (const item of known404s) {
    const res = await createRedirect(item.from, item.to, 301);
    console.log(`✓ Seeded 301 Redirect: ${item.from} -> ${item.to}`);
  }

  // Verify lookup
  for (const item of known404s) {
    const match = await getRedirectForPath(item.from);
    if (!match || match.toPath !== item.to) {
      console.error(`❌ Verification failed for ${item.from}`);
      process.exit(1);
    }
    console.log(`✓ Verified Fast Lookup: ${item.from} resolves to ${match.toPath} (Status: ${match.statusCode})`);
  }

  console.log("\n==========================================================================");
  console.log("🎉 ALL GSC REDIRECTS SEEDED & VERIFIED SUCCESSFULLY! ✓");
  console.log("==========================================================================");
}

seedKnownGscRedirects()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
