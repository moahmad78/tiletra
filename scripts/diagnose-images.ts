import { getOfferBanners } from "../lib/actions/settings";
import { getCategories } from "../lib/actions/categories";

async function checkUrl(url: string): Promise<{ status: number | string; ok: boolean }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(id);
    return { status: res.status, ok: res.ok };
  } catch (err: any) {
    return { status: err.name === "AbortError" ? "TIMEOUT" : err.message, ok: false };
  }
}

async function main() {
  console.log("=== CHECKING BANNERS ===");
  const banners = await getOfferBanners();
  console.log(`Found ${banners.length} banners:`);
  for (const b of banners) {
    const res = b.image.startsWith("http") ? await checkUrl(b.image) : { status: "LOCAL", ok: true };
    console.log(`Banner [${b.title}]: image=${b.image} -> [${res.status}]`);
  }

  console.log("\n=== CHECKING CATEGORIES ===");
  const cats = await getCategories();
  const topCats = cats.filter((c: any) => !c.parentId);
  console.log(`Found ${topCats.length} top-level categories:`);
  for (const c of topCats) {
    const res = c.image.startsWith("http") ? await checkUrl(c.image) : { status: "LOCAL", ok: true };
    console.log(`Category [${c.name}]: image=${c.image} -> [${res.status}]`);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Diagnosis error:", err);
  process.exit(1);
});
