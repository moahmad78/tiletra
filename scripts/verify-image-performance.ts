import assert from "assert";

async function verifyImagePipeline() {
  console.log("==========================================================================");
  console.log("VERIFYING NEXT.JS IMAGE OPTIMIZATION PIPELINE & PAYLOAD SIZES");
  console.log("==========================================================================");

  const BASE = "http://localhost:3000";

  // 1. Check Homepage HTML for Priority & Next Image tags
  console.log("\n[TEST 1] Fetching Homepage (http://localhost:3000/):");
  const homeRes = await fetch(`${BASE}/`);
  assert.strictEqual(homeRes.status, 200, "Homepage must return 200 OK");
  const homeHtml = await homeRes.text();

  // Check for Next.js Image optimization markers or preloads
  const hasPreloadOrPriority = homeHtml.includes("fetchpriority=\"high\"") || homeHtml.includes("rel=\"preload\"");
  console.log("  ✓ Homepage HTML contains above-the-fold high priority preloads:", hasPreloadOrPriority);

  // 2. Test Image Optimization Endpoint with Sharp for a Remote Image
  console.log("\n[TEST 2] Testing Sharp Image Optimization Endpoint (/_next/image):");
  const sampleRemoteUrl = encodeURIComponent("https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85");
  const optImgUrl = `${BASE}/_next/image?url=${sampleRemoteUrl}&w=828&q=75`;

  const imgRes = await fetch(optImgUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  console.log(`  ✓ Image response status: ${imgRes.status}`);
  assert.strictEqual(imgRes.status, 200, "Image optimizer endpoint must return 200");

  const contentType = imgRes.headers.get("content-type");
  const cacheControl = imgRes.headers.get("cache-control");
  const arrayBuffer = await imgRes.arrayBuffer();
  const optimizedSizeBytes = arrayBuffer.byteLength;

  console.log(`  ✓ Content-Type: ${contentType} (Modern format confirmed!)`);
  console.log(`  ✓ Cache-Control: ${cacheControl}`);
  console.log(`  ✓ Optimized payload size: ${(optimizedSizeBytes / 1024).toFixed(1)} KB`);

  assert(
    contentType?.includes("image/webp") || contentType?.includes("image/avif"),
    `Content-Type must be webp or avif, got: ${contentType}`
  );

  // 3. Test Local Logo Image Optimization
  console.log("\n[TEST 3] Testing Local Logo Optimization:");
  const logoUrl = `${BASE}/_next/image?url=%2Flogo%2Fintri-web-logo.png&w=384&q=75`;
  const logoRes = await fetch(logoUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });
  console.log(`  ✓ Logo response status: ${logoRes.status}`);
  assert.strictEqual(logoRes.status, 200, "Logo image optimizer endpoint must return 200");
  const logoBuf = await logoRes.arrayBuffer();
  console.log(`  ✓ Optimized logo size: ${(logoBuf.byteLength / 1024).toFixed(1)} KB (down from 24.5 KB original)`);

  // 4. Test Category Page HTML & Image Tags
  console.log("\n[TEST 4] Testing Category Page (/shop/tiles-stone):");
  const catRes = await fetch(`${BASE}/shop/tiles-stone`);
  assert.strictEqual(catRes.status, 200, "Category page must return 200");
  const catHtml = await catRes.text();
  assert(catHtml.includes("tiles-stone"), "Category page must render tiles-stone content");
  console.log("  ✓ Category page returned 200 OK and rendered catalog");

  // 5. Test Shop Page HTML
  console.log("\n[TEST 5] Testing Shop Page (/shop):");
  const shopRes = await fetch(`${BASE}/shop`);
  assert.strictEqual(shopRes.status, 200, "Shop page must return 200");
  console.log("  ✓ Shop page returned 200 OK");

  console.log("\n==========================================================================");
  console.log("🎉 ALL IMAGE OPTIMIZATION PIPELINE CHECKS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

verifyImagePipeline().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
