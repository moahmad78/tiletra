import { prisma } from "../lib/prisma";
import { generateMobileTokens } from "../lib/mobile-auth";

async function main() {
  console.log("1. Finding admin user in database...");
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
  });

  if (!admin) {
    console.error("Admin user not found in DB!");
    process.exit(1);
  }

  console.log("Admin User found:", admin.email, "id:", admin.id);

  const tokens = generateMobileTokens({
    id: admin.id,
    role: "admin",
    email: admin.email,
    phone: admin.phone,
    name: admin.name,
  });

  console.log("Generated Admin Access Token (first 20 chars):", tokens.accessToken.slice(0, 20) + "...");

  const endpoints = [
    { url: "https://www.intrihub.com/api/mobile/admin/dashboard", name: "Dashboard" },
    { url: "https://www.intrihub.com/api/mobile/admin/products", name: "Products" },
    { url: "https://www.intrihub.com/api/mobile/admin/vendors", name: "Vendors" },
    { url: "https://www.intrihub.com/api/mobile/admin/categories", name: "Categories" },
    { url: "https://www.intrihub.com/api/mobile/admin/orders", name: "Orders" },
    { url: "https://www.intrihub.com/api/mobile/admin/users", name: "Users" },
    { url: "https://www.intrihub.com/api/mobile/admin/vendor-applications", name: "Vendor Applications" },
    { url: "https://www.intrihub.com/api/mobile/admin/product-approvals", name: "Product Approvals" },
    { url: "https://www.intrihub.com/api/mobile/admin/coupons", name: "Coupons" },
    { url: "https://www.intrihub.com/api/mobile/admin/settings", name: "Settings" },
    { url: "https://www.intrihub.com/api/mobile/admin/reviews", name: "Reviews" },
  ];

  console.log("\n2. Testing live production endpoints...");
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: "application/json",
        },
      });

      const text = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      console.log(`[${ep.name}] Status: ${res.status} | Success: ${parsed?.success ?? false} | Data: ${parsed ? JSON.stringify(parsed).slice(0, 100) : text.slice(0, 80)}`);
    } catch (e: any) {
      console.error(`[${ep.name}] Error:`, e.message);
    }
  }
}

main().catch(console.error);
