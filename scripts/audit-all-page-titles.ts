import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { SEO_PAGES_SEED_DATA } from "../prisma/seed-seo-pages";
import { categories } from "../lib/data/categories";
import { SEO_LOCATIONS } from "../lib/data/seo-locations";

const prisma = new PrismaClient();

interface AuditResult {
  url: string;
  sourceFile: string;
  sourceLine?: number;
  rawPageTitle: string;
  renderedTitle: string;
  titleLength: number;
  ogTitle: string;
  twitterTitle: string;
  titleTagCount: number;
  problems: string[];
}

// Function to fetch rendered HTML from live production
async function fetchLiveHtml(pathname: string) {
  const url = `https://www.intrihub.com${pathname.startsWith("/") ? pathname : "/" + pathname}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const titleMatches = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map(m => m[1].replace(/&amp;/g, "&").trim());
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i)?.[1]?.replace(/&amp;/g, "&") || "";
    const twTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([\s\S]*?)["']/i)?.[1]?.replace(/&amp;/g, "&") || "";
    const hasWholesaler = /wholesaler/i.test(html);
    return {
      titleCount: titleMatches.length,
      titles: titleMatches,
      ogTitle,
      twTitle,
      hasWholesaler,
    };
  } catch (err) {
    return null;
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("🔍 COMPREHENSIVE PAGE TITLE & METADATA AUDIT");
  console.log("================================================================================\n");

  const results: AuditResult[] = [];
  const rootTemplate = "%s | IntriHub";

  // 1. Static Pages to Audit
  const staticPages = [
    { url: "/", file: "app/page.tsx" },
    { url: "/about", file: "app/about/page.tsx" },
    { url: "/contact", file: "app/contact/page.tsx" },
    { url: "/areas", file: "app/areas/page.tsx" },
    { url: "/for-interior-designers", file: "app/for-interior-designers/page.tsx" },
    { url: "/for-architects", file: "app/for-architects/page.tsx" },
    { url: "/for-contractors", file: "app/for-contractors/page.tsx" },
    { url: "/founder", file: "app/founder/page.tsx" },
    { url: "/faq", file: "app/faq/page.tsx" },
    { url: "/bulk-orders", file: "app/bulk-orders/page.tsx" },
    { url: "/categories", file: "app/categories/page.tsx" },
    { url: "/shop", file: "app/shop/page.tsx" },
    { url: "/guides", file: "app/guides/page.tsx" },
    { url: "/guides/diwali-home-renovation-2026-materials-checklist", file: "app/guides/diwali-home-renovation-2026-materials-checklist/page.tsx" },
    { url: "/guides/vitrified-tiles-online-buying-guide", file: "app/guides/vitrified-tiles-online-buying-guide/page.tsx" },
    { url: "/privacy-policy", file: "app/privacy-policy/page.tsx" },
    { url: "/terms", file: "app/terms/page.tsx" },
    { url: "/returns-policy", file: "app/returns-policy/page.tsx" },
    { url: "/shipping-policy", file: "app/shipping-policy/page.tsx" },
    { url: "/why-intrihub", file: "app/why-intrihub/page.tsx" },
    { url: "/smart-quantity-calculator", file: "app/smart-quantity-calculator/page.tsx" },
    // Core USP Pages
    { url: "/building-materials-online", file: "app/building-materials-online/page.tsx" },
    { url: "/factory-direct-pricing", file: "app/factory-direct-pricing/page.tsx" },
    { url: "/60-minute-express-delivery", file: "app/60-minute-express-delivery/page.tsx" },
    { url: "/zero-breakage-transit-guarantee", file: "app/zero-breakage-transit-guarantee/page.tsx" },
    { url: "/vendor-ecosystem-local-digitalization", file: "app/vendor-ecosystem-local-digitalization/page.tsx" },
    { url: "/multi-vendor-marketplace-bengaluru", file: "app/multi-vendor-marketplace-bengaluru/page.tsx" },
    { url: "/one-order-multiple-materials", file: "app/one-order-multiple-materials/page.tsx" },
    { url: "/one-platform-multiple-categories", file: "app/one-platform-multiple-categories/page.tsx" },
    { url: "/online-offline-phygital-marketplace", file: "app/online-offline-phygital-marketplace/page.tsx" },
    { url: "/builder-friendly-procurement", file: "app/builder-friendly-procurement/page.tsx" },
    { url: "/contractor-friendly-platform", file: "app/contractor-friendly-platform/page.tsx" },
    { url: "/homeowner-friendly-shopping", file: "app/homeowner-friendly-shopping/page.tsx" },
    { url: "/location-based-vendor-discovery", file: "app/location-based-vendor-discovery/page.tsx" },
    { url: "/project-based-shopping", file: "app/project-based-shopping/page.tsx" },
    { url: "/real-time-stock-visibility", file: "app/real-time-stock-visibility/page.tsx" },
    { url: "/repeat-1-click-reordering", file: "app/repeat-1-click-reordering/page.tsx" },
    { url: "/screw-to-complete-project", file: "app/screw-to-complete-project/page.tsx" },
    { url: "/gst-invoicing-procurement", file: "app/gst-invoicing-procurement/page.tsx" },
    { url: "/pan-india-delivery", file: "app/pan-india-delivery/page.tsx" },
    { url: "/direct-to-site-delivery", file: "app/direct-to-site-delivery/page.tsx" },
    { url: "/everything-for-every-space", file: "app/everything-for-every-space/page.tsx" },
  ];

  // 2. Dynamic Categories
  const categoryPages = [
    { url: "/shop/hardware", file: "app/shop/[category]/page.tsx" },
    { url: "/shop/plumbing-sanitary", file: "app/shop/[category]/page.tsx" },
    { url: "/shop/tiles-stone", file: "app/shop/[category]/page.tsx" },
    { url: "/shop/electrical", file: "app/shop/[category]/page.tsx" },
    { url: "/shop/plywood-timber", file: "app/shop/[category]/page.tsx" },
  ];

  // 3. Dynamic Category + Location Pages
  const categoryLocationPages = [
    { url: "/shop/tiles-stone/sarjapur-road", file: "app/shop/[category]/[location]/page.tsx" },
    { url: "/shop/hardware/whitefield", file: "app/shop/[category]/[location]/page.tsx" },
    { url: "/shop/plumbing-sanitary/electronic-city", file: "app/shop/[category]/[location]/page.tsx" },
  ];

  // 4. Products (sample)
  const productPages = [
    { url: "/product/m-sand-50-kg-bag-1742", file: "app/product/[slug]/page.tsx" },
  ];

  // 5. Keyword Landing Pages ([...slug])
  const keywordPages = [
    { url: "/cement-price-in-bangalore", file: "app/[...slug]/page.tsx" },
    { url: "/plywood-price-per-sheet-bangalore", file: "app/[...slug]/page.tsx" },
    { url: "/vitrified-tiles-price-in-bangalore", file: "app/[...slug]/page.tsx" },
    { url: "/interior-material-supplier-bangalore", file: "app/[...slug]/page.tsx" },
    { url: "/best-interior-material-electronic-city", file: "app/[...slug]/page.tsx" },
    { url: "/tiles", file: "app/[...slug]/page.tsx" },
    { url: "/plywood", file: "app/[...slug]/page.tsx" },
    { url: "/hardware", file: "app/[...slug]/page.tsx" },
    { url: "/sanitaryware", file: "app/[...slug]/page.tsx" },
    { url: "/electricals", file: "app/[...slug]/page.tsx" },
  ];

  const allUrls = [
    ...staticPages,
    ...categoryPages,
    ...categoryLocationPages,
    ...productPages,
    ...keywordPages,
  ];

  console.log(`Auditing ${allUrls.length} key URLs across live production and local source...\n`);

  for (const item of allUrls) {
    const live = await fetchLiveHtml(item.url);
    const filePath = path.join(process.cwd(), item.file);
    let rawContent = "";
    if (fs.existsSync(filePath)) {
      rawContent = fs.readFileSync(filePath, "utf-8");
    }

    const titleTagCount = live?.titleCount ?? 1;
    const renderedTitle = live?.titles[0] ?? "";
    const ogTitle = live?.ogTitle ?? "";
    const twTitle = live?.twTitle ?? "";
    const length = renderedTitle.length;

    const problems: string[] = [];

    // Problem checks:
    if (titleTagCount > 1) {
      problems.push(`Multiple <title> tags (${titleTagCount})`);
    }
    if (renderedTitle.includes(" • ")) {
      problems.push("Contains ' • ' separator");
    }
    if (renderedTitle.includes("IntriHub | IntriHub") || renderedTitle.includes("IntriHub | IntriHub | IntriHub")) {
      problems.push("Brand repeated ('| IntriHub | IntriHub')");
    }
    if (renderedTitle.includes("Intrihub") && !renderedTitle.includes("IntriHub")) {
      problems.push("Wrong brand spelling ('Intrihub' instead of 'IntriHub')");
    }
    if (length > 60) {
      problems.push(`Longer than 60 chars (${length} chars)`);
    }
    if (live?.hasWholesaler) {
      problems.push("Page contains forbidden word 'wholesaler'");
    }
    // Check if sentence repeated twice (e.g. "X • X" or "X | X")
    const parts = renderedTitle.split(" | ");
    if (parts.length >= 3 && parts[parts.length - 1] === "IntriHub" && parts[parts.length - 2] === "IntriHub") {
      // already caught by repeated brand
    }

    results.push({
      url: item.url,
      sourceFile: item.file,
      rawPageTitle: "",
      renderedTitle,
      titleLength: length,
      ogTitle,
      twitterTitle: twTitle,
      titleTagCount,
      problems,
    });
  }

  // Check for duplicate titles across pages
  const titleMap = new Map<string, string[]>();
  for (const r of results) {
    if (r.renderedTitle) {
      const list = titleMap.get(r.renderedTitle) || [];
      list.push(r.url);
      titleMap.set(r.renderedTitle, list);
    }
  }

  for (const r of results) {
    const matches = titleMap.get(r.renderedTitle) || [];
    if (matches.length > 1) {
      r.problems.push(`Duplicate title shared with: ${matches.filter(u => u !== r.url).join(", ")}`);
    }
  }

  // Print Summary Table
  console.log("| URL | Rendered Title | Length | Problems Found |");
  console.log("| :--- | :--- | :---: | :--- |");
  for (const r of results) {
    const problemText = r.problems.length > 0 ? `⚠️ ${r.problems.join("; ")}` : "✅ OK";
    console.log(`| \`${r.url}\` | ${r.renderedTitle.replace(/\|/g, "\\|")} | ${r.titleLength} | ${problemText} |`);
  }

  // Save audit data to JSON
  fs.writeFileSync(
    path.join(process.cwd(), "scripts/audit-titles-data.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\nAudit JSON written to scripts/audit-titles-data.json");
}

runAudit();
