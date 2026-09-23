import { categories } from "../lib/data/categories";

async function checkUrl(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });
    return { status: res.status, ok: res.ok, contentType: res.headers.get("content-type") };
  } catch (err: any) {
    return { status: "ERROR", ok: false, error: err.message };
  }
}

async function main() {
  console.log("=== CHECKING CATEGORY URLS ===");
  for (const cat of categories) {
    if (cat.image) {
      const result = await checkUrl(cat.image);
      console.log(`[${result.status}] ${cat.name} (${cat.slug}): ${cat.image}`);
    }
  }
}

main();
