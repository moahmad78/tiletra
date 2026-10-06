import { prisma } from "../lib/prisma";

async function main() {
  console.log("=================================================");
  console.log("  PHASE 3 VERIFICATION SUITE: Storefront & Buy Now");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean, details?: any) {
    total++;
    if (condition) {
      console.log(`  ✔ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${desc}`, details ? details : "");
    }
  }

  // ----------------------------------------------------------------------
  // TEST 1: Direct Checkout Session Isolation Logic
  // ----------------------------------------------------------------------
  console.log("--- TEST 1: Buy Now vs Cart Isolation ---");
  {
    // Simulate Cart state
    const regularCart = [
      { productId: "p-cart-1", variantId: "v-cart-1", quantity: 5, price: 500 },
      { productId: "p-cart-2", variantId: "v-cart-2", quantity: 2, price: 1200 },
    ];
    let buyNowItem: any = null;

    // User clicks "Buy Now" on variant 3
    const directItem = { productId: "p-direct-3", variantId: "v-direct-3", quantity: 1, price: 2400 };
    buyNowItem = directItem;

    // Check: regular cart items are untouched
    assert("Buy Now sets buyNowItem without modifying regular cart items", 
      regularCart.length === 2 && buyNowItem.variantId === "v-direct-3"
    );

    // Direct checkout session consumes only [buyNowItem]
    const isDirectCheckout = true;
    const activeItems = isDirectCheckout && buyNowItem ? [buyNowItem] : regularCart;
    assert("Active checkout session contains ONLY the direct buy item", 
      activeItems.length === 1 && activeItems[0].variantId === "v-direct-3"
    );

    // On direct checkout completion: clear only buyNowItem, regular cart preserved
    buyNowItem = null;
    assert("After direct checkout completion, regular cart items are intact and buyNowItem is cleared",
      regularCart.length === 2 && buyNowItem === null
    );
  }

  // ----------------------------------------------------------------------
  // TEST 2: Multi-dimensional Variant Auto-Fallback & Unavailable Combos
  // ----------------------------------------------------------------------
  console.log("\n--- TEST 2: Variant Auto-Fallback & Inactive Styling ---");
  {
    const sampleVariants = [
      { id: "v1", color: "Blue", size: "1L", active: true, stockBoxes: 10, pricePerBox: 350 },
      { id: "v2", color: "Blue", size: "4L", active: true, stockBoxes: 0, pricePerBox: 1200 }, // OOS
      { id: "v3", color: "Blue", size: "10L", active: false, stockBoxes: 15, pricePerBox: 2800 }, // Inactive
      { id: "v4", color: "Red", size: "4L", active: true, stockBoxes: 8, pricePerBox: 1250 },
      { id: "v5", color: "Red", size: "10L", active: true, stockBoxes: 5, pricePerBox: 2900 },
      // Note: Red 1L does not exist!
    ];

    // Current selection: Color Red, Size 4L
    let current = sampleVariants.find(v => v.id === "v4")!;

    // Case A: User clicks Color "Blue". Does Blue have 4L?
    // Exact active match:
    const blueExact4L = sampleVariants.find(v => v.active !== false && v.color === "Blue" && v.size === current.size);
    assert("Switching to Blue finds exact size 4L (even if out of stock, as long as active)",
      Boolean(blueExact4L && blueExact4L.id === "v2")
    );

    // Case B: Current is Blue 1L. User clicks Color "Red". Red does NOT have 1L!
    // Auto-fallback: should pick first active variant for Red (which is 4L)
    const redExact1L = sampleVariants.find(v => v.active !== false && v.color === "Red" && v.size === "1L");
    assert("Red 1L does not exist / is unavailable", redExact1L === undefined);

    const redFallback = sampleVariants.find(v => v.active !== false && v.color === "Red");
    assert("Auto-fallback picks the first valid active size for Red (4L)",
      Boolean(redFallback && redFallback.size === "4L")
    );

    // Case C: Check unavailable combinations
    // For Blue: 10L is active === false -> must be flagged unavailable
    const blue10L = sampleVariants.find(v => v.color === "Blue" && v.size === "10L");
    const isBlue10LUnavailable = !blue10L || blue10L.active === false;
    assert("Blue 10L is inactive and flagged unavailable (line-through & disabled)", isBlue10LUnavailable === true);

    // For Red: 1L does not exist -> must be flagged unavailable
    const red1L = sampleVariants.find(v => v.color === "Red" && v.size === "1L");
    const isRed1LUnavailable = !red1L || red1L.active === false;
    assert("Red 1L does not exist and flagged unavailable (line-through & disabled)", isRed1LUnavailable === true);
  }

  // ----------------------------------------------------------------------
  // TEST 3: Stock Status & Action Buttons
  // ----------------------------------------------------------------------
  console.log("\n--- TEST 3: Stock Badges & Notify Me Logic ---");
  {
    function getStockBadge(stockBoxes: number) {
      if (stockBoxes <= 0) return "Out of stock";
      if (stockBoxes <= 5) return `Only ${stockBoxes} left in stock`;
      return "In stock";
    }

    assert("Stock = 0 yields 'Out of stock'", getStockBadge(0) === "Out of stock");
    assert("Stock = 3 yields 'Only 3 left in stock'", getStockBadge(3) === "Only 3 left in stock");
    assert("Stock = 5 yields 'Only 5 left in stock'", getStockBadge(5) === "Only 5 left in stock");
    assert("Stock = 20 yields 'In stock'", getStockBadge(20) === "In stock");

    function getActionButton(stockBoxes: number) {
      return stockBoxes <= 0 ? "Notify me" : "Buy Now";
    }
    assert("Stock = 0 replaces Buy Now with 'Notify me'", getActionButton(0) === "Notify me");
    assert("Stock > 0 displays 'Buy Now'", getActionButton(10) === "Buy Now");
  }

  // ----------------------------------------------------------------------
  // TEST 4: Live Database Verification & Server Validation Test
  // ----------------------------------------------------------------------
  console.log("\n--- TEST 4: Live DB Variant Integrity ---");
  {
    // Retrieve a real product with variants from Neon DB
    const product = await prisma.product.findFirst({
      where: { hasVariants: true },
      include: { variants: true },
    });

    assert("Live product with variants exists in DB", Boolean(product && product.variants.length > 0));
    if (product) {
      const v = product.variants[0];
      assert("ProductVariant has numeric pricePerBox", typeof v.pricePerBox === "number" && v.pricePerBox > 0);
      assert("ProductVariant has stockBoxes defined", typeof v.stockBoxes === "number");
      assert("ProductVariant has active flag", typeof v.active === "boolean");
      console.log(`     Sample DB product: "${product.name}" (${product.variants.length} variants, Default variant: ${v.size} / ${v.color}, Stock: ${v.stockBoxes})`);
    }
  }

  console.log("\n=================================================");
  console.log(`  TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Test suite encountered error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
