const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots");
const HOME_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "01-home.png");
const LOGO_PATH = path.join(__dirname, "..", "intrihub-mobile", "assets", "intri-web-logo.png");
const MATERIALS_IMG_PATH = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\materials_showcase_1789118085699.jpg";

function toBase64(filePath, mimeType) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

async function createFeatureGraphic() {
  console.log("Preparing assets for Feature Graphic (1024x500)...");

  const homeScreenBase64 = toBase64(HOME_SCREEN_PATH, "image/png");
  const logoBase64 = toBase64(LOGO_PATH, "image/png");
  const materialsBase64 = toBase64(MATERIALS_IMG_PATH, "image/jpeg");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

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
      background: #060b14;
      color: #ffffff;
      position: relative;
    }

    /* Ambient background lighting */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 18% 25%, rgba(255, 107, 0, 0.18) 0%, transparent 45%),
        radial-gradient(circle at 82% 65%, rgba(20, 85, 200, 0.25) 0%, transparent 55%),
        radial-gradient(circle at 50% 90%, rgba(255, 122, 0, 0.12) 0%, transparent 50%),
        linear-gradient(135deg, #050a12 0%, #0a1322 50%, #060b14 100%);
      z-index: 1;
    }

    /* Blueprint grid pattern overlay */
    .blueprint-grid {
      position: absolute;
      inset: 0;
      background-size: 32px 32px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      z-index: 2;
    }

    /* Right side materials backdrop image with soft gradient blending */
    .materials-backdrop {
      position: absolute;
      top: -20px;
      right: -30px;
      width: 580px;
      height: 540px;
      background-image: url('${materialsBase64}');
      background-size: cover;
      background-position: center;
      border-radius: 24px;
      opacity: 0.35;
      filter: saturate(1.1) brightness(0.9);
      mask-image: radial-gradient(ellipse at 65% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%);
      -webkit-mask-image: radial-gradient(ellipse at 65% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%);
      z-index: 3;
    }

    .container {
      position: relative;
      z-index: 10;
      width: 1024px;
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px;
    }

    /* LEFT CONTENT AREA */
    .left-col {
      width: 560px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 22px;
    }

    .brand-logo-card {
      background: #ffffff;
      padding: 7px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .brand-logo-img {
      height: 32px;
      width: auto;
      object-fit: contain;
    }

    .badge-quick {
      background: rgba(255, 107, 0, 0.16);
      border: 1px solid rgba(255, 107, 0, 0.4);
      color: #ff944d;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff6b00;
      box-shadow: 0 0 8px #ff6b00;
    }

    .main-title {
      font-size: 40px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.8px;
      color: #ffffff;
      margin-bottom: 12px;
    }

    .main-title .highlight {
      background: linear-gradient(135deg, #ff8a00 0%, #ff5500 50%, #ffb300 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 16px;
      font-weight: 500;
      line-height: 1.45;
      color: #94a3b8;
      margin-bottom: 26px;
      max-width: 520px;
    }

    .pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 22px;
    }

    .pill {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      padding: 8px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .pill-icon {
      font-size: 14px;
    }

    .category-ticker {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.3px;
    }

    .category-ticker span {
      color: #ff944d;
      font-weight: 700;
    }

    /* RIGHT PHONE SHOWCASE */
    .right-col {
      width: 360px;
      height: 500px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Ambient glow behind phone */
    .phone-glow {
      position: absolute;
      width: 260px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.4) 0%, rgba(20, 85, 200, 0.25) 55%, transparent 75%);
      filter: blur(35px);
      z-index: 1;
    }

    /* Angled Phone Device Frame */
    .phone-frame {
      position: relative;
      z-index: 5;
      width: 222px;
      height: 446px;
      background: #0b111e;
      border-radius: 34px;
      padding: 7px;
      box-shadow: 
        0 24px 50px -10px rgba(0, 0, 0, 0.85),
        0 12px 25px -8px rgba(255, 107, 0, 0.25),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.2),
        inset 0 0 0 3px #1e293b;
      transform: perspective(1000px) rotateY(-6deg) rotateX(2deg);
      overflow: hidden;
    }

    /* Minimal punch-hole camera */
    .phone-notch {
      position: absolute;
      top: 13px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      background: #000000;
      border-radius: 50%;
      z-index: 20;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      border-radius: 26px;
      overflow: hidden;
      background: #ffffff;
      position: relative;
    }

    .phone-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
    }

    /* Floating Card 1: Fast Delivery */
    .float-card-1 {
      position: absolute;
      top: 48px;
      left: 8px;
      z-index: 15;
      background: rgba(11, 18, 32, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(14px);
      padding: 9px 14px;
      border-radius: 14px;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: linear-gradient(135deg, #ff6b00, #ff8800);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(255, 107, 0, 0.4);
    }

    .card-text-title {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }

    .card-text-sub {
      font-size: 10px;
      font-weight: 600;
      color: #38bdf8;
    }

    /* Floating Card 2: Factory Direct */
    .float-card-2 {
      position: absolute;
      bottom: 50px;
      right: 15px;
      z-index: 15;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      padding: 10px 14px;
      border-radius: 14px;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-icon-box-blue {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
    }

    .card-text-title-green {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }

    .card-text-sub-green {
      font-size: 10px;
      font-weight: 600;
      color: #4ade80;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="blueprint-grid"></div>
  <div class="materials-backdrop"></div>

  <div class="container">
    <!-- LEFT COLUMN -->
    <div class="left-col">
      <div class="brand-bar">
        <div class="brand-logo-card">
          <img src="${logoBase64}" class="brand-logo-img" alt="IntriHub Logo" />
        </div>
        <div class="badge-quick">
          <div class="badge-dot"></div>
          Building Materials Hub
        </div>
      </div>

      <h1 class="main-title">
        Building & Interior<br>
        <span class="highlight">Materials Marketplace</span>
      </h1>

      <p class="subtitle">
        Order Tiles, Adhesives, Electricals, Plumbing, Paints & Hardware directly from verified factories with fast site delivery.
      </p>

      <div class="pills-row">
        <div class="pill">
          <span class="pill-icon">⚡</span>
          <span>Fast Site Delivery</span>
        </div>
        <div class="pill">
          <span class="pill-icon">🏗️</span>
          <span>20+ Categories</span>
        </div>
        <div class="pill">
          <span class="pill-icon">🏷️</span>
          <span>Factory-Direct Pricing</span>
        </div>
      </div>

      <div class="category-ticker">
        <span>POPULAR:</span> Tiles & Stone • Adhesives • Electrical • Plumbing • Sanitary • Hardware
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="right-col">
      <div class="phone-glow"></div>

      <!-- Floating Card 1: Fast Delivery -->
      <div class="float-card-1">
        <div class="card-icon-box">⚡</div>
        <div>
          <div class="card-text-title">Express Delivery</div>
          <div class="card-text-sub">Direct to Job Site</div>
        </div>
      </div>

      <!-- Phone Mockup -->
      <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img src="${homeScreenBase64}" alt="IntriHub App Screen" />
        </div>
      </div>

      <!-- Floating Card 2: 100% Genuine -->
      <div class="float-card-2">
        <div class="card-icon-box-blue">✓</div>
        <div>
          <div class="card-text-title-green">100% Genuine</div>
          <div class="card-text-sub-green">Verified Brands</div>
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

    // Set viewport EXACTLY to 1024x500 at 1:1 scale
    await page.setViewport({
      width: 1024,
      height: 500,
      deviceScaleFactor: 1,
    });

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500)); // Allow font and images to render completely

    const pngPath = path.join(SCREENSHOTS_DIR, "featured-graphic.png");
    const jpgPath = path.join(SCREENSHOTS_DIR, "featured-graphic.jpg");

    // Capture exact 1024x500 PNG
    await page.screenshot({
      path: pngPath,
      type: "png",
      clip: { x: 0, y: 0, width: 1024, height: 500 },
    });
    console.log("✓ Saved 1024x500 PNG:", pngPath);

    // Also capture exact 1024x500 JPEG with 95% quality (well within 15 MB)
    await page.screenshot({
      path: jpgPath,
      type: "jpeg",
      quality: 95,
      clip: { x: 0, y: 0, width: 1024, height: 500 },
    });
    console.log("✓ Saved 1024x500 JPEG:", jpgPath);

    const pngStat = fs.statSync(pngPath);
    const jpgStat = fs.statSync(jpgPath);

    console.log(`PNG Size: ${(pngStat.size / 1024).toFixed(1)} KB`);
    console.log(`JPEG Size: ${(jpgStat.size / 1024).toFixed(1)} KB`);
  } finally {
    await browser.close();
  }
}

createFeatureGraphic().catch(console.error);
