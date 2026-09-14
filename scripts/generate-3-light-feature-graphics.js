const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots");
const HOME_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "01-home.png");
const CAT_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "02-categories.png");
const PROD_SCREEN_PATH = path.join(SCREENSHOTS_DIR, "03-product-details.png");
const LOGO_PATH = path.join(__dirname, "..", "intrihub-mobile", "assets", "intri-web-logo.png");

const SITE_IMG_PATH = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\natural_interior_site_1789118611541.jpg";
const FLATLAY_IMG_PATH = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\natural_materials_flatlay_1789118673992.jpg";
const MATERIALS_IMG_PATH = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\materials_showcase_1789118085699.jpg";

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
const materialsImgBase64 = toBase64(MATERIALS_IMG_PATH, "image/jpeg");

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 1: LIGHT MODE - Natural Job Site & Quick Delivery
// ─────────────────────────────────────────────────────────────────────────────
function getLightOption1() {
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
    
    /* Background photo with sunlight */
    .bg-photo {
      position: absolute; top: 0; right: 0; width: 620px; height: 500px;
      background-image: url('${siteImgBase64}');
      background-size: cover; background-position: center right;
      filter: saturate(1.1) brightness(1.02);
      mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,1) 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,1) 100%);
      z-index: 1;
    }
    .bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, #f8fafc 0%, #f8fafc 44%, rgba(248,250,252,0.88) 64%, rgba(248,250,252,0.2) 100%);
      z-index: 2;
    }
    .grid-lines {
      position: absolute; inset: 0;
      background-size: 36px 36px;
      background-image: 
        linear-gradient(to right, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
      z-index: 3;
    }
    .sunlight-glow {
      position: absolute; top: -60px; left: 180px; width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.08) 0%, transparent 70%);
      filter: blur(40px); z-index: 4;
    }

    .container {
      position: relative; z-index: 10; width: 1024px; height: 500px;
      display: flex; align-items: center; justify-content: space-between; padding: 0 48px;
    }
    .left-col { width: 550px; display: flex; flex-direction: column; }
    
    .brand-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .logo-badge {
      background: #ffffff; padding: 7px 16px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06);
    }
    .logo-img { height: 32px; object-fit: contain; }
    
    .live-pill {
      background: rgba(255, 107, 0, 0.09); border: 1px solid rgba(255, 107, 0, 0.35);
      color: #ea580c; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 6px 12px; border-radius: 20px;
      display: flex; align-items: center; gap: 6px;
    }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ff6b00; box-shadow: 0 0 6px rgba(255, 107, 0, 0.8); }

    .title {
      font-size: 38px; font-weight: 900; line-height: 1.15; letter-spacing: -0.6px;
      color: #0f172a; margin-bottom: 12px;
    }
    .title .accent {
      color: #ff6b00;
    }

    .desc {
      font-size: 15px; font-weight: 500; line-height: 1.5; color: #475569;
      margin-bottom: 24px; max-width: 500px;
    }

    .features-row { display: flex; gap: 10px; margin-bottom: 20px; }
    .feature-tag {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      padding: 9px 14px; border-radius: 10px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #1e293b;
    }

    .ticker { font-size: 12px; font-weight: 600; color: #64748b; }
    .ticker b { color: #ff6b00; font-weight: 700; }

    /* Right Phone Showcase */
    .right-col { width: 340px; height: 500px; position: relative; display: flex; align-items: center; justify-content: center; }
    
    .phone-shadow {
      position: absolute; width: 230px; height: 420px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, rgba(15,23,42,0.1) 60%, transparent 80%);
      filter: blur(30px); z-index: 4;
    }

    .phone-box {
      position: relative; z-index: 8; width: 220px; height: 444px;
      background: #ffffff; border-radius: 32px; padding: 7px;
      box-shadow: 
        0 25px 50px -12px rgba(15, 23, 42, 0.28),
        0 8px 16px -4px rgba(15, 23, 42, 0.12),
        inset 0 0 0 1px rgba(15, 23, 42, 0.12);
      transform: perspective(1000px) rotateY(-8deg) rotateX(3deg);
    }
    .phone-notch {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      width: 10px; height: 10px; background: #0f172a; border-radius: 50%; z-index: 20;
    }
    .phone-screen { width: 100%; height: 100%; border-radius: 25px; overflow: hidden; background: #ffffff; }
    .phone-screen img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

    .badge-float-1 {
      position: absolute; top: 52px; left: -12px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      padding: 9px 14px; border-radius: 12px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
      display: flex; align-items: center; gap: 10px;
    }
    .badge-icon-orange {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #ff6b00, #ff8800);
      display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;
    }

    .badge-float-2 {
      position: absolute; bottom: 44px; right: 10px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      padding: 9px 14px; border-radius: 12px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
      display: flex; align-items: center; gap: 10px;
    }
    .badge-icon-green {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;
    }
  </style>
</head>
<body>
  <div class="bg-photo"></div>
  <div class="bg-overlay"></div>
  <div class="grid-lines"></div>
  <div class="sunlight-glow"></div>

  <div class="container">
    <div class="left-col">
      <div class="brand-row">
        <div class="logo-badge">
          <img src="${logoBase64}" class="logo-img" alt="IntriHub Logo" />
        </div>
        <div class="live-pill">
          <div class="live-dot"></div>
          Direct Site Delivery
        </div>
      </div>

      <h1 class="title">
        Building & Interior<br>
        Materials <span class="accent">Delivered to Site</span>
      </h1>

      <p class="desc">
        Source Tiles, Adhesives, Electricals, Plumbing, Paints & Hardware directly from verified manufacturers at wholesale factory prices.
      </p>

      <div class="features-row">
        <div class="feature-tag"><span>⚡</span> Express Site Delivery</div>
        <div class="feature-tag"><span>🏗️</span> 20+ Categories</div>
        <div class="feature-tag"><span>🏷️</span> Direct Factory Rates</div>
      </div>

      <div class="ticker">
        <b>POPULAR ON-SITE:</b> Tiles & Stone • Tile Adhesives • Electricals • Plumbing • Hardware
      </div>
    </div>

    <div class="right-col">
      <div class="phone-shadow"></div>
      
      <div class="badge-float-1">
        <div class="badge-icon-orange">⚡</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Fast Site Delivery</div>
          <div style="font-size: 10px; font-weight: 600; color: #0284c7;">Direct to Active Projects</div>
        </div>
      </div>

      <div class="phone-box">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img src="${homeScreenBase64}" alt="IntriHub App" />
        </div>
      </div>

      <div class="badge-float-2">
        <div class="badge-icon-green">✓</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">100% Genuine</div>
          <div style="font-size: 10px; font-weight: 600; color: #16a34a;">Verified Manufacturers</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 2: LIGHT MODE - Architect & Designer Natural Flatlay Moodboard
// ─────────────────────────────────────────────────────────────────────────────
function getLightOption2() {
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
      background: #f1f5f9; color: #0f172a; position: relative;
    }
    .bg-photo {
      position: absolute; top: 0; right: 0; width: 680px; height: 500px;
      background-image: url('${flatlayImgBase64}');
      background-size: cover; background-position: center right;
      filter: saturate(1.1) brightness(1.0);
      mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,1) 100%);
      z-index: 1;
    }
    .bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, #f1f5f9 0%, #f1f5f9 42%, rgba(241,245,249,0.92) 60%, rgba(241,245,249,0.3) 100%);
      z-index: 2;
    }
    .container {
      position: relative; z-index: 10; width: 1024px; height: 500px;
      display: flex; align-items: center; justify-content: space-between; padding: 0 48px;
    }
    .left-col { width: 540px; display: flex; flex-direction: column; }
    
    .brand-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .logo-badge {
      background: #ffffff; padding: 7px 16px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06);
    }
    .logo-img { height: 32px; object-fit: contain; }
    .arch-tag {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.1);
      color: #475569; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 6px 12px; border-radius: 20px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
    }

    .title {
      font-size: 38px; font-weight: 900; line-height: 1.15; letter-spacing: -0.6px;
      color: #0f172a; margin-bottom: 12px;
    }
    .title .accent {
      color: #ff6b00;
    }

    .desc {
      font-size: 15px; font-weight: 500; line-height: 1.5; color: #475569;
      margin-bottom: 22px; max-width: 490px;
    }

    .cards-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .card-stat {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      padding: 10px 16px; border-radius: 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    }
    .card-stat-num { font-size: 18px; font-weight: 900; color: #ff6b00; }
    .card-stat-lbl { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 2px; }

    .materials-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .mat-pill {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
      padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #334155;
    }

    /* Right Phone Showcase */
    .right-col { width: 360px; height: 500px; position: relative; display: flex; align-items: center; justify-content: center; }
    .phone-shadow {
      position: absolute; width: 240px; height: 430px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.22) 0%, rgba(15,23,42,0.1) 60%, transparent 80%);
      filter: blur(30px); z-index: 4;
    }
    .phone-box {
      position: relative; z-index: 8; width: 220px; height: 444px;
      background: #ffffff; border-radius: 32px; padding: 7px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3), inset 0 0 0 1px rgba(15,23,42,0.12);
      transform: perspective(1000px) rotateY(-6deg) rotateX(2deg);
    }
    .phone-notch {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      width: 10px; height: 10px; background: #0f172a; border-radius: 50%; z-index: 20;
    }
    .phone-screen { width: 100%; height: 100%; border-radius: 25px; overflow: hidden; background: #fff; }
    .phone-screen img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

    .badge-float-top {
      position: absolute; top: 48px; left: -10px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15);
      padding: 9px 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px;
    }
    .badge-icon-gold {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;
    }
  </style>
</head>
<body>
  <div class="bg-photo"></div>
  <div class="bg-overlay"></div>

  <div class="container">
    <div class="left-col">
      <div class="brand-row">
        <div class="logo-badge">
          <img src="${logoBase64}" class="logo-img" alt="IntriHub Logo" />
        </div>
        <div class="arch-tag">
          Architect & Builder Sourcing
        </div>
      </div>

      <h1 class="title">
        Source Premium Materials<br>
        at <span class="accent">Wholesale Factory Rates</span>
      </h1>

      <p class="desc">
        Explore 10,000+ curated Italian marble tiles, wooden finishes, luxury bath fixtures & construction chemicals directly on IntriHub.
      </p>

      <div class="cards-grid">
        <div class="card-stat">
          <div class="card-stat-num">20+</div>
          <div class="card-stat-lbl">Categories</div>
        </div>
        <div class="card-stat">
          <div class="card-stat-num">10,000+</div>
          <div class="card-stat-lbl">Verified SKUs</div>
        </div>
        <div class="card-stat">
          <div class="card-stat-num">Direct</div>
          <div class="card-stat-lbl">Factory Prices</div>
        </div>
      </div>

      <div class="materials-pills">
        <div class="mat-pill">Tiles & Stone</div>
        <div class="mat-pill">Natural Granite</div>
        <div class="mat-pill">Adhesives</div>
        <div class="mat-pill">Electricals</div>
        <div class="mat-pill">Bathware</div>
        <div class="mat-pill">Lighting</div>
      </div>
    </div>

    <div class="right-col">
      <div class="phone-shadow"></div>
      
      <div class="badge-float-top">
        <div class="badge-icon-gold">📦</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Order Sample Boxes</div>
          <div style="font-size: 10px; font-weight: 600; color: #d97706;">Feel Finish & Light on Site</div>
        </div>
      </div>

      <div class="phone-box">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img src="${catScreenBase64}" alt="IntriHub Catalog" />
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 3: LIGHT MODE - Modern Architectural Studio (Clean Minimalist Quick-Commerce)
// ─────────────────────────────────────────────────────────────────────────────
function getLightOption3() {
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
        radial-gradient(circle at 18% 22%, rgba(255, 107, 0, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 82% 65%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%);
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
    .materials-backdrop {
      position: absolute; top: -10px; right: -20px; width: 560px; height: 520px;
      background-image: url('${materialsImgBase64}');
      background-size: cover; background-position: center;
      opacity: 0.85; filter: saturate(1.1) brightness(1.0);
      mask-image: radial-gradient(ellipse at 65% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 70%);
      -webkit-mask-image: radial-gradient(ellipse at 65% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 70%);
      z-index: 3;
    }

    .container {
      position: relative; z-index: 10; width: 1024px; height: 500px;
      display: flex; align-items: center; justify-content: space-between; padding: 0 48px;
    }
    .left-col { width: 550px; display: flex; flex-direction: column; }
    
    .brand-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
    .brand-logo-card {
      background: #ffffff; padding: 7px 16px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06);
    }
    .brand-logo-img { height: 32px; object-fit: contain; }
    .badge-quick {
      background: rgba(255, 107, 0, 0.09); border: 1px solid rgba(255, 107, 0, 0.35);
      color: #ea580c; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 6px 12px; border-radius: 20px;
      display: flex; align-items: center; gap: 6px;
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff6b00; box-shadow: 0 0 6px rgba(255, 107, 0, 0.8); }

    .main-title {
      font-size: 40px; font-weight: 900; line-height: 1.15; letter-spacing: -0.8px;
      color: #0f172a; margin-bottom: 12px;
    }
    .main-title .highlight {
      color: #ff6b00;
    }

    .subtitle {
      font-size: 15px; font-weight: 500; line-height: 1.48; color: #475569;
      margin-bottom: 24px; max-width: 500px;
    }

    .pills-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
    .pill {
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      padding: 9px 14px; border-radius: 10px;
      display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #1e293b;
    }

    .category-ticker { font-size: 12px; font-weight: 600; color: #64748b; }
    .category-ticker span { color: #ff6b00; font-weight: 700; }

    /* Phone Showcase */
    .right-col { width: 360px; height: 500px; position: relative; display: flex; align-items: center; justify-content: center; }
    
    .phone-glow {
      position: absolute; width: 260px; height: 420px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.22) 0%, rgba(14, 165, 233, 0.15) 55%, transparent 75%);
      filter: blur(35px); z-index: 4;
    }
    .phone-frame {
      position: relative; z-index: 8; width: 222px; height: 446px;
      background: #ffffff; border-radius: 34px; padding: 7px;
      box-shadow: 
        0 25px 50px -12px rgba(15, 23, 42, 0.28),
        0 8px 16px -4px rgba(15, 23, 42, 0.12),
        inset 0 0 0 1px rgba(15, 23, 42, 0.12);
      transform: perspective(1000px) rotateY(-6deg) rotateX(2deg);
    }
    .phone-notch {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      width: 10px; height: 10px; background: #0f172a; border-radius: 50%; z-index: 20;
    }
    .phone-screen { width: 100%; height: 100%; border-radius: 26px; overflow: hidden; background: #ffffff; }
    .phone-screen img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

    .float-card-1 {
      position: absolute; top: 48px; left: 8px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15);
      padding: 9px 14px; border-radius: 14px; display: flex; align-items: center; gap: 10px;
    }
    .card-icon-box {
      width: 32px; height: 32px; border-radius: 9px;
      background: linear-gradient(135deg, #ff6b00, #ff8800);
      display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;
    }

    .float-card-2 {
      position: absolute; bottom: 38px; right: 10px; z-index: 15;
      background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.15);
      padding: 9px 14px; border-radius: 14px; display: flex; align-items: center; gap: 10px;
    }
    .card-icon-box-blue {
      width: 32px; height: 32px; border-radius: 9px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="grid-lines"></div>
  <div class="materials-backdrop"></div>

  <div class="container">
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
        <div class="pill"><span>⚡</span> Fast Site Delivery</div>
        <div class="pill"><span>🏗️</span> 20+ Categories</div>
        <div class="pill"><span>🏷️</span> Factory-Direct Pricing</div>
      </div>

      <div class="category-ticker">
        <span>POPULAR:</span> Tiles & Stone • Adhesives • Electrical • Plumbing • Sanitary • Hardware
      </div>
    </div>

    <div class="right-col">
      <div class="phone-glow"></div>

      <div class="float-card-1">
        <div class="card-icon-box">⚡</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Express Delivery</div>
          <div style="font-size: 10px; font-weight: 600; color: #0284c7;">Direct to Job Site</div>
        </div>
      </div>

      <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img src="${homeScreenBase64}" alt="IntriHub App" />
        </div>
      </div>

      <div class="float-card-2">
        <div class="card-icon-box-blue">✓</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">100% Genuine</div>
          <div style="font-size: 10px; font-weight: 600; color: #16a34a;">Verified Brands</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function renderLightOptions() {
  console.log("Rendering 3 Light Theme Feature Graphics (1024x500)...");
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

  const templates = [
    { id: 1, name: "featured-graphic-light-natural-site", fn: getLightOption1 },
    { id: 2, name: "featured-graphic-light-architect-palette", fn: getLightOption2 },
    { id: 3, name: "featured-graphic-light-modern-clean", fn: getLightOption3 },
  ];

  try {
    for (const t of templates) {
      console.log(`\nRendering Light Option ${t.id}: ${t.name}...`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
      await page.setContent(t.fn(), { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 1200));

      const pngPath = path.join(SCREENSHOTS_DIR, `${t.name}.png`);
      const jpgPath = path.join(SCREENSHOTS_DIR, `${t.name}.jpg`);

      await page.screenshot({ path: pngPath, type: "png", clip: { x: 0, y: 0, width: 1024, height: 500 } });
      await page.screenshot({ path: jpgPath, type: "jpeg", quality: 95, clip: { x: 0, y: 0, width: 1024, height: 500 } });

      const pngStat = fs.statSync(pngPath);
      const jpgStat = fs.statSync(jpgPath);
      console.log(`✓ Saved ${t.name}.png (${(pngStat.size / 1024).toFixed(1)} KB, 1024x500)`);
      console.log(`✓ Saved ${t.name}.jpg (${(jpgStat.size / 1024).toFixed(1)} KB, 1024x500)`);
      await page.close();
    }

    // Set the natural site light version as default featured-graphic.png
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, "featured-graphic-light-natural-site.png"),
      path.join(SCREENSHOTS_DIR, "featured-graphic.png")
    );
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, "featured-graphic-light-natural-site.jpg"),
      path.join(SCREENSHOTS_DIR, "featured-graphic.jpg")
    );
    console.log("\nDefault featured-graphic.png/.jpg updated with Light Natural Job-Site.");
  } finally {
    await browser.close();
  }
}

renderLightOptions().catch(console.error);
