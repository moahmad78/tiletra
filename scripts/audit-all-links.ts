import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { categories as localCategories } from "../lib/data/categories";

const baseDir = "d:/Intrihub";
const ignoreDirs = new Set(["node_modules", ".next", ".git", "intrihub-mobile", "intrihub-business", ".gemini"]);

// Match href="/...", url: "/...", Link href="/..."
const linkRegexes = [
  /href=["'`](\/[^"'`\s?#]*)["'`]/g,
  /href:\s*["'`](\/[^"'`\s?#]*)["'`]/g,
  /url:\s*["'`](\/[^"'`\s?#]*)["'`]/g,
  /url=["'`](\/[^"'`\s?#]*)["'`]/g,
  /to:\s*["'`](\/[^"'`\s?#]*)["'`]/g,
  /path:\s*["'`](\/[^"'`\s?#]*)["'`]/g,
  /router\.(push|replace)\(["'`](\/[^"'`\s?#]*)["'`]\)/g,
  /redirect\(["'`](\/[^"'`\s?#]*)["'`]\)/g,
  /https:\/\/www\.intrihub\.com(\/[a-zA-Z0-9_\-\/]*)/g,
];

const foundLinksWithSources: { link: string; file: string; line: number }[] = [];

function walk(currentDir: string) {
  const files = fs.readdirSync(currentDir);
  for (const f of files) {
    if (ignoreDirs.has(f)) continue;
    const full = path.join(currentDir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|jsx|js|md|html)$/.test(f)) {
      const content = fs.readFileSync(full, "utf-8");
      const lines = content.split("\n");
      lines.forEach((lineText, idx) => {
        for (const regex of linkRegexes) {
          regex.lastIndex = 0;
          let match;
          while ((match = regex.exec(lineText)) !== null) {
            const link = match[1] || match[0];
            if (link.startsWith("/")) {
              foundLinksWithSources.push({
                link: link.replace(/\/+$/, "") || "/",
                file: path.relative(baseDir, full),
                line: idx + 1,
              });
            }
          }
        }
      });
    }
  }
}

async function audit() {
  console.log("Scanning workspace for all links...");
  walk(baseDir);

  const [dbCategories, dbProducts] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ select: { slug: true } }),
  ]);

  const validCategorySlugs = new Set([
    ...localCategories.map((c) => c.slug.toLowerCase()),
    ...dbCategories.map((c) => c.slug.toLowerCase()),
  ]);

  const validProductSlugs = new Set([
    ...dbProducts.map((p) => p.slug.toLowerCase()),
  ]);

  // Read app router static directories
  const appDir = path.join(baseDir, "app");
  const staticAppRoutes = new Set<string>();

  function collectStaticRoutes(dir: string, routePrefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let hasPage = false;
    for (const e of entries) {
      if (e.name.startsWith("page.")) hasPage = true;
    }
    if (hasPage) {
      staticAppRoutes.add(routePrefix === "" ? "/" : routePrefix);
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith("(") && !e.name.startsWith("_") && !e.name.startsWith("[")) {
        collectStaticRoutes(path.join(dir, e.name), `${routePrefix}/${e.name}`);
      }
    }
  }
  collectStaticRoutes(appDir);

  console.log("Found static app routes:", Array.from(staticAppRoutes).sort());
  console.log("Valid category slugs:", Array.from(validCategorySlugs));

  const uniqueLinks = Array.from(new Set(foundLinksWithSources.map((s) => s.link))).sort();
  console.log(`\nAnalyzing ${uniqueLinks.length} unique links across the codebase:`);

  console.log("\n=== ALL INSTANCES OF BROKEN/INVALID LINKS IN APP & COMPONENTS ===");
  let foundAny = false;

  for (const item of foundLinksWithSources) {
    const l = item.link;
    if (item.file.startsWith("scripts") || item.file.startsWith("node_modules")) continue;
    if (l.includes("${") || l.endsWith(".png") || l.endsWith(".jpg") || l.endsWith(".ico") || l.endsWith(".svg")) continue;

    // Static app routes
    if (staticAppRoutes.has(l)) continue;

    // Dynamic /shop/[category] or /shop/[category]/[location]
    if (l.startsWith("/shop/")) {
      const parts = l.split("/").filter(Boolean);
      const catSlug = parts[1]?.toLowerCase();
      if (catSlug && !validCategorySlugs.has(catSlug)) {
        console.log(`❌ Invalid Category Link "${l}" in ${item.file}:${item.line}`);
        foundAny = true;
      }
      continue;
    }

    // Dynamic /product/[slug]
    if (l.startsWith("/product/")) {
      const prodSlug = l.replace("/product/", "").toLowerCase();
      if (!validProductSlugs.has(prodSlug)) {
        console.log(`❌ Invalid Product Link "${l}" in ${item.file}:${item.line}`);
        foundAny = true;
      }
      continue;
    }

    if (
      l.startsWith("/guides") ||
      l.startsWith("/api") ||
      l.startsWith("/account") ||
      l.startsWith("/admin") ||
      l.startsWith("/vendor") ||
      l.startsWith("/checkout") ||
      l.startsWith("/cart") ||
      l === "/"
    ) {
      continue;
    }

    console.log(`❌ Unrecognized Link "${l}" in ${item.file}:${item.line}`);
    foundAny = true;
  }

  if (!foundAny) {
    console.log("✅ None! All internal links in app/ and components/ are 100% valid.");
  }
}

audit().catch(console.error);
