const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots");
const BIZ_ASSETS_DIR = path.join(__dirname, "..", "intrihub-business", "assets");
const LOGO_PATH = path.join(BIZ_ASSETS_DIR, "intri-web-logo.png");
const ICON_PATH = path.join(BIZ_ASSETS_DIR, "icon.png");

function toBase64(filePath, mimeType) {
  if (!fs.existsSync(filePath)) return "";
  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

const logoBase64 = toBase64(LOGO_PATH, "image/png");
const iconBase64 = toBase64(ICON_PATH, "image/png");

async function generateBusinessFeatureGraphic() {
  console.log("Generating IntriHub Business Feature Graphic (1024x500)...");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IntriHub Business Feature Graphic</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 1024px;
      height: 500px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #031528;
      color: #ffffff;
      position: relative;
    }

    /* Ambient Background Elements */
    .bg-canvas {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 80% 20%, rgba(242, 101, 34, 0.22) 0%, transparent 42%),
        radial-gradient(circle at 20% 85%, rgba(14, 165, 233, 0.16) 0%, transparent 48%),
        radial-gradient(circle at 50% 10%, rgba(5, 42, 81, 0.8) 0%, transparent 60%),
        linear-gradient(135deg, #020f1e 0%, #052342 50%, #031527 100%);
      z-index: 1;
    }

    /* Tech Blueprint Grid */
    .blueprint-grid {
      position: absolute;
      inset: 0;
      background-size: 36px 36px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      z-index: 2;
    }

    /* Subtle Radial Glows */
    .glow-orb-orange {
      position: absolute;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(242, 101, 34, 0.28) 0%, transparent 70%);
      top: -100px;
      right: 120px;
      filter: blur(40px);
      z-index: 3;
    }

    .glow-orb-blue {
      position: absolute;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%);
      bottom: -120px;
      left: 60px;
      filter: blur(50px);
      z-index: 3;
    }

    /* Main Container */
    .container {
      position: relative;
      z-index: 10;
      width: 1024px;
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 46px 0 52px;
    }

    /* ─── LEFT COLUMN: TEXT & BRANDING ─── */
    .left-col {
      width: 535px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    /* Top Brand & Badge Row */
    .top-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .brand-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(12px);
      padding: 6px 14px 6px 10px;
      border-radius: 30px;
    }

    .brand-icon-img {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      object-fit: contain;
    }

    .brand-text {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    .badge-b2b {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, rgba(242, 101, 34, 0.25) 0%, rgba(234, 88, 12, 0.35) 100%);
      border: 1px solid rgba(242, 101, 34, 0.5);
      padding: 5px 12px;
      border-radius: 20px;
      color: #FF8A48;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
    }

    /* Headline & Subhead */
    .main-title {
      font-size: 40px;
      line-height: 1.12;
      font-weight: 900;
      letter-spacing: -1.2px;
      color: #ffffff;
      margin-bottom: 12px;
    }

    .main-title .highlight {
      background: linear-gradient(90deg, #F26522 0%, #FFA155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sub-title {
      font-size: 15px;
      line-height: 1.45;
      font-weight: 500;
      color: #94A3B8;
      margin-bottom: 24px;
      max-width: 480px;
    }

    /* Feature Grid (2x2) */
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      max-width: 500px;
    }

    .feature-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.09);
      padding: 10px 14px;
      border-radius: 12px;
      backdrop-filter: blur(8px);
    }

    .feature-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .icon-orange { background: rgba(242, 101, 34, 0.2); }
    .icon-blue   { background: rgba(14, 165, 233, 0.2); }
    .icon-green  { background: rgba(16, 185, 129, 0.2); }
    .icon-purple { background: rgba(168, 85, 247, 0.2); }

    .feature-text-block {
      display: flex;
      flex-direction: column;
    }

    .feature-title {
      font-size: 12px;
      font-weight: 800;
      color: #F1F5F9;
      letter-spacing: -0.2px;
    }

    .feature-sub {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 500;
      margin-top: 1px;
    }

    /* ─── RIGHT COLUMN: SMARTPHONE MOCKUP ─── */
    .right-col {
      width: 410px;
      height: 500px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Phone Body Wrapper with 3D Tilt */
    .phone-container {
      position: relative;
      width: 280px;
      height: 440px;
      background: #020B16;
      border-radius: 36px;
      border: 4px solid #1E293B;
      box-shadow: 
        0 25px 60px -12px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        0 0 40px rgba(242, 101, 34, 0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: translateY(15px) rotate(-1.5deg);
    }

    /* Speaker / Island notch */
    .phone-notch {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 70px;
      height: 14px;
      background: #0f172a;
      border-radius: 10px;
      z-index: 20;
    }

    /* Inner Screen Content */
    .phone-screen {
      flex: 1;
      background: #F8FAFC;
      color: #0F172A;
      padding: 24px 14px 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-size: 11px;
    }

    /* App Header in Phone */
    .app-screen-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-top: 6px;
    }

    .store-profile-chip {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .store-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #052A51;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
    }

    .store-name-text {
      font-size: 11px;
      font-weight: 800;
      color: #052A51;
      line-height: 1.1;
    }

    .store-badge-status {
      font-size: 9px;
      font-weight: 700;
      color: #10B981;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .app-quick-add {
      background: #F26522;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 8px;
    }

    /* Metric Revenue Card */
    .metric-banner {
      background: linear-gradient(135deg, #052A51 0%, #0A407B 100%);
      border-radius: 14px;
      padding: 12px 14px;
      color: #ffffff;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(5, 42, 81, 0.15);
    }

    .metric-label {
      font-size: 9px;
      font-weight: 700;
      color: #93C5FD;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .metric-val-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 2px;
    }

    .metric-amount {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }

    .metric-growth-pill {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 10px;
    }

    /* Live Dispatch Order Card */
    .order-dispatch-card {
      background: #FFFFFF;
      border-radius: 14px;
      padding: 11px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      margin-bottom: 8px;
    }

    .order-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .order-id-tag {
      font-weight: 800;
      color: #0F172A;
      font-size: 11px;
    }

    .order-timer-tag {
      background: #FEF3C7;
      color: #B45309;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .order-item-desc {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 6px;
    }

    .order-actions-row {
      display: flex;
      gap: 6px;
    }

    .action-btn-dispatch {
      flex: 1;
      background: #F26522;
      color: #ffffff;
      font-weight: 800;
      font-size: 9px;
      text-align: center;
      padding: 6px 0;
      border-radius: 7px;
    }

    .action-btn-invoice {
      background: #F1F5F9;
      color: #052A51;
      font-weight: 800;
      font-size: 9px;
      padding: 6px 8px;
      border-radius: 7px;
      border: 1px solid #CBD5E1;
    }

    /* Secondary Payout Tile */
    .payout-tile {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 9px 12px;
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .payout-tile-left {
      display: flex;
      flex-direction: column;
    }

    .payout-tile-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748B;
    }

    .payout-tile-val {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
    }

    .payout-badge-green {
      color: #10B981;
      font-weight: 800;
      font-size: 9px;
      background: #ECFDF5;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #A7F3D0;
    }

    /* Floating Badges */
    .floating-card-1 {
      position: absolute;
      top: 52px;
      right: -14px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(14px);
      padding: 10px 14px;
      border-radius: 14px;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 25;
      animation: float1 4s ease-in-out infinite;
    }

    .bell-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FEF3C7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .float-text-bold {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }

    .float-text-muted {
      font-size: 9px;
      color: #94A3B8;
      font-weight: 600;
      margin-top: 1px;
    }

    .floating-card-2 {
      position: absolute;
      bottom: 40px;
      left: 10px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      padding: 9px 14px;
      border-radius: 14px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 25;
    }

    .bolt-icon-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(242, 101, 34, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .float-dark-bold {
      font-size: 11px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.2;
    }

    .float-dark-muted {
      font-size: 9px;
      color: #64748B;
      font-weight: 600;
    }

  </style>
</head>
<body>

  <!-- Ambient Lighting -->
  <div class="bg-canvas"></div>
  <div class="blueprint-grid"></div>
  <div class="glow-orb-orange"></div>
  <div class="glow-orb-blue"></div>

  <div class="container">

    <!-- ─── LEFT COLUMN: VALUE PROPOSITION ─── -->
    <div class="left-col">
      
      <!-- Top Branding Badge -->
      <div class="top-badge-row">
        <div class="brand-pill">
          ${iconBase64 ? `<img src="${iconBase64}" class="brand-icon-img" alt="IntriHub" />` : `<span style="font-size: 16px;">🏢</span>`}
          <span class="brand-text">IntriHub Business</span>
        </div>
        <div class="badge-b2b">
          <span class="pulse-dot"></span>
          Vendor & Partner Console
        </div>
      </div>

      <!-- Main Headline -->
      <h1 class="main-title">
        Scale Your Retail & <br/>
        <span class="highlight">Quickcommerce Supply</span>
      </h1>

      <!-- Supporting Subheading -->
      <p class="sub-title">
        The complete B2B merchant operations platform for tile, sanitary & building material suppliers. Manage catalog, orders, and 60-min warehouse dispatch.
      </p>

      <!-- 2x2 Feature Matrix -->
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon-box icon-orange">⚡</div>
          <div class="feature-text-block">
            <span class="feature-title">Instant Order Alerts</span>
            <span class="feature-sub">Push notifications for new sales</span>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon-box icon-blue">📦</div>
          <div class="feature-text-block">
            <span class="feature-title">Live Inventory Control</span>
            <span class="feature-sub">Stock & pricing per sq.ft / box</span>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon-box icon-green">🧾</div>
          <div class="feature-text-block">
            <span class="feature-title">GST Invoice Printing</span>
            <span class="feature-sub">Direct thermal & Wi-Fi bills</span>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon-box icon-purple">💰</div>
          <div class="feature-text-block">
            <span class="feature-title">Verified Settlements</span>
            <span class="feature-sub">Direct bank payout ledger</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── RIGHT COLUMN: INTERACTIVE MOBILE UI MOCKUP ─── -->
    <div class="right-col">
      
      <!-- Floating Top Alert Badge -->
      <div class="floating-card-1">
        <div class="bell-icon-circle">🔔</div>
        <div>
          <div class="float-text-bold">New Order Received!</div>
          <div class="float-text-muted">₹18,400 • 24 Boxes Tiles</div>
        </div>
      </div>

      <!-- Phone Body -->
      <div class="phone-container">
        <div class="phone-notch"></div>
        
        <div class="phone-screen">
          <!-- Header -->
          <div class="app-screen-header">
            <div class="store-profile-chip">
              <div class="store-avatar">🏢</div>
              <div>
                <div class="store-name-text">IntriHub Store</div>
                <div class="store-badge-status">
                  <span>✓</span> Verified Merchant
                </div>
              </div>
            </div>
            <div class="app-quick-add">+ Product</div>
          </div>

          <!-- Total Sales Banner -->
          <div class="metric-banner">
            <div class="metric-label">Total Gross Sales</div>
            <div class="metric-val-row">
              <div class="metric-amount">₹2,48,500</div>
              <div class="metric-growth-pill">+18.4% ↗</div>
            </div>
          </div>

          <!-- Active Dispatch Card -->
          <div class="order-dispatch-card">
            <div class="order-card-top">
              <span class="order-id-tag">ORD-9482 (Packing)</span>
              <span class="order-timer-tag">⏱ 12m dispatch</span>
            </div>
            <div class="order-item-desc">
              Kajaria Royal Glazed Vitrified Tiles (600x600mm) • 24 Boxes
            </div>
            <div class="order-actions-row">
              <div class="action-btn-dispatch">Ready for Dispatch ⚡</div>
              <div class="action-btn-invoice">🧾 Invoice</div>
            </div>
          </div>

          <!-- Payout Settlement Card -->
          <div class="payout-tile">
            <div class="payout-tile-left">
              <span class="payout-tile-label">Available Balance</span>
              <span class="payout-tile-val">₹42,800</span>
            </div>
            <div class="payout-badge-green">Direct Settlement ✓</div>
          </div>

        </div>
      </div>

      <!-- Floating Bottom Hyperlocal Badge -->
      <div class="floating-card-2">
        <div class="bolt-icon-circle">⚡</div>
        <div>
          <div class="float-dark-bold">60-Min Hyperlocal Routing</div>
          <div class="float-dark-muted">Nearest-Vendor Rider Pickup</div>
        </div>
      </div>

    </div>

  </div>

</body>
</html>
`;

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
    ],
  });

  try {
    const page = await browser.newPage();

    // 1:1 Viewport at exactly 1024x500
    await page.setViewport({
      width: 1024,
      height: 500,
      deviceScaleFactor: 1,
    });

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200)); // Allow Google Fonts to finish rendering

    const jpgOutputPath = path.join(SCREENSHOTS_DIR, "business-featured-graphic.jpg");
    const pngOutputPath = path.join(SCREENSHOTS_DIR, "business-featured-graphic.png");

    // Capture exact 1024x500 JPEG at 95% quality (< 15 MB)
    await page.screenshot({
      path: jpgOutputPath,
      type: "jpeg",
      quality: 95,
      clip: { x: 0, y: 0, width: 1024, height: 500 },
    });
    console.log("✓ Saved JPEG (1024x500):", jpgOutputPath);

    // Capture exact 1024x500 PNG
    await page.screenshot({
      path: pngOutputPath,
      type: "png",
      clip: { x: 0, y: 0, width: 1024, height: 500 },
    });
    console.log("✓ Saved PNG (1024x500):", pngOutputPath);

    // Also copy to intrihub-business/assets for local retention
    const bizJpgPath = path.join(BIZ_ASSETS_DIR, "featured-graphic.jpg");
    const bizPngPath = path.join(BIZ_ASSETS_DIR, "featured-graphic.png");
    fs.copyFileSync(jpgOutputPath, bizJpgPath);
    fs.copyFileSync(pngOutputPath, bizPngPath);
    console.log("✓ Copied to intrihub-business/assets/");

    const jpgStat = fs.statSync(jpgOutputPath);
    const pngStat = fs.statSync(pngOutputPath);

    console.log(`JPEG File Size: ${(jpgStat.size / 1024).toFixed(1)} KB (Google Play limit: 15,360 KB)`);
    console.log(`PNG File Size:  ${(pngStat.size / 1024).toFixed(1)} KB`);
    console.log("Feature Graphic generation completed successfully!");
  } finally {
    await browser.close();
  }
}

generateBusinessFeatureGraphic().catch((err) => {
  console.error("Error generating business feature graphic:", err);
  process.exit(1);
});
