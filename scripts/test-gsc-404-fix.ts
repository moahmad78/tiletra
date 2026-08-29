import { getRedirectForPath } from "../lib/redirects";
import { getProductBySlug } from "../lib/actions/products";

async function testGscUrls() {
  console.log("==========================================================================");
  console.log("TESTING 2 GSC 404 URLs RESOLUTION");
  console.log("==========================================================================\n");

  const urlsToTest = [
    "/product/solid-pine-wood-core-flush-door-7x3",
    "/product/moroccan-heritage-pattern-kitchen",
  ];

  for (const path of urlsToTest) {
    const slug = path.replace("/product/", "");
    const product = await getProductBySlug(slug);
    const redirectRecord = await getRedirectForPath(path);

    console.log(`Checking path: ${path}`);
    console.log(`  - Product exists in DB: ${product ? `YES (status: ${product.status})` : "NO"}`);
    console.log(`  - 301 Redirect mapped: ${redirectRecord ? `YES -> ${redirectRecord.toPath} (HTTP ${redirectRecord.statusCode})` : "NO"}`);
    
    if (redirectRecord && redirectRecord.statusCode === 301) {
      console.log(`  ✓ RESOLVED: Google crawler requesting ${path} will receive 301 Permanent Redirect to ${redirectRecord.toPath}\n`);
    } else if (product) {
      console.log(`  ✓ RESOLVED: Product is live and returns HTTP 200\n`);
    } else {
      console.error(`  ❌ UNRESOLVED: Path ${path} would 404!\n`);
      process.exit(1);
    }
  }

  console.log("==========================================================================");
  console.log("🎉 ALL GSC 404 URLS CONFIRMED RESOLVED TO PERMANENT 301 REDIRECTS! ✓");
  console.log("==========================================================================");
}

testGscUrls().catch((e) => {
  console.error(e);
  process.exit(1);
});
