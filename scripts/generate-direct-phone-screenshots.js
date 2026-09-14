const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "play-store-screenshots", "business");
const BIZ_ASSETS_DIR = path.join(__dirname, "..", "intrihub-business", "assets");
const ICON_PATH = path.join(BIZ_ASSETS_DIR, "icon.png");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function toBase64(filePath, mimeType) {
  if (!fs.existsSync(filePath)) return "";
  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

const iconBase64 = toBase64(ICON_PATH, "image/png");

function getBottomTabBar(activeTab) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: "products", label: "My Products", iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>` },
    { id: "orders", label: "Orders", iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>` },
    { id: "earnings", label: "Earnings", iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3a4 4 0 0 0 0-8"/><path d="M9 13h1"/></svg>` },
    { id: "profile", label: "Store Profile", iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  ];

  return `
    <div class="direct-bottom-tabbar">
      ${tabs.map(t => {
        const isActive = t.id === activeTab;
        return `
          <div class="tab-item ${isActive ? "tab-item-active" : ""}">
            <div class="tab-svg-icon">${t.iconSvg}</div>
            <div class="tab-label-text">${t.label}</div>
          </div>
        `;
      }).join("")}
    </div>
    <div class="home-indicator-bar"><div class="home-indicator-pill"></div></div>
  `;
}

// 6 Direct Phone Screens filling the 1080x1920 canvas
const SCREENS = [
  {
    filename: "01-vendor-dashboard",
    activeTab: "dashboard",
    renderScreen: `
      <!-- Store Top Bar -->
      <div class="store-topbar">
        <div class="store-topbar-left">
          <div class="store-logo-box">
            ${iconBase64 ? `<img src="${iconBase64}" class="store-logo-img" alt="Logo" />` : `🏢`}
          </div>
          <div>
            <div class="store-badge-row">
              <span class="badge-biz">VENDOR CONSOLE</span>
              <span class="badge-verified">✓ Verified Partner</span>
            </div>
            <div class="store-title-text">Sri Balaji Electricals & Tiles</div>
          </div>
        </div>
        <div class="add-product-cta">+ Add Product</div>
      </div>

      <!-- Total Revenue Hero Card -->
      <div class="revenue-hero-card">
        <div class="rev-header-row">
          <div>
            <div class="rev-subtitle">Total Gross Sales</div>
            <div class="rev-amount">₹3,42,850</div>
          </div>
          <div class="growth-chip">+22.8% this week ↗</div>
        </div>

        <div class="rev-stats-grid">
          <div class="rev-stat-col">
            <div class="rev-stat-lbl">Orders Fulfilled</div>
            <div class="rev-stat-val">184</div>
          </div>
          <div class="stat-sep"></div>
          <div class="rev-stat-col">
            <div class="rev-stat-lbl">Avg Order Value</div>
            <div class="rev-stat-val">₹1,863</div>
          </div>
          <div class="stat-sep"></div>
          <div class="rev-stat-col">
            <div class="rev-stat-lbl">Customer Rating</div>
            <div class="rev-stat-val">4.9 ★</div>
          </div>
        </div>
      </div>

      <!-- Two Metric Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-orange">⏱</div>
          <div class="kpi-num" style="color: #F26522;">6 Orders</div>
          <div class="kpi-label">Active in Warehouse</div>
          <div class="kpi-sub">3 in packing stage</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-blue">📦</div>
          <div class="kpi-num" style="color: #052A51;">48 Items</div>
          <div class="kpi-label">Live Store Inventory</div>
          <div class="kpi-sub">920 boxes available</div>
        </div>
      </div>

      <!-- Section Title -->
      <div class="sec-heading-row">
        <div class="sec-heading">Live Incoming Order Queue</div>
        <div class="sec-link">View All (14) →</div>
      </div>

      <!-- Order Card 1 (Packing) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip">#ORD-9842</span>
          <span class="timer-chip">⏱ 14m dispatch target</span>
        </div>
        <div class="order-prod-name">Kajaria Vitrified Floor Tiles (600x600mm)</div>
        <div class="order-specs">28 Boxes • Glazed Polished Finish • ₹19,200 (Paid)</div>
        <div class="order-customer-line">📍 Koramangala 4th Block, Bengaluru • 3.2 km away</div>
        <div class="action-btn-row">
          <div class="btn-dispatch">Ready for Dispatch ⚡</div>
          <div class="btn-print">Print Slip 🧾</div>
        </div>
      </div>

      <!-- Order Card 2 (Out for Delivery) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #ECFDF5; color: #065F46;">#ORD-9839</span>
          <span class="status-chip-green">✓ Out for Delivery</span>
        </div>
        <div class="order-prod-name">Roff T01 NCA High Bond Tile Adhesive (30kg)</div>
        <div class="order-specs">6 Bags • ₹2,580 • Assigned Rider: Ramesh K.</div>
        <div class="order-customer-line">📍 HSR Layout Sector 2, Bengaluru • Estimated 18 min</div>
        <div class="action-btn-row">
          <div class="btn-outline">Track Delivery Live 📍</div>
          <div class="btn-print">Tax Invoice</div>
        </div>
      </div>

      <!-- Order Card 3 (Delivered) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-9835</span>
          <span class="status-chip-gray">Delivered 11:30 AM</span>
        </div>
        <div class="order-prod-name">Hindware Flora Ceramic Countertop Basin</div>
        <div class="order-specs">2 Units • White Gloss • ₹7,400 • Handoff Verified</div>
        <div class="order-customer-line">📍 Indiranagar 100ft Road • Customer OTP Confirmed</div>
      </div>

      <!-- Order Card 4 (Packing / Self-Pickup) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip">#ORD-9828</span>
          <span class="timer-chip">⏱ 22m dispatch target</span>
        </div>
        <div class="order-prod-name">Somany 300x450 Glossy Ceramic Wall Tiles</div>
        <div class="order-specs">14 Boxes • Classic White • ₹8,064 • Self-Pickup by Contractor</div>
        <div class="action-btn-row">
          <div class="btn-outline-green">✓ Ready for Handover</div>
          <div class="btn-print">Slip</div>
        </div>
      </div>

      <!-- Order Card 5 (Delivered) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-9821</span>
          <span class="status-chip-gray">Delivered 10:15 AM</span>
        </div>
        <div class="order-prod-name">Asian Paints TruCare Epoxy Tile Grout (5kg)</div>
        <div class="order-specs">4 Buckets • Ivory White • ₹3,400 • Koramangala 5th Block</div>
      </div>

      <!-- Order Card 6 (Delivered) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-9815</span>
          <span class="status-chip-gray">Delivered Yesterday</span>
        </div>
        <div class="order-prod-name">Jaquar Continental Chrome Single Lever Basin Mixer</div>
        <div class="order-specs">2 Units • ₹4,900 • Customer Verified Handoff</div>
      </div>

      <!-- Order Card 7 (Delivered) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-9808</span>
          <span class="status-chip-gray">Delivered Yesterday</span>
        </div>
        <div class="order-prod-name">Cera Rimless Wall Hung Ceramic Closet</div>
        <div class="order-specs">1 Unit • White Ceramic • ₹6,950 • Electronic Pod Signed</div>
      </div>

      <!-- Order Card 8 (Delivered) -->
      <div class="order-list-card" style="margin-bottom: 0;">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-9799</span>
          <span class="status-chip-gray">Delivered 11 Sep</span>
        </div>
        <div class="order-prod-name">UltraTech Tile Fix Waterproof Adhesive (30kg)</div>
        <div class="order-specs">8 Bags • ₹2,800 • B2B Site Delivery Verified</div>
      </div>
    `
  },
  {
    filename: "02-orders-dispatch",
    activeTab: "orders",
    renderScreen: `
      <!-- Header -->
      <div class="top-nav-bar">
        <div>
          <div class="nav-title">Order Fulfillment</div>
          <div class="nav-sub">Real-time warehouse dispatch queue</div>
        </div>
        <div class="auto-accept-badge">⚡ Auto-Accept: ON</div>
      </div>

      <!-- Status Tabs -->
      <div class="tab-chips-row">
        <div class="tab-chip-pill pill-active">All (14)</div>
        <div class="tab-chip-pill">Pending (2)</div>
        <div class="tab-chip-pill">Packing (4)</div>
        <div class="tab-chip-pill">Dispatched (8)</div>
      </div>

      <!-- Urgent Dispatch Hero Card -->
      <div class="urgent-dispatch-box">
        <div class="urgent-header-row">
          <div class="urgent-red-tag">URGENT DISPATCH TARGET</div>
          <div class="urgent-timer">⏱ 08:42 Left</div>
        </div>
        <div class="urgent-order-title">Order #ORD-7712 • ₹14,800</div>
        
        <div class="urgent-item-box">
          <div class="urgent-item-icon">📦</div>
          <div>
            <div class="urgent-item-name">Somany Glazed Ceramic Wall Tiles</div>
            <div class="urgent-item-sub">18 Boxes • Glossy White • 300x450mm</div>
          </div>
        </div>

        <div class="urgent-address-pill">
          📍 <strong>Destination:</strong> Flat 302, Green Glen Layout, Bellandur, Bengaluru
        </div>

        <div class="btn-dispatch-big">Mark Packed & Notify Rider 🚚</div>
      </div>

      <!-- Order Item 1 (Packing Stage) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip">#ORD-7709</span>
          <span class="timer-chip" style="background: #FFF7ED; color: #C2410C;">Packing Stage</span>
        </div>
        <div class="order-prod-name">Asian Paints TruCare Tile Grout & Spacer Kit</div>
        <div class="order-specs">Qty: 12 Units • ₹3,240 • Self-Pickup by Buyer</div>
        <div class="order-customer-line">📍 Store Counter Pickup • Customer Arriving 15:00</div>
        <div class="action-btn-row">
          <div class="btn-outline-green">✓ Ready for Handover</div>
          <div class="btn-print">Tax Invoice 🧾</div>
        </div>
      </div>

      <!-- Order Item 2 (Rider Arriving) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #EFF6FF; color: #1E40AF;">#ORD-7704</span>
          <span class="status-chip-green">Rider Arriving (4 min)</span>
        </div>
        <div class="order-prod-name">Kajaria Double Charge Floor Tiles (600x600)</div>
        <div class="order-specs">Qty: 16 Boxes • ₹12,800 • Express Delivery Mode</div>
        <div class="order-customer-line">📍 IntriHub Express Rider: Sunil M. (+91 98450 XXXXX)</div>
        <div class="action-btn-row">
          <div class="btn-dispatch">Handover to Rider 🛵</div>
          <div class="btn-print">Slip</div>
        </div>
      </div>

      <!-- Order Item 3 (Assigned Mini-Truck) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F5F3FF; color: #5B21B6;">#ORD-7699</span>
          <span class="timer-chip" style="background: #EDE9FE; color: #5B21B6;">Heavy Cargo Transport</span>
        </div>
        <div class="order-prod-name">UltraTech Super Tile Adhesive Grey (30kg)</div>
        <div class="order-specs">Qty: 25 Bags • ₹8,750 • Assigned Tata Ace Mini-Truck</div>
        <div class="order-customer-line">📍 Site Delivery: Sarjapur Main Road • Gate Pass Ready</div>
        <div class="action-btn-row">
          <div class="btn-outline">Call Driver 📞</div>
          <div class="btn-print">Gate Pass 📋</div>
        </div>
      </div>

      <!-- Order Item 4 (Dispatched) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #EFF6FF; color: #1E40AF;">#ORD-7691</span>
          <span class="status-chip-green">En Route • ETA 12 min</span>
        </div>
        <div class="order-prod-name">Asian Paints SmartCare Damp Block 20L</div>
        <div class="order-specs">Qty: 4 Cans • ₹11,200 • Dispatched via Electric Van</div>
        <div class="order-customer-line">📍 Koramangala 1st Block • IntriHub Verified Rider</div>
      </div>

      <!-- Order Item 5 (Delivered) -->
      <div class="order-list-card">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-7695</span>
          <span class="status-chip-gray">Delivered 12:40 PM</span>
        </div>
        <div class="order-prod-name">Hindware Flora Ceramic Counter Washbasin</div>
        <div class="order-specs">Qty: 1 Unit • ₹4,250 • Delivered by IntriHub Logistics</div>
        <div class="order-customer-line">📍 Jayanagar 4th Block • Digital Signature Captured</div>
      </div>

      <!-- Order Item 6 (Delivered) -->
      <div class="order-list-card" style="margin-bottom: 0;">
        <div class="order-card-header">
          <span class="order-id-chip" style="background: #F1F5F9; color: #475569;">#ORD-7688</span>
          <span class="status-chip-gray">Delivered 11:15 AM</span>
        </div>
        <div class="order-prod-name">Jaquar Continental Brass Basin Mixer Tap</div>
        <div class="order-specs">Qty: 2 Units • ₹4,900 • OTP Verified Handoff</div>
      </div>
    `
  },
  {
    filename: "03-catalog-inventory",
    activeTab: "products",
    renderScreen: `
      <!-- Header -->
      <div class="top-nav-bar">
        <div>
          <div class="nav-title">Catalog & Inventory</div>
          <div class="nav-sub">48 products listed • 46 in stock</div>
        </div>
        <div class="add-product-cta">+ Add Product</div>
      </div>

      <!-- Search Bar -->
      <div class="catalog-search-bar">
        <span style="font-size: 20px;">🔍</span>
        <span style="color: #94A3B8; font-size: 16px;">Search tiles, adhesives, sanitaryware...</span>
      </div>

      <!-- Category Filter Pills -->
      <div class="category-scroll-row">
        <div class="cat-pill pill-selected">All Items (48)</div>
        <div class="cat-pill">Floor Tiles (24)</div>
        <div class="cat-pill">Wall Tiles (12)</div>
        <div class="cat-pill">Adhesives (8)</div>
        <div class="cat-pill">Sanitary (4)</div>
      </div>

      <!-- Product Card 1 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🔲</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Kajaria Double Charge Vitrified Floor Tiles</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Floor Tiles • Size: 600x600mm • Polished</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹64</strong> / sq.ft <span class="inv-price-sub">(₹896 / Box)</span>
            </div>
            <div class="inv-stock-pill">📦 140 Boxes</div>
          </div>
        </div>
      </div>

      <!-- Product Card 2 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🧪</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Roff T01 NCA High Bond Tile Adhesive (30kg)</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Tile Chemicals • Grey High-Bond Adhesive</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹430</strong> / bag <span class="inv-price-sub">MRP: ₹480</span>
            </div>
            <div class="inv-stock-pill">📦 65 Bags</div>
          </div>
        </div>
      </div>

      <!-- Product Card 3 (Low Stock) -->
      <div class="inventory-product-card" style="border-left: 5px solid #F59E0B;">
        <div class="inv-prod-thumb">🚰</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Hindware Italian Marble Countertop Sink</div>
            <div class="badge-stock-low">Low: 4 Left</div>
          </div>
          <div class="inv-prod-meta">Category: Sanitaryware • Gloss White Finish</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹3,850</strong> / piece <span class="inv-price-sub">MRP: ₹4,500</span>
            </div>
            <div class="toggle-status-green">Active 🟢</div>
          </div>
        </div>
      </div>

      <!-- Product Card 4 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🧱</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Somany 300x450 Glossy Ceramic Wall Tiles</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Wall Tiles • Ceramic Gloss Bathroom Tile</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹48</strong> / sq.ft <span class="inv-price-sub">(₹576 / Box)</span>
            </div>
            <div class="inv-stock-pill">📦 82 Boxes</div>
          </div>
        </div>
      </div>

      <!-- Product Card 5 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🎨</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Asian Paints Epoxy Waterproof Tile Grout</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Grout & Sealants • 5kg Bucket • Ivory</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹850</strong> / bucket <span class="inv-price-sub">MRP: ₹950</span>
            </div>
            <div class="inv-stock-pill">📦 34 Buckets</div>
          </div>
        </div>
      </div>

      <!-- Product Card 6 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🚿</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Jaquar Lyric Single Lever Tall Basin Mixer</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: CP Brass Fittings • Chrome Plated</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹3,200</strong> / piece <span class="inv-price-sub">MRP: ₹3,600</span>
            </div>
            <div class="inv-stock-pill">📦 18 Units</div>
          </div>
        </div>
      </div>

      <!-- Product Card 7 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🚽</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Cera Wall Hung Coupled Ceramic Closet (EWC)</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Sanitaryware • Rimless Soft Close Seat</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹6,950</strong> / piece <span class="inv-price-sub">MRP: ₹7,800</span>
            </div>
            <div class="inv-stock-pill">📦 9 Units</div>
          </div>
        </div>
      </div>

      <!-- Product Card 8 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">📐</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Tile Leveling System Clips & Wedges (2mm)</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Tiling Tools • 500 Pcs Master Bag</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹420</strong> / pack <span class="inv-price-sub">MRP: ₹500</span>
            </div>
            <div class="inv-stock-pill">📦 45 Packs</div>
          </div>
        </div>
      </div>

      <!-- Product Card 9 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🛡️</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Dr. Fixit Fastflex Waterproofing Coating 12kg</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Waterproofing • Polymer Modified Slurry</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹2,150</strong> / bucket <span class="inv-price-sub">MRP: ₹2,400</span>
            </div>
            <div class="inv-stock-pill">📦 22 Buckets</div>
          </div>
        </div>
      </div>

      <!-- Product Card 10 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🚰</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Kohler Modern Chrome Plated Angle Stop Cock</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Bathroom Valves • Solid Brass Core</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹680</strong> / piece <span class="inv-price-sub">MRP: ₹790</span>
            </div>
            <div class="inv-stock-pill">📦 54 Pieces</div>
          </div>
        </div>
      </div>

      <!-- Product Card 11 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🪚</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Bosch Diamond Ceramic & Granite Cutting Blade</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Power Tool Accessories • 4 Inch (105mm)</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹390</strong> / piece <span class="inv-price-sub">MRP: ₹450</span>
            </div>
            <div class="inv-stock-pill">📦 38 Blades</div>
          </div>
        </div>
      </div>

      <!-- Product Card 12 -->
      <div class="inventory-product-card">
        <div class="inv-prod-thumb">🧼</div>
        <div class="inv-prod-body">
          <div class="inv-prod-header">
            <div class="inv-prod-title">Fila PS87 Heavy Duty Tile & Grout Cleaner 1L</div>
            <div class="badge-stock-in">In Stock</div>
          </div>
          <div class="inv-prod-meta">Category: Surface Care • Professional Degreaser</div>
          <div class="inv-prod-footer">
            <div class="inv-price-block">
              <strong>₹750</strong> / bottle <span class="inv-price-sub">MRP: ₹850</span>
            </div>
            <div class="inv-stock-pill">📦 26 Bottles</div>
          </div>
        </div>
      </div>

      <!-- Bulk Template Bar -->
      <div class="bulk-template-bar">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">📄</span>
          <div>
            <div style="font-weight: 800; font-size: 14px; color: #C2410C;">Bulk CSV / Excel Inventory Update</div>
            <div style="font-size: 12px; color: #9A3412;">Upload master catalog for 100+ items at once</div>
          </div>
        </div>
        <div class="bulk-upload-btn">Upload ↗</div>
      </div>
    `
  },
  {
    filename: "04-tax-invoicing",
    activeTab: "orders",
    renderScreen: `
      <!-- Header -->
      <div class="top-nav-bar">
        <div>
          <div class="nav-title">GST Tax Invoice</div>
          <div class="nav-sub">Order #ORD-REV-8492 • Official Commercial Tax Bill</div>
        </div>
        <div class="badge-gst-green">GST COMPLIANT ✓</div>
      </div>

      <!-- Full Invoice Paper Sheet -->
      <div class="invoice-paper-card">
        <!-- Brand & Number Header -->
        <div class="inv-doc-header">
          <div>
            <div class="inv-doc-title">INTRIHUB B2B TAX INVOICE</div>
            <div class="inv-doc-sub">Original for Recipient • Reverse Charge: NO • E-Way Bill: Valid</div>
          </div>
          <div class="inv-doc-no">
            <div>Invoice No: <strong>INT-2026-0984</strong></div>
            <div>Date: <strong>13 Sep 2026</strong></div>
            <div>Place of Supply: <strong>Karnataka (29)</strong></div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <!-- Supplier & Buyer Details Grid -->
        <div class="doc-parties-grid">
          <div class="party-col">
            <div class="party-hdr">SUPPLIER (REGISTERED VENDOR):</div>
            <div class="party-bold">Sri Balaji Electricals & Tiles</div>
            <div class="party-dtl">GSTIN: 29AABCS1429B1Z8</div>
            <div class="party-dtl">42, 10th Cross, Begur Main Road</div>
            <div class="party-dtl">Bengaluru, Karnataka - 560068</div>
            <div class="party-dtl">Phone: +91 98450 12345</div>
          </div>
          <div class="party-col">
            <div class="party-hdr">BUYER (CONSIGNEE):</div>
            <div class="party-bold">Rahul Sharma (Contractor)</div>
            <div class="party-dtl">GSTIN: 29AAAPL4819Q1ZT</div>
            <div class="party-dtl">Flat 402, Royal Palms, 5th Block</div>
            <div class="party-dtl">Koramangala, Bengaluru - 560034</div>
            <div class="party-dtl">Phone: +91 98765 43210</div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <!-- Itemized Table Header -->
        <div class="doc-table-head">
          <div style="flex: 2.2;">Description of Goods</div>
          <div style="flex: 1; text-align: center;">HSN</div>
          <div style="flex: 0.9; text-align: center;">Qty</div>
          <div style="flex: 1; text-align: right;">Rate</div>
          <div style="flex: 1.2; text-align: right;">Amount</div>
        </div>

        <!-- Item 1 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Kajaria Royal Glazed Vitrified Tiles (600x600)</div>
          <div style="flex: 1; text-align: center;">6907</div>
          <div style="flex: 0.9; text-align: center;">24 Bx</div>
          <div style="flex: 1; text-align: right;">₹800</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹19,200</div>
        </div>

        <!-- Item 2 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Roff T01 NCA High Bond Tile Adhesive (30kg)</div>
          <div style="flex: 1; text-align: center;">3506</div>
          <div style="flex: 0.9; text-align: center;">4 Bags</div>
          <div style="flex: 1; text-align: right;">₹430</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹1,720</div>
        </div>

        <!-- Item 3 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Asian Paints Waterproof Tile Grout (5kg)</div>
          <div style="flex: 1; text-align: center;">3214</div>
          <div style="flex: 0.9; text-align: center;">2 Buckets</div>
          <div style="flex: 1; text-align: right;">₹850</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹1,700</div>
        </div>

        <!-- Item 4 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Heavy-Duty Tile Spacers & Levelers (2mm Kit)</div>
          <div style="flex: 1; text-align: center;">7318</div>
          <div style="flex: 0.9; text-align: center;">5 Packs</div>
          <div style="flex: 1; text-align: right;">₹160</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹800</div>
        </div>

        <!-- Item 5 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Dr. Fixit Waterproofing Chemical Primer (1L)</div>
          <div style="flex: 1; text-align: center;">3824</div>
          <div style="flex: 0.9; text-align: center;">2 Bottles</div>
          <div style="flex: 1; text-align: right;">₹320</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹640</div>
        </div>

        <!-- Item 6 -->
        <div class="doc-table-row">
          <div style="flex: 2.2; font-weight: 800; color: #0F172A;">Bosch Diamond Turbo Tile Cutting Blade (105mm)</div>
          <div style="flex: 1; text-align: center;">8202</div>
          <div style="flex: 0.9; text-align: center;">2 Blades</div>
          <div style="flex: 1; text-align: right;">₹390</div>
          <div style="flex: 1.2; text-align: right; font-weight: 800;">₹780</div>
        </div>

        <div class="doc-divider"></div>

        <!-- Tax & Totals Breakdown -->
        <div class="doc-totals-box">
          <div class="total-line"><span>Taxable Subtotal:</span> <strong>₹24,840.00</strong></div>
          <div class="total-line"><span>Central GST (CGST @ 9.0%):</span> <strong>₹2,235.60</strong></div>
          <div class="total-line"><span>State GST (SGST @ 9.0%):</span> <strong>₹2,235.60</strong></div>
          <div class="total-line"><span>Total GST Amount (18%):</span> <strong>₹4,471.20</strong></div>
          <div class="total-line-grand">
            <span>INVOICE GRAND TOTAL (INR):</span>
            <span class="grand-num">₹29,311.20</span>
          </div>
          <div class="words-line">Amount in Words: <em>INR Twenty-Nine Thousand Three Hundred Eleven and Twenty Paise Only</em></div>
        </div>

        <div class="doc-divider"></div>

        <!-- Payment Details & Bank Details -->
        <div class="doc-footer-details">
          <div>
            <div>Payment Mode: <strong>Prepaid via UPI (Razorpay Verified)</strong></div>
            <div>UTR Ref: <strong>UPI/398102839182/AXIS</strong> • IRN: 9f8a32d4e8c109...</div>
            <div style="margin-top: 4px; color: #10B981; font-weight: 700;">✓ NIC e-Invoice Portal Authenticated & E-Way Bill Generated</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #052A51;">For Sri Balaji Electricals & Tiles</div>
            <div class="signature-box">Authorized Signatory [Digitally Signed]</div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <!-- Bank Details for RTGS/NEFT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; color: #475569; background: #F8FAFC; padding: 10px 14px; border-radius: 10px;">
          <div>Bank Name: <strong>HDFC Bank Ltd</strong></div>
          <div>Account No: <strong>50200049201948</strong></div>
          <div>Account Name: <strong>Sri Balaji Electricals</strong></div>
          <div>IFSC Code: <strong>HDFC0001842 (Begur Branch)</strong></div>
        </div>

        <div class="doc-divider"></div>

        <!-- Commercial Terms -->
        <div style="font-size: 11px; color: #64748B; line-height: 1.45;">
          <strong>Commercial Terms:</strong> 1. Goods once inspected and delivered are subject to standard IntriHub replacement policy. 2. Any transit breakage must be reported within 24 hours of delivery. 3. All disputes subject to Bengaluru jurisdiction.
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="invoice-action-row">
        <div class="btn-print-thermal">🖨️ Print 3" Thermal Slip</div>
        <div class="btn-share-pdf">📄 Share PDF (WhatsApp)</div>
      </div>
    `
  },
  {
    filename: "05-bank-settlements",
    activeTab: "earnings",
    renderScreen: `
      <!-- Header -->
      <div class="top-nav-bar">
        <div>
          <div class="nav-title">Earnings & Payouts</div>
          <div class="nav-sub">Direct bank settlements & financial overview</div>
        </div>
        <div class="badge-status-ok">SETTLEMENTS ACTIVE</div>
      </div>

      <!-- Payout Highlight Card -->
      <div class="payout-banner-card">
        <div class="payout-banner-label">AVAILABLE SETTLEMENT BALANCE</div>
        <div class="payout-banner-val">₹68,450.00</div>
        <div class="payout-banner-sub">Next automatic payout: <strong>Tomorrow, 10:00 AM (NEFT)</strong></div>

        <div class="payout-stats-row">
          <div class="payout-stat-item">
            <div class="payout-stat-lbl">Total Settled</div>
            <div class="payout-stat-num">₹4,82,900</div>
          </div>
          <div class="payout-stat-sep"></div>
          <div class="payout-stat-item">
            <div class="payout-stat-lbl">Platform Fee</div>
            <div class="payout-stat-num">10.0%</div>
          </div>
          <div class="payout-stat-sep"></div>
          <div class="payout-stat-item">
            <div class="payout-stat-lbl">Payout Cycle</div>
            <div class="payout-stat-num">T+1 Day</div>
          </div>
        </div>
      </div>

      <!-- Verified Bank Account Box -->
      <div class="bank-account-card">
        <div class="bank-header-line">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🏦</span>
            <strong style="font-size: 16px; color: #052A51;">Verified Settlement Bank Account</strong>
          </div>
          <div class="bank-verified-tag">Verified ✓</div>
        </div>

        <div class="bank-detail-grid">
          <div>Account Holder: <strong>Sri Balaji Electricals</strong></div>
          <div>Bank Name: <strong>HDFC Bank Ltd</strong></div>
          <div>Account Number: <strong>•••• •••• •••• 4920</strong></div>
          <div>IFSC Code: <strong>HDFC0001842</strong></div>
        </div>
      </div>

      <!-- Tax Deduction / TDS Summary Card -->
      <div class="tds-summary-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px; color: #052A51;">Income Tax Sec 194-O TDS & TCS Summary</div>
            <div style="font-size: 12px; color: #64748B;">1% TDS deposited directly to PAN: <strong>AABCS1429B</strong></div>
          </div>
          <div class="tds-download-chip">Form 16A ↗</div>
        </div>
      </div>

      <!-- Section Title -->
      <div class="sec-heading-row" style="margin-top: 14px; margin-bottom: 10px;">
        <div class="sec-heading">Recent Payout Ledger</div>
        <div class="sec-link">Download Statement ↗</div>
      </div>

      <!-- Payout Row 1 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84920194821</div>
          <div class="ledger-date">10 Sep 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹52,400</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 2 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84810294711</div>
          <div class="ledger-date">03 Sep 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹48,920</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 3 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84690184722</div>
          <div class="ledger-date">27 Aug 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹61,250</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 4 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84510984112</div>
          <div class="ledger-date">20 Aug 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹44,180</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 5 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84390192801</div>
          <div class="ledger-date">13 Aug 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹39,800</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 6 -->
      <div class="ledger-row-card">
        <div>
          <div class="ledger-utr">UTR: HDFC84210983190</div>
          <div class="ledger-date">06 Aug 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹55,600</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>

      <!-- Payout Row 7 -->
      <div class="ledger-row-card" style="margin-bottom: 0;">
        <div>
          <div class="ledger-utr">UTR: HDFC84091823901</div>
          <div class="ledger-date">30 Jul 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="ledger-amt">+₹41,350</div>
          <div class="ledger-status-ok">Settled ✓</div>
        </div>
      </div>
    `
  },
  {
    filename: "06-store-logistics-profile",
    activeTab: "profile",
    renderScreen: `
      <!-- Header -->
      <div class="top-nav-bar">
        <div>
          <div class="nav-title">Store Logistics & Profile</div>
          <div class="nav-sub">Configure delivery method, GPS & auto-accept</div>
        </div>
        <div class="badge-quick-orange">⚡ Quickcommerce Ready</div>
      </div>

      <!-- Store Profile Identity Card -->
      <div class="profile-setting-card">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
          <div class="store-avatar-big">🏢</div>
          <div>
            <div style="font-size: 18px; font-weight: 900; color: #052A51;">Sri Balaji Electricals & Tiles</div>
            <div style="font-size: 13px; color: #10B981; font-weight: 700; margin-top: 2px;">✓ Verified Partner ID: VND-BLR-0492</div>
            <div style="font-size: 13px; color: #64748B; margin-top: 2px;">GSTIN: 29AABCS1429B1Z8 • Phone: +91 98450 12345</div>
          </div>
        </div>
      </div>

      <!-- GPS Setup Card -->
      <div class="profile-setting-card">
        <div class="card-head-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📍</span>
            <strong style="font-size: 16px; color: #052A51;">Store Warehouse GPS Pin</strong>
          </div>
          <div style="color: #F26522; font-weight: 800; font-size: 13px;">View on Map ↗</div>
        </div>
        <div class="card-desc-text">
          Precise GPS pin enables 60-minute nearest-vendor order routing and delivery rider navigation.
        </div>
        <div class="gps-coords-display">
          <div>Latitude: <strong>12.9716° N</strong></div>
          <div>Longitude: <strong>77.5946° E</strong></div>
        </div>
        <div class="radius-chip">
          <span>Service Coverage Radius: <strong>12 km</strong> (Bengaluru South & East)</span>
        </div>
      </div>

      <!-- Logistics Method Selector -->
      <div class="profile-setting-card">
        <div style="font-weight: 800; font-size: 16px; color: #052A51; margin-bottom: 10px;">
          Logistics & Fulfillment Method
        </div>

        <div class="method-option-card method-selected">
          <div class="radio-checked">●</div>
          <div>
            <div class="method-title">⚡ IntriHub Platform Logistics (Automated)</div>
            <div class="method-desc">IntriHub express rider picks up from your warehouse within 15 minutes of packing.</div>
          </div>
        </div>

        <div class="method-option-card" style="margin-top: 8px;">
          <div class="radio-unchecked">○</div>
          <div>
            <div class="method-title">🚛 Self-Delivery (Manual Fleet)</div>
            <div class="method-desc">Vendor uses own delivery vans or transport partners to fulfill orders.</div>
          </div>
        </div>
      </div>

      <!-- Operating Hours Card -->
      <div class="profile-setting-card">
        <div class="card-head-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🕒</span>
            <strong style="font-size: 16px; color: #052A51;">Operating Hours & Dispatch SLA</strong>
          </div>
          <div style="color: #10B981; font-weight: 800; font-size: 13px;">Open Now 🟢</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #334155; margin-top: 6px;">
          <div>Monday - Saturday: <strong>08:30 AM - 08:30 PM</strong></div>
          <div>Sunday: <strong>09:30 AM - 04:00 PM</strong></div>
        </div>
      </div>

      <!-- Auto Accept Toggle -->
      <div class="auto-accept-toggle-box">
        <div>
          <div class="toggle-headline">⚡ Auto-Accept Orders</div>
          <div class="toggle-subline">Instantly confirms incoming orders & starts the 10m packing timer.</div>
        </div>
        <div class="switch-outer">
          <div class="switch-inner"></div>
        </div>
      </div>

      <!-- Order Alerts & Sound Preferences -->
      <div class="profile-setting-card">
        <div class="card-head-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🔔</span>
            <strong style="font-size: 16px; color: #052A51;">Incoming Order Ringtone & Alerts</strong>
          </div>
          <div style="color: #10B981; font-weight: 800; font-size: 13px;">Loud Alert Active</div>
        </div>
        <div style="font-size: 13px; color: #64748B;">Continuous high-volume alarm plays until warehouse team accepts order.</div>
      </div>

      <!-- Warehouse Staff Accounts Card -->
      <div class="profile-setting-card">
        <div class="card-head-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">👥</span>
            <strong style="font-size: 16px; color: #052A51;">Warehouse Staff & Picker Accounts</strong>
          </div>
          <div style="color: #F26522; font-weight: 800; font-size: 13px;">Manage (3) ↗</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
          <div>Active Pickers: <strong>Manoj K. & Sunil R.</strong></div>
          <div>Permission: <strong>Dispatch & Barcode Scan Only</strong></div>
        </div>
      </div>

      <!-- 24x7 Partner Support Bar -->
      <div class="partner-support-card">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🎧</span>
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #0F172A;">24*7 Vendor Partner Support Desk</div>
            <div style="font-size: 12px; color: #64748B;">WhatsApp direct line, dispute resolution & dedicated account manager</div>
          </div>
        </div>
        <div class="support-contact-btn">Help →</div>
      </div>
    `
  }
];

function generateHtml(screen) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${screen.filename}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F8FAFC;
      color: #0F172A;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* ─── NATIVE ANDROID STATUS BAR (TOP) ─── */
    .direct-status-bar {
      height: 64px;
      background: #052A51;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 42px;
      font-size: 20px;
      font-weight: 800;
      z-index: 50;
      letter-spacing: 0.5px;
    }

    .status-icons-right {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 18px;
    }

    /* ─── MAIN APP VIEWPORT (FILLS CANVAS) ─── */
    .direct-app-body {
      flex: 1;
      padding: 24px 36px 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #F8FAFC;
    }

    .screen-02-orders-dispatch {
      justify-content: space-between;
    }

    .screen-04-tax-invoicing {
      justify-content: space-between;
    }

    .screen-04-tax-invoicing .invoice-paper-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .screen-06-store-logistics-profile {
      justify-content: space-between;
    }

    /* ─── BOTTOM TAB BAR (NAVBAR) ─── */
    .direct-bottom-tabbar {
      height: 115px;
      background: #FFFFFF;
      border-top: 1.5px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 24px 10px;
      z-index: 50;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.03);
    }

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #94A3B8;
      cursor: pointer;
    }

    .tab-item-active {
      color: #F26522;
    }

    .tab-svg-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tab-label-text {
      font-size: 15px;
      font-weight: 800;
    }

    .home-indicator-bar {
      height: 24px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 8px;
    }

    .home-indicator-pill {
      width: 180px;
      height: 5px;
      background: #0F172A;
      border-radius: 3px;
      opacity: 0.4;
    }

    /* ─── REUSABLE SCREEN COMPONENTS ─── */

    /* Store Top Bar */
    .store-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 1.5px solid #E2E8F0;
      margin-bottom: 20px;
    }

    .store-topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .store-logo-box {
      width: 62px;
      height: 62px;
      border-radius: 16px;
      background: #052A51;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #fff;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(5, 42, 81, 0.2);
    }

    .store-logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .store-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .badge-biz {
      background: #FFF7ED;
      color: #C2410C;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .badge-verified {
      background: #ECFDF5;
      color: #065F46;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .store-title-text {
      font-size: 22px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.4px;
    }

    .add-product-cta {
      background: #F26522;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 800;
      padding: 12px 24px;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(242, 101, 34, 0.3);
    }

    /* Standard Top Nav Bar */
    .top-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #E2E8F0;
      margin-bottom: 20px;
    }

    .nav-title {
      font-size: 26px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.6px;
    }

    .nav-sub {
      font-size: 16px;
      color: #64748B;
      font-weight: 600;
      margin-top: 2px;
    }

    .auto-accept-badge, .badge-gst-green, .badge-status-ok {
      background: #ECFDF5;
      color: #065F46;
      font-weight: 800;
      font-size: 15px;
      padding: 8px 18px;
      border-radius: 24px;
      border: 1.5px solid #A7F3D0;
    }

    .badge-quick-orange {
      background: #FFF7ED;
      color: #C2410C;
      font-weight: 800;
      font-size: 15px;
      padding: 8px 18px;
      border-radius: 24px;
      border: 1.5px solid #FFEDD5;
    }

    /* Revenue Hero Card */
    .revenue-hero-card {
      background: linear-gradient(135deg, #052A51 0%, #083E76 100%);
      border-radius: 22px;
      padding: 24px 28px;
      color: #FFFFFF;
      margin-bottom: 18px;
      box-shadow: 0 10px 28px rgba(5, 42, 81, 0.2);
    }

    .rev-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .rev-subtitle {
      font-size: 15px;
      font-weight: 800;
      color: #93C5FD;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .rev-amount {
      font-size: 44px;
      font-weight: 900;
      letter-spacing: -1.2px;
      margin-top: 4px;
    }

    .growth-chip {
      background: rgba(16, 185, 129, 0.25);
      border: 1.5px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 15px;
      font-weight: 800;
      padding: 5px 14px;
      border-radius: 24px;
    }

    .rev-stats-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.16);
    }

    .rev-stat-col {
      flex: 1;
    }

    .rev-stat-lbl {
      font-size: 13px;
      color: #CBD5E1;
      font-weight: 600;
    }

    .rev-stat-val {
      font-size: 22px;
      font-weight: 900;
      color: #FFFFFF;
      margin-top: 2px;
    }

    .stat-sep {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 16px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 16px 18px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .kpi-icon-orange, .kpi-icon-blue {
      font-size: 26px;
      margin-bottom: 4px;
    }

    .kpi-num {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }

    .kpi-label {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 2px;
    }

    .kpi-sub {
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
      margin-top: 1px;
    }

    /* Section Headings */
    .sec-heading-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .sec-heading {
      font-size: 19px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.4px;
    }

    .sec-link {
      font-size: 15px;
      font-weight: 800;
      color: #F26522;
    }

    /* Order Cards */
    .order-list-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 15px 18px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
      margin-bottom: 11px;
    }

    .order-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 7px;
    }

    .order-id-chip {
      background: #EFF6FF;
      color: #1E40AF;
      font-weight: 800;
      font-size: 14px;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .timer-chip {
      background: #FEF3C7;
      color: #B45309;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .status-chip-green {
      background: #ECFDF5;
      color: #065F46;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .status-chip-gray {
      background: #F1F5F9;
      color: #475569;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .order-prod-name {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 3px;
    }

    .order-specs {
      font-size: 14px;
      color: #64748B;
      font-weight: 600;
      margin-bottom: 3px;
    }

    .order-customer-line {
      font-size: 13px;
      color: #475569;
      font-weight: 500;
      margin-bottom: 9px;
    }

    .action-btn-row {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }

    .btn-dispatch {
      flex: 1.3;
      background: #F26522;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 800;
      text-align: center;
      padding: 12px 0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(242, 101, 34, 0.25);
    }

    .btn-print {
      background: #F1F5F9;
      color: #052A51;
      font-size: 14px;
      font-weight: 800;
      padding: 12px 18px;
      border-radius: 12px;
      border: 1.5px solid #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-outline {
      flex: 1.3;
      background: #EFF6FF;
      color: #1E40AF;
      border: 1.5px solid #BFDBFE;
      font-size: 15px;
      font-weight: 800;
      text-align: center;
      padding: 12px 0;
      border-radius: 12px;
    }

    .btn-outline-green {
      flex: 1.3;
      background: #ECFDF5;
      color: #065F46;
      border: 1.5px solid #A7F3D0;
      font-size: 15px;
      font-weight: 800;
      text-align: center;
      padding: 12px 0;
      border-radius: 12px;
    }

    /* Tabs Chips */
    .tab-chips-row {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .tab-chip-pill {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      color: #64748B;
      font-size: 15px;
      font-weight: 800;
      padding: 9px 20px;
      border-radius: 24px;
    }

    .pill-active {
      background: #052A51;
      color: #FFFFFF;
      border-color: #052A51;
    }

    /* Urgent Box */
    .urgent-dispatch-box {
      background: #FFFFFF;
      border: 2.5px solid #F26522;
      border-radius: 20px;
      padding: 18px 20px;
      box-shadow: 0 8px 24px rgba(242, 101, 34, 0.12);
      margin-bottom: 14px;
    }

    .urgent-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .urgent-red-tag {
      background: #FEE2E2;
      color: #B91C1C;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .urgent-timer {
      background: #FEF3C7;
      color: #B45309;
      font-size: 15px;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 6px;
    }

    .urgent-order-title {
      font-size: 20px;
      font-weight: 900;
      color: #052A51;
      margin-bottom: 10px;
    }

    .urgent-item-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #F8FAFC;
      border-radius: 14px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }

    .urgent-item-icon {
      font-size: 28px;
    }

    .urgent-item-name {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }

    .urgent-item-sub {
      font-size: 13px;
      color: #64748B;
      font-weight: 600;
    }

    .urgent-address-pill {
      font-size: 14px;
      color: #334155;
      background: #F1F5F9;
      padding: 9px 14px;
      border-radius: 10px;
      line-height: 1.35;
    }

    .btn-dispatch-big {
      background: #F26522;
      color: #FFFFFF;
      font-size: 17px;
      font-weight: 900;
      text-align: center;
      padding: 14px 0;
      border-radius: 14px;
      box-shadow: 0 6px 18px rgba(242, 101, 34, 0.3);
      margin-top: 12px;
    }

    /* Catalog Screen Styles */
    .catalog-search-bar {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 16px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }

    .category-scroll-row {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .cat-pill {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      color: #475569;
      font-size: 15px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .pill-selected {
      background: #F26522;
      color: #FFFFFF;
      border-color: #F26522;
    }

    .inventory-product-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 11px 18px;
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 9px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.02);
    }

    .inv-prod-thumb {
      width: 54px;
      height: 54px;
      background: #F1F5F9;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .inv-prod-body {
      flex: 1;
    }

    .inv-prod-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .inv-prod-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }

    .badge-stock-in {
      background: #ECFDF5;
      color: #065F46;
      font-size: 12px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .badge-stock-low {
      background: #FEF3C7;
      color: #B45309;
      font-size: 12px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .inv-prod-meta {
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .inv-prod-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .inv-price-block {
      font-size: 15px;
      color: #052A51;
    }

    .inv-price-sub {
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
    }

    .inv-stock-pill {
      background: #F1F5F9;
      color: #334155;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 10px;
    }

    .toggle-status-green {
      color: #10B981;
      font-size: 13px;
      font-weight: 800;
    }

    .bulk-template-bar {
      background: #FFF7ED;
      border: 1.5px dashed #FB923C;
      border-radius: 16px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }

    .bulk-upload-btn {
      background: #F26522;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 13px;
      padding: 7px 16px;
      border-radius: 10px;
    }

    /* Invoice Screen Styles */
    .invoice-paper-card {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      margin-bottom: 16px;
    }

    .inv-doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .inv-doc-title {
      font-size: 22px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.4px;
    }

    .inv-doc-sub {
      font-size: 13px;
      color: #64748B;
      font-weight: 600;
      margin-top: 3px;
    }

    .inv-doc-no {
      text-align: right;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }

    .doc-divider {
      height: 1px;
      background: #E2E8F0;
      margin: 12px 0;
    }

    .doc-parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 12px;
    }

    .party-col {
      font-size: 13px;
      line-height: 1.45;
    }

    .party-hdr {
      font-size: 11px;
      font-weight: 800;
      color: #94A3B8;
      letter-spacing: 0.6px;
      margin-bottom: 4px;
    }

    .party-bold {
      font-weight: 900;
      font-size: 15px;
      color: #052A51;
      margin-bottom: 3px;
    }

    .party-dtl {
      color: #475569;
    }

    .doc-table-head {
      display: flex;
      background: #F8FAFC;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }

    .doc-table-row {
      display: flex;
      padding: 9px 14px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px dashed #E2E8F0;
      align-items: center;
    }

    .doc-totals-box {
      padding: 10px 14px;
      font-size: 13px;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      color: #475569;
      margin-bottom: 6px;
    }

    .total-line-grand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 900;
      color: #052A51;
      padding-top: 8px;
      border-top: 1.5px solid #CBD5E1;
      margin-top: 8px;
    }

    .grand-num {
      font-size: 26px;
      color: #F26522;
      font-weight: 900;
    }

    .words-line {
      font-size: 11px;
      color: #64748B;
      margin-top: 6px;
    }

    .doc-footer-details {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 12px;
      color: #475569;
      line-height: 1.45;
    }

    .signature-box {
      font-size: 11px;
      color: #64748B;
      margin-top: 4px;
      font-style: italic;
    }

    .invoice-action-row {
      display: flex;
      gap: 14px;
    }

    .btn-print-thermal {
      flex: 1;
      background: #052A51;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      padding: 16px 0;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(5, 42, 81, 0.25);
    }

    .btn-share-pdf {
      flex: 1;
      background: #FFFFFF;
      color: #052A51;
      border: 1.5px solid #CBD5E1;
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      padding: 16px 0;
      border-radius: 14px;
    }

    /* Bank Settlements Screen */
    .payout-banner-card {
      background: linear-gradient(135deg, #4338CA 0%, #312E81 100%);
      border-radius: 22px;
      padding: 24px 28px;
      color: #FFFFFF;
      margin-bottom: 16px;
      box-shadow: 0 10px 28px rgba(67, 56, 202, 0.25);
    }

    .payout-banner-label {
      font-size: 13px;
      font-weight: 800;
      color: #C7D2FE;
      letter-spacing: 0.8px;
    }

    .payout-banner-val {
      font-size: 44px;
      font-weight: 900;
      letter-spacing: -1px;
      margin: 4px 0 6px;
    }

    .payout-banner-sub {
      font-size: 14px;
      color: #E0E7FF;
      margin-bottom: 18px;
    }

    .payout-stats-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.16);
    }

    .payout-stat-item {
      flex: 1;
    }

    .payout-stat-lbl {
      font-size: 12px;
      color: #C7D2FE;
    }

    .payout-stat-num {
      font-size: 20px;
      font-weight: 900;
      margin-top: 2px;
    }

    .payout-stat-sep {
      width: 1px;
      height: 28px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 16px;
    }

    .bank-account-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 16px 20px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }

    .bank-header-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .bank-verified-tag {
      background: #ECFDF5;
      color: #065F46;
      font-size: 12px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .bank-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 13px;
      color: #475569;
    }

    .tds-summary-card {
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 12px 18px;
      margin-bottom: 12px;
    }

    .tds-download-chip {
      background: #EFF6FF;
      color: #1E40AF;
      font-size: 12px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 8px;
    }

    .ledger-row-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 13px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 9px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }

    .ledger-utr {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
    }

    .ledger-date {
      font-size: 12px;
      color: #64748B;
      margin-top: 2px;
    }

    .ledger-amt {
      font-size: 16px;
      font-weight: 900;
      color: #052A51;
    }

    .ledger-status-ok {
      font-size: 12px;
      font-weight: 800;
      color: #10B981;
      margin-top: 1px;
    }

    /* Store Settings / Logistics Profile */
    .profile-setting-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 15px 20px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }

    .store-avatar-big {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: #052A51;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }

    .card-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .card-desc-text {
      font-size: 13px;
      color: #64748B;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .gps-coords-display {
      display: flex;
      gap: 24px;
      background: #F8FAFC;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 13px;
      color: #334155;
      margin-bottom: 10px;
    }

    .radius-chip {
      font-size: 13px;
      color: #052A51;
      background: #EFF6FF;
      padding: 7px 12px;
      border-radius: 8px;
    }

    .method-option-card {
      border: 1.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .method-selected {
      border-color: #F26522;
      background: #FFF7ED;
    }

    .radio-checked {
      color: #F26522;
      font-size: 20px;
      line-height: 1;
    }

    .radio-unchecked {
      color: #94A3B8;
      font-size: 20px;
      line-height: 1;
    }

    .method-title {
      font-size: 15px;
      font-weight: 800;
      color: #052A51;
    }

    .method-desc {
      font-size: 12px;
      color: #64748B;
      margin-top: 2px;
    }

    .auto-accept-toggle-box {
      background: #ECFDF5;
      border: 1.5px solid #A7F3D0;
      border-radius: 16px;
      padding: 13px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .toggle-headline {
      font-size: 16px;
      font-weight: 900;
      color: #065F46;
    }

    .toggle-subline {
      font-size: 12px;
      color: #047857;
      margin-top: 2px;
    }

    .switch-outer {
      width: 54px;
      height: 30px;
      background: #10B981;
      border-radius: 16px;
      padding: 3px;
      display: flex;
      justify-content: flex-end;
    }

    .switch-inner {
      width: 24px;
      height: 24px;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .partner-support-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .support-contact-btn {
      background: #052A51;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 800;
      padding: 9px 18px;
      border-radius: 10px;
    }

  </style>
</head>
<body>

  <!-- 1. Native Android Status Bar -->
  <div class="direct-status-bar">
    <span>09:41</span>
    <div class="status-icons-right">
      <span>📶 5G</span>
      <span>🔋 100%</span>
    </div>
  </div>

  <!-- 2. Direct In-App Screen Body (No outer bezel/bg) -->
  <div class="direct-app-body screen-${screen.filename}">
    ${screen.renderScreen}
  </div>

  <!-- 3. Native Bottom Tab Navigation & Home Pill -->
  ${getBottomTabBar(screen.activeTab)}

</body>
</html>
  `;
}

async function run() {
  console.log("Generating 6 Direct Full-Screen Phone Captures (1080x1920, 9:16)...");

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

    // Exact 1080x1920 viewport (9:16 portrait)
    await page.setViewport({
      width: 1080,
      height: 1920,
      deviceScaleFactor: 1,
    });

    for (let i = 0; i < SCREENS.length; i++) {
      const screen = SCREENS[i];
      const html = generateHtml(screen);

      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise((r) => setTimeout(r, 600));

      const pngName = `${screen.filename}.png`;
      const pngPath = path.join(SCREENSHOTS_DIR, pngName);

      // Save PNG (lossless, crystal-clear 1080x1920)
      await page.screenshot({
        path: pngPath,
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });

      const pngSize = (fs.statSync(pngPath).size / 1024).toFixed(1);

      console.log(`✓ [${i + 1}/6] Generated Direct Phone Screen: ${pngName} (${pngSize} KB)`);
    }

    console.log("\nAll 6 Direct Phone Screenshots (1080x1920, 9:16) generated successfully in:");
    console.log(SCREENSHOTS_DIR);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Direct screenshot generation error:", err);
  process.exit(1);
});
