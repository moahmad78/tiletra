import { prisma } from "../lib/prisma";
import { getProducts, createProduct, deleteProduct } from "../lib/actions/products";
import { getCategories } from "../lib/actions/categories";
import { getOrders } from "../lib/actions/orders";

async function verify() {
  console.log("--- 1. Testing Category Query ---");
  const cats = await getCategories();
  console.log(`Found ${cats.length} categories in Neon PostgreSQL.`);

  console.log("--- 2. Testing Products Query ---");
  const initialProducts = await getProducts();
  console.log(`Found ${initialProducts.length} products in Neon PostgreSQL.`);

  console.log("--- 3. Testing Product Creation ---");
  const testSlug = `test-marble-tile-${Date.now()}`;
  const res = await createProduct({
    name: "Automated Test Marble Tile",
    slug: testSlug,
    categorySlug: "floor-tiles",
    categoryName: "Floor Tiles",
    description: "Database end-to-end verification tile.",
    material: "Vitrified",
    images: ["https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"],
    variants: [
      {
        size: "800x800mm",
        finish: "Polished",
        color: "Pure White",
        pricePerBox: 3500,
        pricePerSqft: 75,
        sqftPerBox: 46.6,
        stockBoxes: 150,
      }
    ],
    isBestseller: true,
    isNew: true,
  });

  if (!res.success || !res.product) {
    throw new Error(`Product creation failed: ${res.error}`);
  }
  console.log(`Product created with ID: ${res.product.id}`);

  console.log("--- 4. Verifying Product on Shop Catalog ---");
  const updatedProducts = await getProducts();
  const created = updatedProducts.find((p) => p.slug === testSlug);
  if (!created) {
    throw new Error("Created product not found in subsequent catalog fetch!");
  }
  console.log(`Successfully verified "${created.name}" in live database!`);

  console.log("--- 5. Testing Product Deletion Cleanup ---");
  const delRes = await deleteProduct(res.product.id);
  if (!delRes.success) {
    throw new Error(`Delete product failed: ${delRes.error}`);
  }
  console.log("Cleaned up test product successfully.");

  console.log("--- 6. Verifying Orders & Customers Query ---");
  const orders = await getOrders();
  console.log(`Found ${orders.length} order(s) in Neon database.`);

  console.log("\nALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY! ✅");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
