import fs from "fs";
import path from "path";
import robotsConfig from "../app/robots";
import sitemapGenerator from "../app/sitemap";
import { generateProductSchema, generateBreadcrumbSchema, BASE_SITE_URL } from "../lib/seo";

async function verifyAll() {
  console.log("==================================================");
  console.log("PRODUCTION SEO COMPREHENSIVE VERIFICATION");
  console.log("==================================================");

  let errors = 0;
  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✓ PASS: ${name}`);
    } else {
      console.error(`✗ FAIL: ${name}${details ? ` -> ${details}` : ""}`);
      errors++;
    }
  }

  // 1. Root & Global SEO
  console.log("\n[1] Verifying Root Layout Metadata...");
  const layoutContent = fs.readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf-8");
  assert(
    "Root default title is 'IntriHub – Every Material. Every Space.'",
    layoutContent.includes('default: "IntriHub – Every Material. Every Space."')
  );
  assert(
    "Root title template is '%s | IntriHub'",
    layoutContent.includes('template: "%s | IntriHub"')
  );
  assert(
    "Root meta description matches brand specification",
    layoutContent.includes('Shop tiles, hardware, electrical, lighting and construction materials online with IntriHub. Quality materials, competitive prices and fast delivery across Bengaluru.')
  );
  assert(
    "Root OG type is 'website'",
    layoutContent.includes('type: "website"')
  );
  assert(
    "Root OG site_name is 'IntriHub'",
    layoutContent.includes('siteName: "IntriHub"')
  );
  assert(
    "Root OG title matches brand specification",
    layoutContent.includes('title: "IntriHub – Every Material. Every Space."')
  );
  assert(
    "Root OG description matches brand specification",
    layoutContent.includes('Shop interior and construction materials online. Everything you need for every space, delivered across Bengaluru.')
  );
  assert(
    "Root OG image URL is verified production asset",
    layoutContent.includes('${BASE_SITE_URL}/images/intrihub-og-image.jpg')
  );
  assert(
    "Root OG image dimensions are 1200x630",
    layoutContent.includes("width: 1200") && layoutContent.includes("height: 630")
  );
  assert(
    "Root OG image alt text matches brand specification",
    layoutContent.includes('alt: "IntriHub – Every Material. Every Space."')
  );
  assert(
    "Root Twitter card is 'summary_large_image'",
    layoutContent.includes('card: "summary_large_image"')
  );

  // 2. Homepage Specific SEO
  console.log("\n[2] Verifying Homepage Metadata...");
  const homeContent = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf-8");
  assert(
    "Homepage absolute title is 'IntriHub – Every Material. Every Space.'",
    homeContent.includes('absolute: "IntriHub – Every Material. Every Space."')
  );
  assert(
    "Homepage canonical is 'https://www.intrihub.com/'",
    homeContent.includes('canonical: "https://www.intrihub.com/"')
  );
  assert(
    "Homepage OG title matches brand specification",
    homeContent.includes('title: "IntriHub – Every Material. Every Space."')
  );
  assert(
    "Homepage OG description matches brand specification",
    homeContent.includes('Shop interior and construction materials online. Everything you need for every space, delivered across Bengaluru.')
  );

  // 3. Technical SEO: Robots.txt & Sitemap
  console.log("\n[3] Verifying Robots.txt & Sitemap...");
  const robots = robotsConfig();
  const disallows = (robots.rules as any)?.[0]?.disallow || [];
  assert(
    "Robots.txt disallows /cart",
    disallows.includes("/cart") || disallows.includes("/cart/")
  );
  assert(
    "Robots.txt disallows /checkout",
    disallows.includes("/checkout") || disallows.includes("/checkout/")
  );
  assert(
    "Robots.txt disallows /account",
    disallows.includes("/account") || disallows.includes("/account/")
  );
  assert(
    "Robots.txt disallows /admin",
    disallows.includes("/admin") || disallows.includes("/admin/")
  );
  assert(
    "Robots.txt disallows /vendor",
    disallows.includes("/vendor") || disallows.includes("/vendor/")
  );
  assert(
    "Robots.txt disallows /cpo",
    disallows.includes("/cpo") || disallows.includes("/cpo/")
  );
  assert(
    "Robots.txt links to dynamic sitemap.xml",
    robots.sitemap === `${BASE_SITE_URL}/sitemap.xml`
  );

  const sitemapItems = await sitemapGenerator();
  assert(
    "Sitemap contains public URLs",
    Array.isArray(sitemapItems) && sitemapItems.length > 50
  );
  const leakedPrivate = sitemapItems.filter((i) =>
    i.url.includes("/admin") ||
    i.url.includes("/cart") ||
    i.url.includes("/checkout") ||
    i.url.includes("/cpo") ||
    i.url.includes("/account") ||
    (i.url.includes("/vendor") && !i.url.endsWith("/vendor/apply"))
  );
  assert(
    "Zero private/admin/checkout/cart routes in sitemap",
    leakedPrivate.length === 0,
    leakedPrivate.map((i) => i.url).join(", ")
  );

  // 4. Product Page Schema
  console.log("\n[4] Verifying Product Schema Generation...");
  const dummyProduct = {
    id: "prod-test-1",
    name: "Classic Vitrified Floor Tile 600x600mm",
    slug: "classic-vitrified-floor-tile-600x600mm",
    description: "Premium double charged vitrified floor tile for high traffic living spaces.",
    images: ["/images/products/tile-1.jpg"],
    price: 450,
    inStock: true,
    sku: "TILE-VIT-600",
    brand: "IntriHub",
    categoryName: "Tiles & Stone",
  };
  const schema = generateProductSchema(dummyProduct);
  assert(
    "Product schema has @context https://schema.org",
    schema["@context"] === "https://schema.org"
  );
  assert(
    "Product schema has @type Product",
    schema["@type"] === "Product"
  );
  assert(
    "Product schema includes correct currency INR",
    schema.offers?.priceCurrency === "INR"
  );
  assert(
    "Product schema includes correct price 450",
    schema.offers?.price === "450"
  );
  assert(
    "Product schema includes InStock availability",
    schema.offers?.availability === "https://schema.org/InStock"
  );
  assert(
    "Product schema includes valid canonical product URL",
    schema.url === `${BASE_SITE_URL}/product/classic-vitrified-floor-tile-600x600mm`
  );

  // 5. Breadcrumb Schema
  console.log("\n[5] Verifying Breadcrumb Schema Generation...");
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Tiles & Stone", url: "/shop/tiles-stone" },
    { name: dummyProduct.name, url: `/product/${dummyProduct.slug}` },
  ]);
  assert(
    "Breadcrumb schema @type is BreadcrumbList",
    breadcrumbs["@type"] === "BreadcrumbList"
  );
  assert(
    "Breadcrumb schema has 3 list items in order",
    breadcrumbs.itemListElement?.length === 3 &&
    breadcrumbs.itemListElement[0].position === 1 &&
    breadcrumbs.itemListElement[1].position === 2 &&
    breadcrumbs.itemListElement[2].position === 3
  );

  // 6. Private and 404 Pages Noindex
  console.log("\n[6] Verifying Private and 404 Pages Noindex Metadata...");
  const cartLayoutContent = fs.readFileSync(path.join(process.cwd(), "app/cart/layout.tsx"), "utf-8");
  assert(
    "/cart has robots noindex, nofollow",
    cartLayoutContent.includes("index: false") && cartLayoutContent.includes("follow: false")
  );

  const checkoutLayoutContent = fs.readFileSync(path.join(process.cwd(), "app/checkout/layout.tsx"), "utf-8");
  assert(
    "/checkout has robots noindex, nofollow",
    checkoutLayoutContent.includes("index: false") && checkoutLayoutContent.includes("follow: false")
  );

  const cpoLayoutContent = fs.readFileSync(path.join(process.cwd(), "app/cpo/layout.tsx"), "utf-8");
  assert(
    "/cpo has robots noindex, nofollow",
    cpoLayoutContent.includes("index: false") && cpoLayoutContent.includes("follow: false")
  );

  const notFoundContent = fs.readFileSync(path.join(process.cwd(), "app/not-found.tsx"), "utf-8");
  assert(
    "/not-found (404) instantly redirects to homepage via router.replace",
    notFoundContent.includes('router.replace("/")') || notFoundContent.includes("router.replace('/')")
  );

  const uploadLayoutContent = fs.readFileSync(path.join(process.cwd(), "app/upload/layout.tsx"), "utf-8");
  assert(
    "/upload has robots noindex, nofollow",
    uploadLayoutContent.includes("index: false") && uploadLayoutContent.includes("follow: false")
  );

  const deleteAccountLayoutContent = fs.readFileSync(path.join(process.cwd(), "app/delete-account/layout.tsx"), "utf-8");
  assert(
    "/delete-account has robots noindex, nofollow",
    deleteAccountLayoutContent.includes("index: false") && deleteAccountLayoutContent.includes("follow: false")
  );

  console.log("==================================================");
  if (errors === 0) {
    console.log("🎉 ALL PRODUCTION SEO VERIFICATIONS PASSED (0 ERRORS)");
  } else {
    console.error(`🚨 ${errors} VERIFICATION ERRORS FOUND`);
    process.exit(1);
  }
  console.log("==================================================");
}

verifyAll().catch((err) => {
  console.error("FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});
