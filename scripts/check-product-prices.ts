import { prisma } from "../lib/prisma";
import { formatProduct } from "../lib/formatters";
import { getLowestPrice } from "../lib/data/products";

async function main() {
  const dbProducts = await prisma.product.findMany({
    where: { status: "active", approvalStatus: "approved" },
    include: {
      variants: true,
      attributes: true,
      priceTiers: true,
    },
  });

  const formatted = dbProducts.map(formatProduct);
  console.log(`Loaded ${formatted.length} active products.`);
  
  let under300 = 0;
  let over300 = 0;
  
  for (const p of formatted) {
    const lowest = getLowestPrice(p);
    console.log(`- [${p.id}] ${p.name} | Category: ${p.categorySlug} | Lowest Price: ₹${lowest}`);
    if (lowest <= 300) under300++;
    else over300++;
  }
  
  console.log(`\nProducts <= ₹300: ${under300}`);
  console.log(`Products > ₹300: ${over300}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
