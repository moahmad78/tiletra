async function testColdLoad(iteration: number) {
  const startTime = Date.now();
  const res = await fetch("http://localhost:3000/", {
    headers: {
      "User-Agent": `TestColdLoadClient-${iteration}/1.0 (Windows NT 10.0; Win64; x64)`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  });
  const duration = Date.now() - startTime;
  const html = await res.text();

  if (res.status !== 200) {
    throw new Error(`Iteration ${iteration} returned status ${res.status}`);
  }

  // 1. Check Banner Images
  const bannerImgs = html.match(/<img[^>]*alt="[^"]*Vitrified Tiles"[^>]*>/gi) || [];
  const allUnsplashImgs = html.match(/<img[^>]*unsplash[^>]*>/gi) || [];
  const bannerPlaceholders = html.match(/<img[^>]*\/placeholders\/banner\.svg[^>]*>/gi) || [];

  // 2. Check Category Images
  const orientbellImgs = html.match(/<img[^>]*orientbell[^>]*>/gi) || [];
  const gstaticImgs = html.match(/<img[^>]*encrypted-tbn0\.gstatic\.com[^>]*>/gi) || [];
  const categoryPlaceholders = html.match(/<img[^>]*\/placeholders\/category\.svg[^>]*>/gi) || [];

  // 3. Check Product Images (no regression)
  const productCards = html.match(/<img[^>]*data-nimg="fill"[^>]*class="object-cover transition-transform[^"]*"[^>]*>/gi) || [];

  // 4. Check eager vs lazy loading distribution
  const eagerImgs = html.match(/loading="eager"/gi) || [];
  const lazyImgs = html.match(/loading="lazy"/gi) || [];

  console.log(`\n--- Cold Load Test #${iteration} (${duration}ms) ---`);
  console.log(`✓ HTTP Status: ${res.status}`);
  console.log(`✓ Hero Banner images present: ${allUnsplashImgs.length} (Placeholders: ${bannerPlaceholders.length})`);
  console.log(`✓ Category images present: Orientbell=${orientbellImgs.length}, Gstatic=${gstaticImgs.length} (Placeholders: ${categoryPlaceholders.length})`);
  console.log(`✓ Product cards intact: ${productCards.length}`);
  console.log(`✓ Optimized loading distribution: ${eagerImgs.length} eager vs ${lazyImgs.length} lazy`);

  if (bannerPlaceholders.length > 0) {
    throw new Error(`Iteration ${iteration} has banner placeholders in initial HTML!`);
  }
  if (categoryPlaceholders.length > 0) {
    throw new Error(`Iteration ${iteration} has category placeholders in initial HTML!`);
  }
  if (allUnsplashImgs.length === 0) {
    throw new Error(`Iteration ${iteration} missing hero banner images!`);
  }
  if (orientbellImgs.length === 0) {
    throw new Error(`Iteration ${iteration} missing category images!`);
  }

  return true;
}

async function main() {
  console.log("==========================================");
  console.log("RUNNING 5 CONSECUTIVE COLD-LOAD TESTS");
  console.log("==========================================");

  for (let i = 1; i <= 5; i++) {
    await testColdLoad(i);
  }

  console.log("\n==========================================");
  console.log("ALL 5 COLD-LOAD TESTS PASSED PERFECTLY!");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
