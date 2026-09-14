const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36";

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots");

async function getReviewerAuth() {
  console.log("Authenticating reviewer account via API...");
  const res = await fetch("https://www.intrihub.com/api/mobile/auth/login-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "playreview@intrihub.com",
      password: "IntriReview#2026",
      purpose: "customer",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Reviewer auth failed: ${data.error || res.statusText}`);
  }

  console.log("Reviewer authenticated successfully:", data.user?.name, "(ID:", data.user?.id, ")");
  return {
    accessToken: data.tokens?.accessToken || data.token,
    refreshToken: data.tokens?.refreshToken || data.refreshToken,
    user: data.user,
  };
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const reviewerAuth = await getReviewerAuth();

  console.log("Launching local Chrome at 1080x2400 (412x915 @ 2.625x)...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      `--user-agent=${USER_AGENT}`,
      "--user-data-dir=C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\chrome-shots-clean",
      "--hide-scrollbars",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    await page.setViewport({
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    });

    // 0. Establish origin & pre-populate reviewer session and cart
    console.log("Initializing reviewer session in local browser storage...");
    await page.goto("http://localhost:5000/", { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.evaluate((auth) => {
      window.localStorage.setItem("intrihub_access_token", auth.accessToken);
      window.localStorage.setItem("intrihub_refresh_token", auth.refreshToken);
      window.localStorage.setItem("intrihub_user", JSON.stringify(auth.user));

      if (auth.user?.addresses && auth.user.addresses.length > 0) {
        const defaultAddr = auth.user.addresses.find((a) => a.isDefault) || auth.user.addresses[0];
        window.localStorage.setItem("intrihub_selected_address", JSON.stringify(defaultAddr));
      }

      // Pre-add the exact realistic tile adhesive product to cart
      const cartItem = {
        id: "cmt4rdvyf000hdx23yg9vkzpj_default",
        product: {
          id: "cmt4rdvyf000hdx23yg9vkzpj",
          name: "Roff T01 NCA Tile Adhesive, Grey, 30 Kg Bag",
          categorySlug: "tiles-stone",
          size: "Standard",
          finish: "Standard",
          unitOfSale: "box",
          pricePerSqft: 430,
          unit: "box",
          images: [
            "/api/uploads/1000055745-1787426118116-lov83.webp",
            "/api/uploads/1000055751-1787426131025-jlewn.webp",
          ],
        },
        variant: {
          id: "default",
          name: "Standard • Standard",
        },
        quantity: 3,
        calculatedPrice: 1290,
      };

      window.localStorage.setItem("intrihub_mobile_cart_v1", JSON.stringify([cartItem]));
    }, reviewerAuth);

    // ─────────────────────────────────────────────────────────────
    // SCREEN 1: Home Screen
    // ─────────────────────────────────────────────────────────────
    console.log("\n[1/6] Capturing 01-home.png...");
    await page.goto("http://localhost:5000/", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 6000)); // Allow banners & products to hydrate

    const homePath = path.join(SCREENSHOTS_DIR, "01-home.png");
    await page.screenshot({ path: homePath, type: "png" });
    console.log("✓ Saved 01-home.png");

    // ─────────────────────────────────────────────────────────────
    // SCREEN 2: Categories / Product Browsing
    // ─────────────────────────────────────────────────────────────
    console.log("\n[2/6] Capturing 02-categories.png...");
    await page.goto("http://localhost:5000/categories", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 5000));

    const catPath = path.join(SCREENSHOTS_DIR, "02-categories.png");
    await page.screenshot({ path: catPath, type: "png" });
    console.log("✓ Saved 02-categories.png");

    // ─────────────────────────────────────────────────────────────
    // SCREEN 3: Product Details
    // ─────────────────────────────────────────────────────────────
    console.log("\n[3/6] Capturing 03-product-details.png...");
    const productId = "cmt4rdvyf000hdx23yg9vkzpj";
    await page.goto(`http://localhost:5000/product/${productId}`, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 5000));

    const prodPath = path.join(SCREENSHOTS_DIR, "03-product-details.png");
    await page.screenshot({ path: prodPath, type: "png" });
    console.log("✓ Saved 03-product-details.png");

    // ─────────────────────────────────────────────────────────────
    // SCREEN 4: Cart
    // ─────────────────────────────────────────────────────────────
    console.log("\n[4/6] Capturing 04-cart.png...");
    await page.goto("http://localhost:5000/cart", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 5000));

    const cartPath = path.join(SCREENSHOTS_DIR, "04-cart.png");
    await page.screenshot({ path: cartPath, type: "png" });
    console.log("✓ Saved 04-cart.png");

    // ─────────────────────────────────────────────────────────────
    // SCREEN 5: Checkout / Delivery Address
    // ─────────────────────────────────────────────────────────────
    console.log("\n[5/6] Capturing 05-checkout.png...");
    await page.goto("http://localhost:5000/checkout", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 5000));

    const checkoutPath = path.join(SCREENSHOTS_DIR, "05-checkout.png");
    await page.screenshot({ path: checkoutPath, type: "png" });
    console.log("✓ Saved 05-checkout.png");

    // ─────────────────────────────────────────────────────────────
    // SCREEN 6: Orders / Order Tracking
    // ─────────────────────────────────────────────────────────────
    console.log("\n[6/6] Capturing 06-orders.png...");
    await page.goto("http://localhost:5000/orders", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 6000));

    const ordersPath = path.join(SCREENSHOTS_DIR, "06-orders.png");
    await page.screenshot({ path: ordersPath, type: "png" });
    console.log("✓ Saved 06-orders.png");

    console.log("\n=== ALL 6 PLAY STORE SCREENSHOTS SUCCESSFULLY CAPTURED ===");
  } catch (err) {
    console.error("Capture process failed:", err);
  } finally {
    await browser.close();
  }
}

main();
