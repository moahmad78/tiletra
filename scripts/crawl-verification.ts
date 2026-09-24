import http from "http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

interface CrawlReport {
  pageUrl: string;
  statusCode: number;
  totalImagesFound: number;
  imageUrls: string[];
  externalImageUrls: string[];
  failedImageUrls: string[];
}

function fetchUrl(urlStr: string): Promise<{ statusCode: number; headers: Record<string, any>; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(urlStr, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data }));
      })
      .on("error", reject);
  });
}

function extractImageUrls(html: string): string[] {
  const urls = new Set<string>();

  // 1. Match img src
  const srcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = srcRegex.exec(html)) !== null) {
    if (match[1]) urls.add(match[1]);
  }

  // 2. Match srcset
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const entries = match[1].split(",");
    for (const e of entries) {
      const src = e.trim().split(/\s+/)[0];
      if (src) urls.add(src);
    }
  }

  // 3. Match CSS url(...)
  const bgRegex = /url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    if (match[1] && !match[1].startsWith("data:")) {
      urls.add(match[1]);
    }
  }

  // 4. Match link rel="preload" as="image"
  const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi;
  while ((match = preloadRegex.exec(html)) !== null) {
    if (match[1]) urls.add(match[1]);
  }

  return Array.from(urls);
}

async function verifyImageResource(imgUrl: string): Promise<{ ok: boolean; status: number; contentType?: string; cacheControl?: string; isExternal: boolean; host?: string }> {
  if (imgUrl.startsWith("data:")) return { ok: true, status: 200, contentType: "data-uri", isExternal: false };

  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
    try {
      const parsed = new URL(imgUrl);
      if (parsed.hostname !== "localhost" && parsed.hostname !== "www.intrihub.com" && parsed.hostname !== "intrihub.com") {
        return { ok: false, status: 0, isExternal: true, host: parsed.hostname };
      }
      const localPath = parsed.pathname;
      const res = await fetchUrl(`${BASE_URL}${localPath}`);
      return {
        ok: res.statusCode === 200,
        status: res.statusCode,
        contentType: res.headers["content-type"],
        cacheControl: res.headers["cache-control"],
        isExternal: false,
      };
    } catch {
      return { ok: false, status: 0, isExternal: true };
    }
  }

  // Relative path
  const localPath = imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`;
  try {
    const res = await fetchUrl(`${BASE_URL}${localPath}`);
    return {
      ok: res.statusCode === 200,
      status: res.statusCode,
      contentType: res.headers["content-type"],
      cacheControl: res.headers["cache-control"],
      isExternal: false,
    };
  } catch {
    return { ok: false, status: 500, isExternal: false };
  }
}

async function main() {
  console.log("=================================================");
  console.log("PHASE 9: PRODUCTION LIVE CRAWL & VERIFICATION");
  console.log("=================================================\n");

  const categories = await prisma.category.findMany({ select: { slug: true } });
  const products = await prisma.product.findMany({ select: { slug: true }, take: 15 });
  const guidePosts = await prisma.guidePost.findMany({ select: { slug: true } });

  const crawlUrls: string[] = [
    "/",
    "/shop",
    "/categories",
    "/guides",
    ...categories.map((c) => `/shop/${c.slug}`),
    ...products.map((p) => `/product/${p.slug}`),
    ...guidePosts.map((g) => `/guides/${g.slug}`),
  ];

  console.log(`Starting crawl across ${crawlUrls.length} pages...\n`);

  const reports: CrawlReport[] = [];
  const uniqueImages = new Set<string>();
  let totalExternalImages = 0;
  let totalBrokenImages = 0;

  for (const pagePath of crawlUrls) {
    try {
      const pageRes = await fetchUrl(`${BASE_URL}${pagePath}`);
      const imagesOnPage = extractImageUrls(pageRes.body);
      const extImgs: string[] = [];
      const failImgs: string[] = [];

      for (const img of imagesOnPage) {
        uniqueImages.add(img);
        if (img.includes("res.cloudinary.com") || img.includes("images.unsplash.com")) {
          extImgs.push(img);
          totalExternalImages++;
        }
      }

      reports.push({
        pageUrl: pagePath,
        statusCode: pageRes.statusCode,
        totalImagesFound: imagesOnPage.length,
        imageUrls: imagesOnPage,
        externalImageUrls: extImgs,
        failedImageUrls: failImgs,
      });

      console.log(`[CRAWL ${pageRes.statusCode}] ${pagePath.padEnd(50)} -> ${imagesOnPage.length} images found`);
    } catch (err: any) {
      console.error(`[CRAWL ERROR] Failed to fetch ${pagePath}:`, err.message);
    }
  }

  // Verify all unique images
  console.log(`\n=================================================`);
  console.log(`Verifying all ${uniqueImages.size} unique image resources...`);
  console.log(`=================================================\n`);

  let testedImages = 0;
  let verified200 = 0;

  for (const imgUrl of Array.from(uniqueImages)) {
    testedImages++;
    const res = await verifyImageResource(imgUrl);
    if (res.ok) {
      verified200++;
    } else {
      totalBrokenImages++;
      console.error(`[BROKEN / EXTERNAL IMAGE]: ${imgUrl} (status=${res.status}, ext=${res.isExternal})`);
    }
  }

  console.log("\n=================================================");
  console.log("FINAL CRAWL SUMMARY:");
  console.log(`- Pages Crawled:            ${reports.length}`);
  console.log(`- Unique Images Verified:   ${testedImages}`);
  console.log(`- Successfully Loaded 200:  ${verified200}`);
  console.log(`- Broken Image Count:       ${totalBrokenImages}`);
  console.log(`- Third-Party / Cloudinary: ${totalExternalImages}`);
  console.log("=================================================");

  if (totalBrokenImages > 0 || totalExternalImages > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Crawl error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
