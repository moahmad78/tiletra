import { getCategories } from "../lib/actions/categories";
import { getHomepageSections } from "../lib/actions/products";
import { getOfferBanners } from "../lib/actions/settings";

async function checkNextImage(src: string, width = 640) {
  const encoded = encodeURIComponent(src);
  const nextImgUrl = `http://localhost:3000/_next/image?url=${encoded}&w=${width}&q=75`;
  try {
    const res = await fetch(nextImgUrl);
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      size: (await res.arrayBuffer()).byteLength
    };
  } catch (err: any) {
    return { status: "FETCH_ERROR", error: err.message };
  }
}

async function checkDirectUrl(url: string) {
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
  try {
    const res = await fetch(fullUrl);
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      size: (await res.arrayBuffer()).byteLength
    };
  } catch (err: any) {
    return { status: "FETCH_ERROR", error: err.message };
  }
}

async function main() {
  console.log("=== 1. TESTING BANNERS ===");
  const banners = await getOfferBanners();
  console.log(`Found ${banners.length} banners:`);
  for (const b of banners) {
    const direct = await checkDirectUrl(b.image);
    const nextImg = await checkNextImage(b.image);
    console.log(`Banner: "${b.title}" -> direct: ${direct.status} (${direct.contentType}, ${direct.size}B) | next/image: ${nextImg.status} (${nextImg.contentType}, ${nextImg.size}B)`);
  }

  console.log("\n=== 2. TESTING CATEGORIES ===");
  const categories = await getCategories();
  console.log(`Found ${categories.length} categories:`);
  for (const c of categories.slice(0, 10)) {
    const direct = await checkDirectUrl(c.image);
    const nextImg = await checkNextImage(c.image, 128);
    console.log(`Category: "${c.name}" (${c.slug}) -> direct: ${direct.status} (${direct.contentType}, ${direct.size}B) | next/image: ${nextImg.status} (${nextImg.contentType}, ${nextImg.size}B)`);
  }

  console.log("\n=== 3. TESTING PRODUCTS ===");
  const { trending, bestsellers, newArrivals } = await getHomepageSections();
  const allProds = [...trending, ...bestsellers, ...newArrivals];
  console.log(`Found ${allProds.length} products on homepage:`);
  for (const p of allProds.slice(0, 10)) {
    const img = p.images[0] || "/placeholders/product.svg";
    const direct = await checkDirectUrl(img);
    const nextImg = await checkNextImage(img, 384);
    console.log(`Product: "${p.name}" (${img}) -> direct: ${direct.status} (${direct.contentType}, ${direct.size}B) | next/image: ${nextImg.status} (${nextImg.contentType}, ${nextImg.size}B)`);
  }
}

main().catch(console.error);
