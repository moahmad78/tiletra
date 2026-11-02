const endpoints = [
  // 1. Customer Web Pages
  { name: "Homepage", url: "https://www.intrihub.com/" },
  { name: "Shop Catalog", url: "https://www.intrihub.com/shop" },
  { name: "Cart Page", url: "https://www.intrihub.com/cart" },
  { name: "Checkout Page", url: "https://www.intrihub.com/checkout" },
  { name: "Categories Hub", url: "https://www.intrihub.com/categories" },
  { name: "About Us", url: "https://www.intrihub.com/about" },
  { name: "Contact Us", url: "https://www.intrihub.com/contact" },
  { name: "Privacy Policy", url: "https://www.intrihub.com/privacy-policy" },
  { name: "Terms of Service", url: "https://www.intrihub.com/terms" },

  // 2. Mobile APIs
  { name: "Mobile Categories API", url: "https://www.intrihub.com/api/mobile/categories" },
  { name: "Mobile Products API", url: "https://www.intrihub.com/api/mobile/products" },
  { name: "Mobile App Config API", url: "https://www.intrihub.com/api/mobile/app-config?app=customer&platform=android" },
  { name: "Mobile App Version API", url: "https://www.intrihub.com/api/mobile/app-version?app=customer&platform=android&installedVersion=1.2.5" },
  { name: "Mobile Auth Method Check API", url: "https://www.intrihub.com/api/mobile/auth/check-method", method: "POST", body: JSON.stringify({ email: "vendor@intrihub.com" }) },

  // 3. Admin & Vendor Portals
  { name: "Admin Login Page", url: "https://www.intrihub.com/admin/login" },
  { name: "Vendor Apply Page", url: "https://www.intrihub.com/vendor/apply" },
];

async function run() {
  console.log("==========================================================");
  console.log("🌐 LIVE SMOKE TEST: ALL INTRIHUB WEB & MOBILE ENDPOINTS");
  console.log("==========================================================\n");

  let passCount = 0;
  let failCount = 0;

  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IntriHub-QA/1.0",
      };
      if (ep.body) {
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(ep.url, {
        method: ep.method || "GET",
        headers,
        body: ep.body || undefined,
        redirect: "manual", // inspect redirect
      });
      const duration = Date.now() - t0;
      const status = res.status;

      if (status >= 200 && status < 400) {
        console.log(`✅ [${status}] ${ep.name.padEnd(30)} in ${duration}ms -> ${ep.url}`);
        passCount++;
      } else {
        console.log(`⚠️ [${status}] ${ep.name.padEnd(30)} in ${duration}ms -> ${ep.url}`);
        failCount++;
      }
    } catch (err) {
      console.log(`❌ [ERR] ${ep.name.padEnd(30)} -> ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n==========================================================`);
  console.log(`Results: ${passCount} Passed | ${failCount} Warnings/Errors`);
  console.log(`==========================================================`);
}

run();
