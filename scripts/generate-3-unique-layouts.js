const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots");
const HOME_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "01-home.png");
const CAT_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "02-categories.png");
const PROD_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "03-product-details.png");
const LOGO_PATH = path.join(__dirname, "..", "intrihub-mobile", "assets", "intri-web-logo.png");

const ASSETS_DIR = path.join(SCREENSHOTS_DIR, "assets");
const SITE_IMG_PATH = path.join(ASSETS_DIR, "natural_interior_site.jpg");
const FLATLAY_IMG_PATH = path.join(ASSETS_DIR, "natural_materials_flatlay.jpg");

function toBase64(filePath, mimeType) {
  if (!fs.existsSync(filePath)) return "";
  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

const homeScreenBase64 = toBase64(HOME_SCREEN_PATH, "image/png");
const catScreenBase64 = toBase64(CAT_SCREEN_PATH, "image/png");
const prodScreenBase64 = toBase64(PROD_SCREEN_PATH, "image/png");
const logoBase64 = toBase64(LOGO_PATH, "image/png");
const siteImgBase64 = toBase64(SITE_IMG_PATH, "image/jpeg");
const flatlayImgBase64 = toBase64(FLATLAY_IMG_PATH, "image/jpeg");

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 1: CENTERED HERO — "The Complete Materials Store"
// Focus: Wide Catalog Variety, Easy Mobile Ordering, Sample Box
// ─────────────────────────────────────────────────────────────────────────────
function getLayout1() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px; height: 500px; overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f8fafc; color: #0f172a; position: relative;
    }
    .bg-gradient {
      position: absolute; inset: 0;
      background: 
        radial-gradient(circle at 50% 0%, rgba(255, 107, 0, 0.12) 0%, transparent 60%),
        radial-gradient(circle at 10% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, rgba(255, 107, 0, 0.08) 0%, transparent 50%),
        linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
      z-index: 1;
    }
    .grid-lines {
      position: absolute; inset: 0;
      background-size: 32px 32px;
      background-image: 
        linear-gradient(to right, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
      z-index: 2;
    }
    .bg-texture-left {
      position: absolute; bottom: 0; left: 0; width: 320px; height: 360px;
      background-image: url('${flatlayImgBase64}');
      background-size: cover; background-position: left bottom;
      opacity: 0.15; filter: saturate(1.1);
      mask-image: radial-gradient(circle at 0% 100%, rgba(0,0,0,1) 25%, transparent 75%);
      -webkit-mask-image: radial-gradient(circle at 0% 100%, rgba(0,0,0,1) 25%, transparent 75%);
      z-index: 3;
    }
    .bg-texture-right {
      position: absolute; bottom: 0; right: 0; width: 320px; height: 360px;
      background-image: url('${siteImgBase64}');
      background-size: cover; background-position: right bottom;
      opacity: 0.15; filter: saturate(1.1);
      mask-image: radial-gradient(circle at 100% 100%, rgba(0,0,0,1) 25%, transparent 75%);
      -webkit-mask-image: radial-gradient(circle at 100% 100%, rgba(0,0,0,1) 25%, transparent 75%);
      z-index: 3;
    }

    .container {
      position: relative; z-index: 10; width: 1024px; height: 500px;
      display: flex; flex-direction: column; align-items: center;
      padding: 24px 36px 0;
    }

    .top-bar {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      margin-bottom: 10px;
    }
    .brand-card {
      background: #ffffff; padding: 7px 18px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06);
      display: flex; align-items: center;
    }
    .brand-logo { height: 32px; object-fit: contain; }
    .badge-pill {
      background: #ffffff; border: 1px solid rgba(255, 107, 0, 0.4);
      color: #ea580c; font-size: 11px; font-weight: 800; letter-spacing: 0.6px;
      padding: 6px 14px; border-radius: 20px; text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(255, 107, 0, 0.1);
    }

    .main-title {
      font-size: 34px; font-weight: 900; line-height: 1.15; text-align: center;
      color: #0f172a; letter-spacing: -0.6px; margin-bottom: 6px;
    }
    .main-title span { color: #ff6b00; }
    .subtitle {
      font-size: 14px; font-weight: 600; color: #64748b; text-align: center;
      margin-bottom: 16px;
    }

    .badges-row {
      display: flex; justify-content: center; gap: 12px; margin-bottom: 16px;
    }
    .badge-item {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
      padding: 7px 16px; border-radius: 10px;
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; color: #1e293b;
    }

    .phones-stage {
      position: relative; width: 680px; height: 320px;
      display: flex; justify-content: center; align-items: flex-start;
      margin-top: 4px;
    }

    .phone-left {
      width: 175px; height: 350px; background: #ffffff; border-radius: 26px; padding: 6px;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25), inset 0 0 0 1px rgba(15,23,42,0.12);
      transform: perspective(900px) rotateY(16deg) rotateZ(-3deg) translateX(30px) translateY(10px);
      z-index: 5; overflow: hidden;
    }
    .phone-left img { width: 100%; height: 100%; border-radius: 20px; object-fit: cover; object-position: top; }

    .phone-center {
      width: 195px; height: 390px; background: #ffffff; border-radius: 30px; padding: 6px;
      box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15,23,42,0.12);
      z-index: 10; overflow: hidden;
    }
    .phone-center img { width: 100%; height: 100%; border-radius: 24px; object-fit: cover; object-position: top; }

    .phone-right {
      width: 175px; height: 350px; background: #ffffff; border-radius: 26px; padding: 6px;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25), inset 0 0 0 1px rgba(15,23,42,0.12);
      transform: perspective(900px) rotateY(-16deg) rotateZ(3deg) translateX(-30px) translateY(10px);
      z-index: 5; overflow: hidden;
    }
    .phone-right img { width: 100%; height: 100%; border-radius: 20px; object-fit: cover; object-position: top; }

    .float-pill-left {
      position: absolute; top: 35px; left: 40px; z-index: 20;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
      padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
    }
    .float-pill-right {
      position: absolute; top: 35px; right: 40px; z-index: 20;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
      padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="grid-lines"></div>
  <div class="bg-texture-left"></div>
  <div class="bg-texture-right"></div>

  <div class="container">
    <div class="top-bar">
      <div class="brand-card">
        <img src="${logoBase64}" class="brand-logo" alt="IntriHub Logo" />
      </div>
      <div class="badge-pill">Construction & Interiors</div>
    </div>

    <h1 class="main-title">
      All Building Materials <span>in One Mobile App</span>
    </h1>
    <p class="subtitle">
      Order Tiles, Adhesives, Electricals, Plumbing, Bathware & Hardware in 3 simple taps
    </p>

    <div class="badges-row">
      <div class="badge-item"><span>🏗️</span> 20+ Categories</div>
      <div class="badge-item"><span>📦</span> Order Tile Sample Boxes</div>
      <div class="badge-item"><span>📱</span> Live Order Tracking</div>
      <div class="badge-item"><span>✨</span> Area & Tile Calculator</div>
    </div>

    <div class="phones-stage">
      <div class="float-pill-left">
        <span style="color: #ff6b00; font-size: 16px;">📦</span>
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Sample Box Service</div>
          <div style="font-size: 10px; font-weight: 600; color: #ea580c;">Test Finish at Your Home</div>
        </div>
      </div>

      <div class="phone-left">
        <img src="${catScreenBase64}" alt="Categories" />
      </div>

      <div class="phone-center">
        <img src="${homeScreenBase64}" alt="Home" />
      </div>

      <div class="phone-right">
        <img src="${prodScreenBase64}" alt="Product Details" />
      </div>

      <div class="float-pill-right">
        <span style="color: #0284c7; font-size: 16px;">🔍</span>
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">10,000+ Items</div>
          <div style="font-size: 10px; font-weight: 600; color: #0284c7;">Explore Complete Catalog</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 2: EDITORIAL ARCHITECTURAL MOSAIC — "Direct Job-Site Delivery"
// Focus: On-Site Speed, Logistics, Job-Site Convenience, Safe Unloading
// ─────────────────────────────────────────────────────────────────────────────
function getLayout2() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px; height: 500px; overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #ffffff; color: #0f172a; position: relative;
    }

    .container {
      width: 1024px; height: 500px; display: flex;
    }

    .left-side {
      width: 490px; height: 500px; padding: 38px 40px 38px 48px;
      display: flex; flex-direction: column; justify-content: space-between;
      background: #ffffff; z-index: 5;
    }

    .logo-container {
      display: flex; align-items: center; gap: 12px;
    }
    .logo-img { height: 36px; object-fit: contain; }
    .badge-speed {
      background: #fff7ed; border: 1px solid #fed7aa;
      color: #ea580c; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
      padding: 5px 10px; border-radius: 6px; text-transform: uppercase;
    }

    .headline-block h1 {
      font-size: 38px; font-weight: 900; line-height: 1.15; letter-spacing: -0.8px;
      color: #0f172a; margin-bottom: 10px;
    }
    .headline-block h1 span { color: #ff6b00; }
    .headline-block p {
      font-size: 15px; font-weight: 500; line-height: 1.5; color: #64748b;
    }

    .value-cards {
      display: flex; flex-direction: column; gap: 10px;
    }
    .value-card {
      background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 10px 14px; border-radius: 12px;
      display: flex; align-items: center; gap: 12px;
    }
    .val-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .val-icon-orange { background: rgba(255, 107, 0, 0.12); color: #ea580c; }
    .val-icon-blue { background: rgba(2, 132, 199, 0.12); color: #0284c7; }
    .val-icon-green { background: rgba(16, 185, 129, 0.12); color: #059669; }
    .val-title { font-size: 13px; font-weight: 800; color: #0f172a; }
    .val-sub { font-size: 11px; font-weight: 500; color: #64748b; }

    .bottom-tag {
      font-size: 12px; font-weight: 700; color: #94a3b8;
    }
    .bottom-tag b { color: #ff6b00; }

    .right-side {
      width: 534px; height: 500px; position: relative;
      background: #f1f5f9; display: grid; grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr; gap: 12px; padding: 16px;
    }

    .mosaic-1 {
      grid-column: 1 / 2; grid-row: 1 / 3;
      border-radius: 16px; overflow: hidden; position: relative;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    }
    .mosaic-1 img { width: 100%; height: 100%; object-fit: cover; }
    .mosaic-caption {
      position: absolute; bottom: 0; inset-inline: 0;
      background: linear-gradient(0deg, rgba(15, 23, 42, 0.85) 0%, transparent 100%);
      padding: 16px 14px 12px; color: #ffffff;
    }
    .mosaic-caption-title { font-size: 12px; font-weight: 800; }
    .mosaic-caption-sub { font-size: 10px; font-weight: 500; color: #cbd5e1; }

    .mosaic-2 {
      grid-column: 2 / 3; grid-row: 1 / 2;
      border-radius: 16px; overflow: hidden; position: relative;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
    }
    .mosaic-2 img { width: 100%; height: 100%; object-fit: cover; }

    .mosaic-3 {
      grid-column: 2 / 3; grid-row: 2 / 3;
      background: #ffffff; border-radius: 16px; padding: 10px 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px;
    }
    .mini-phone-thumb {
      width: 76px; height: 120px; border-radius: 10px; overflow: hidden; flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .mini-phone-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
    .mini-card-info { flex: 1; }
    .mini-badge {
      display: inline-block; background: #eff6ff; color: #0284c7;
      font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 4px;
      margin-bottom: 6px;
    }
    .mini-title { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 4px; }
    .mini-desc { font-size: 10px; font-weight: 500; color: #64748b; line-height: 1.3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-side">
      <div class="logo-container">
        <img src="${logoBase64}" class="logo-img" alt="IntriHub Logo" />
        <div class="badge-speed">⚡ Fast Site Delivery</div>
      </div>

      <div class="headline-block">
        <h1>
          Delivered Directly<br>
          <span>to Your Project Site</span>
        </h1>
        <p>Never halt construction. Get tiles, adhesives, pipes & hardware dropped right at your location.</p>
      </div>

      <div class="value-cards">
        <div class="value-card">
          <div class="val-icon val-icon-orange">⚡</div>
          <div>
            <div class="val-title">Quick Site Fulfillment</div>
            <div class="val-sub">Fast dispatch for ongoing renovation & building sites</div>
          </div>
        </div>
        <div class="value-card">
          <div class="val-icon val-icon-blue">🚚</div>
          <div>
            <div class="val-title">Safe Material Handling</div>
            <div class="val-sub">Professional transport & careful job-site unloading</div>
          </div>
        </div>
        <div class="value-card">
          <div class="val-icon val-icon-green">📍</div>
          <div>
            <div class="val-title">Pinpoint GPS Delivery</div>
            <div class="val-sub">Accurate delivery to plot, apartment, or commercial floor</div>
          </div>
        </div>
      </div>

      <div class="bottom-tag">
        <b>TRUSTED BY:</b> Contractors • Architects • Interior Designers • Homeowners
      </div>
    </div>

    <div class="right-side">
      <div class="mosaic-1">
        <img src="${siteImgBase64}" alt="Tile Installation Site" />
        <div class="mosaic-caption">
          <div class="mosaic-caption-title">Direct to Job Site</div>
          <div class="mosaic-caption-sub">Serving ongoing construction projects</div>
        </div>
      </div>

      <div class="mosaic-2">
        <img src="${flatlayImgBase64}" alt="Material Palette" />
      </div>

      <div class="mosaic-3">
        <div class="mini-phone-thumb">
          <img src="${homeScreenBase64}" alt="IntriHub App" />
        </div>
        <div class="mini-card-info">
          <div class="mini-badge">REAL-TIME DISPATCH</div>
          <div class="mini-title">Track Material Trucks Live</div>
          <div class="mini-desc">Stay updated on driver arrival & shipment status.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 3: DYNAMIC TECH FLOW — "Best Price & 100% Trusted Quality"
// Focus: Best Price Guarantee, Genuine Brand Authenticity, Transparent Billing
// ─────────────────────────────────────────────────────────────────────────────
function getLayout3() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px; height: 500px; overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f8fafc; color: #0f172a; position: relative;
    }

    .bg-gradient {
      position: absolute; inset: 0;
      background: 
        radial-gradient(circle at 85% 20%, rgba(255, 107, 0, 0.1) 0%, transparent 45%),
        radial-gradient(circle at 20% 80%, rgba(2, 132, 199, 0.08) 0%, transparent 45%),
        linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%);
      z-index: 1;
    }
    .grid-lines {
      position: absolute; inset: 0;
      background-size: 32px 32px;
      background-image: 
        linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
      z-index: 2;
    }

    .container {
      position: relative; z-index: 10; width: 1024px; height: 500px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px;
    }

    .left-side {
      width: 420px; height: 500px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    
    .glow-circle {
      position: absolute; width: 280px; height: 420px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.25) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 75%);
      filter: blur(35px); z-index: 3;
    }

    .phone-box {
      position: relative; z-index: 8; width: 226px; height: 448px;
      background: #ffffff; border-radius: 34px; padding: 7px;
      box-shadow: 
        0 25px 50px -12px rgba(15, 23, 42, 0.3),
        0 8px 16px -4px rgba(15, 23, 42, 0.12),
        inset 0 0 0 1px rgba(15, 23, 42, 0.12);
      transform: perspective(1000px) rotateY(8deg) rotateX(2deg);
      overflow: hidden;
    }
    .phone-notch {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      width: 10px; height: 10px; background: #0f172a; border-radius: 50%; z-index: 20;
    }
    .phone-screen { width: 100%; height: 100%; border-radius: 26px; overflow: hidden; background: #ffffff; }
    .phone-screen img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

    .chip-1 {
      position: absolute; top: 52px; left: 10px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15);
      padding: 8px 12px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
    }
    .chip-thumb {
      width: 32px; height: 32px; border-radius: 6px; overflow: hidden;
    }
    .chip-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .chip-title { font-size: 11px; font-weight: 800; color: #0f172a; }
    .chip-sub { font-size: 9px; font-weight: 600; color: #ff6b00; }

    .chip-2 {
      position: absolute; bottom: 44px; right: 10px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15);
      padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
    }
    .chip-icon-green {
      width: 28px; height: 28px; border-radius: 6px;
      background: #10b981; color: #ffffff;
      display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800;
    }

    .right-side {
      width: 490px; display: flex; flex-direction: column; justify-content: center;
    }

    .brand-bar {
      display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
    }
    .brand-logo-card {
      background: #ffffff; padding: 7px 16px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06);
    }
    .brand-logo-img { height: 32px; object-fit: contain; }
    .badge-trust {
      background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #059669; font-size: 11px; font-weight: 800; letter-spacing: 0.6px;
      padding: 6px 12px; border-radius: 20px; text-transform: uppercase;
    }

    .main-title {
      font-size: 38px; font-weight: 900; line-height: 1.15; letter-spacing: -0.6px;
      color: #0f172a; margin-bottom: 10px;
    }
    .main-title span { color: #ff6b00; }
    
    .subtitle {
      font-size: 14px; font-weight: 500; line-height: 1.45; color: #64748b;
      margin-bottom: 20px;
    }

    .feature-stack {
      display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;
    }
    .stack-row {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      padding: 10px 14px; border-radius: 12px;
      display: flex; align-items: center; gap: 12px;
    }
    .stack-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .stack-icon-orange { background: rgba(255, 107, 0, 0.1); color: #ff6b00; }
    .stack-icon-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .stack-icon-blue { background: rgba(2, 132, 199, 0.1); color: #0284c7; }

    .stack-text-title { font-size: 13px; font-weight: 800; color: #0f172a; }
    .stack-text-sub { font-size: 11px; font-weight: 500; color: #64748b; }

    .ticker-line {
      font-size: 12px; font-weight: 600; color: #94a3b8;
    }
    .ticker-line b { color: #ff6b00; }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="grid-lines"></div>

  <div class="container">
    <div class="left-side">
      <div class="glow-circle"></div>

      <div class="chip-1">
        <div class="chip-thumb">
          <img src="${flatlayImgBase64}" alt="Marble Tile" />
        </div>
        <div>
          <div class="chip-title">Tiles & Stone</div>
          <div class="chip-sub">Premium Quality</div>
        </div>
      </div>

      <div class="phone-box">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img src="${catScreenBase64}" alt="App Categories" />
        </div>
      </div>

      <div class="chip-2">
        <div class="chip-icon-green">✓</div>
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">100% Genuine</div>
          <div style="font-size: 9px; font-weight: 600; color: #16a34a;">Manufacturer Warranty</div>
        </div>
      </div>
    </div>

    <div class="right-side">
      <div class="brand-bar">
        <div class="brand-logo-card">
          <img src="${logoBase64}" class="brand-logo-img" alt="IntriHub Logo" />
        </div>
        <div class="badge-trust">
          Verified Quality
        </div>
      </div>

      <h1 class="main-title">
        Best Price.<br>
        <span>100% Trusted Products.</span>
      </h1>

      <p class="subtitle">
        Transparent pricing on genuine construction materials from top certified manufacturers.
      </p>

      <div class="feature-stack">
        <div class="stack-row">
          <div class="stack-icon stack-icon-orange">🏷️</div>
          <div>
            <div class="stack-text-title">Guaranteed Best Price</div>
            <div class="stack-text-sub">Transparent rates with zero hidden commission or broker fees</div>
          </div>
        </div>

        <div class="stack-row">
          <div class="stack-icon stack-icon-green">🛡️</div>
          <div>
            <div class="stack-text-title">100% Trusted Brands</div>
            <div class="stack-text-sub">Sourced only from certified factories with genuine manufacturer warranty</div>
          </div>
        </div>

        <div class="stack-row">
          <div class="stack-icon stack-icon-blue">💳</div>
          <div>
            <div class="stack-text-title">Secure Payments & COD</div>
            <div class="stack-text-sub">Pay safely via UPI, NetBanking, Cards or Cash on Delivery at site</div>
          </div>
        </div>
      </div>

      <div class="ticker-line">
        <b>ASSURANCE:</b> Quality Inspected • Certified Genuine • Easy Site Returns
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function renderCleanAndFinalize() {
  console.log("Generating 3 distinct non-repeating feature graphics...");

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

  const finalGraphics = [
    {
      fileBase: "07-feature-graphic-store",
      title: "Feature Graphic 1: Complete App & Variety",
      fn: getLayout1,
    },
    {
      fileBase: "08-feature-graphic-delivery",
      title: "Feature Graphic 2: Express Site Delivery",
      fn: getLayout2,
    },
    {
      fileBase: "09-feature-graphic-best-price",
      title: "Feature Graphic 3: Best Price & Trusted Quality",
      fn: getLayout3,
    },
  ];

  try {
    for (const g of finalGraphics) {
      console.log(`\nRendering ${g.title}...`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
      await page.setContent(g.fn(), { waitUntil: "domcontentloaded" });
      await new Promise((r) => setTimeout(r, 2000));

      const pngPath = path.join(SCREENSHOTS_DIR, `${g.fileBase}.png`);
      await page.screenshot({ path: pngPath, type: "png", clip: { x: 0, y: 0, width: 1024, height: 500 } });

      console.log(`✓ Saved ${g.fileBase}.png (${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB)`);
      await page.close();
    }

    // CLEAN UP OLD DUPLICATE / INTERMEDIATE FILES
    console.log("\nCleaning up redundant and intermediate test graphics...");
    const filesToDelete = [
      "featured-graphic-light-architect-palette.jpg",
      "featured-graphic-light-architect-palette.png",
      "featured-graphic-light-modern-clean.jpg",
      "featured-graphic-light-modern-clean.png",
      "featured-graphic-light-natural-site.jpg",
      "featured-graphic-light-natural-site.png",
      "style-1-centered-hero.jpg",
      "style-1-centered-hero.png",
      "style-2-architectural-mosaic.jpg",
      "style-2-architectural-mosaic.png",
      "style-3-dynamic-flow.jpg",
      "style-3-dynamic-flow.png",
      "test-render.png"
    ];

    for (const f of filesToDelete) {
      const p = path.join(SCREENSHOTS_DIR, f);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`Deleted redundant file: ${f}`);
      }
    }

    console.log("\n=== ALL GRAPHICS FINALIZED & CLEANED ===");
  } finally {
    await browser.close();
  }
}

renderCleanAndFinalize().catch(console.error);
