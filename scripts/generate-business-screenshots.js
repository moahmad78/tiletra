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

function getBottomTabBar(activeTabName) {
  const tabs = [
    { name: "dashboard", label: "Dashboard", icon: "📊" },
    { name: "products", label: "My Products", icon: "📦" },
    { name: "orders", label: "Orders", icon: "🛒" },
    { name: "earnings", label: "Earnings", icon: "₹" },
    { name: "profile", label: "Profile", icon: "🏢" },
  ];

  return `
    <div class="bottom-tab-bar">
      ${tabs
        .map((t) => {
          const isActive = t.name === activeTabName;
          return `
          <div class="tab-btn ${isActive ? "tab-btn-active" : ""}">
            <div class="tab-icon">${t.icon}</div>
            <div class="tab-label">${t.label}</div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

// 6 Targeted Play Store Screenshots
const SCREENS = [
  {
    filename: "01-vendor-dashboard",
    activeTab: "dashboard",
    pillTag: "OPERATIONS & ANALYTICS",
    pillColor: "#F26522",
    headline: "Real-Time Vendor Dashboard",
    subheadline: "Track daily gross sales, live order inflow & store growth metrics",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div class="store-info-row">
          <div class="store-avatar">🏢</div>
          <div>
            <div class="store-name">Sri Balaji Electricals & Tiles</div>
            <div class="store-status"><span class="green-dot"></span> Verified Partner • 10-Min Dispatch</div>
          </div>
        </div>
        <div class="quick-add-btn">+ Product</div>
      </div>

      <!-- Gross Revenue Banner -->
      <div class="stat-banner">
        <div class="stat-banner-label">TOTAL GROSS REVENUE</div>
        <div class="stat-val-row">
          <div class="stat-val">₹3,42,850</div>
          <div class="trend-badge">+22.8% this week ↗</div>
        </div>
        <div class="stat-sub-row">
          <div>Orders Fulfilled: <strong style="color: #fff;">184</strong></div>
          <div>Avg Ticket: <strong style="color: #fff;">₹1,863</strong></div>
          <div>Rating: <strong style="color: #fff;">4.9 ★</strong></div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid-2">
        <div class="mini-stat-card">
          <div class="mini-label">ACTIVE ORDERS</div>
          <div class="mini-val" style="color: #F26522;">6 Pending</div>
          <div class="mini-note">⏱ 3 in packing stage</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-label">CATALOG STOCK</div>
          <div class="mini-val" style="color: #052A51;">48 Products</div>
          <div class="mini-note">920 boxes available</div>
        </div>
      </div>

      <!-- Live Order Queue -->
      <div class="section-title-row">
        <div class="section-title">Incoming Order Queue</div>
        <div class="section-link">View All (12) →</div>
      </div>

      <!-- Live Order Card 1 -->
      <div class="card-item">
        <div class="card-item-top">
          <div class="order-badge">ORD-9842</div>
          <div class="timer-pill">⏱ 14m dispatch timer</div>
        </div>
        <div class="item-title">Kajaria Vitrified Floor Tiles (600x600mm)</div>
        <div class="item-details">Quantity: 28 Boxes • Payment: Online Paid • Koramangala</div>
        <div class="btn-row">
          <div class="btn-primary">Ready for Dispatch ⚡</div>
          <div class="btn-secondary">Print Slip 🧾</div>
        </div>
      </div>

      <!-- Live Order Card 2 -->
      <div class="card-item">
        <div class="card-item-top">
          <div class="order-badge" style="background: #ECFDF5; color: #065F46;">ORD-9839</div>
          <div class="status-pill-green">✓ Out for Delivery</div>
        </div>
        <div class="item-title">Roff T01 NCA High Bond Tile Adhesive (30kg)</div>
        <div class="item-details">Quantity: 6 Bags • Rider: Ramesh K. (Assigned)</div>
        <div class="btn-row">
          <div class="btn-outline-green">Track Rider Live 📍</div>
          <div class="btn-secondary">Invoice</div>
        </div>
      </div>

      <!-- Live Order Card 3 -->
      <div class="card-item">
        <div class="card-item-top">
          <div class="order-badge" style="background: #F1F5F9; color: #475569;">ORD-9835</div>
          <div class="status-pill-green">✓ Delivered 11:30 AM</div>
        </div>
        <div class="item-title">Hindware Flora Ceramic Countertop Basin</div>
        <div class="item-details">Quantity: 2 Units • ₹7,400 • Handoff Complete</div>
      </div>
    `
  },
  {
    filename: "02-order-dispatch",
    activeTab: "orders",
    pillTag: "ORDER FULFILLMENT",
    pillColor: "#0284C7",
    headline: "60-Min Hyper-Local Dispatch",
    subheadline: "Manage packaging timers, courier assignments & rider handoffs",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div>
          <div class="screen-title">Order Fulfillment</div>
          <div class="screen-sub">Live warehouse order queue</div>
        </div>
        <div class="filter-pill">⚡ Auto-Accept: ON</div>
      </div>

      <!-- Status Tabs -->
      <div class="status-tab-row">
        <div class="tab-chip tab-active">All (8)</div>
        <div class="tab-chip">Pending (2)</div>
        <div class="tab-chip">Packing (3)</div>
        <div class="tab-chip">Dispatched (3)</div>
      </div>

      <!-- Urgent Dispatch Card -->
      <div class="dispatch-highlight-card">
        <div class="dispatch-top-row">
          <div class="urgent-tag">URGENT DISPATCH</div>
          <div class="timer-badge-big">⏱ 08:42 Remaining</div>
        </div>
        <div class="dispatch-order-num">Order #ORD-7712 • ₹14,800</div>
        <div class="dispatch-product-box">
          <div class="prod-icon">📦</div>
          <div>
            <div class="prod-name">Somany Glazed Ceramic Wall Tiles • 18 Boxes</div>
            <div class="prod-variant">Finish: Glossy White • Size: 300x450mm</div>
          </div>
        </div>
        <div class="delivery-address-box">
          📍 <strong>Delivery:</strong> Flat 302, Green Glen Layout, Bellandur, Bengaluru
        </div>
        <div class="btn-primary" style="margin-top: 12px;">Mark Packed & Notify Rider 🚚</div>
      </div>

      <!-- Normal Order 1 -->
      <div class="card-item">
        <div class="card-item-top">
          <div class="order-badge">ORD-7709</div>
          <div class="tag-status">Packing Stage</div>
        </div>
        <div class="item-title">Asian Paints TruCare Tile Grout & Spacer Kit</div>
        <div class="item-details">Qty: 12 Units • ₹3,240 • Self-Pickup (Customer)</div>
        <div class="btn-row">
          <div class="btn-outline-green">✓ Ready for Handover</div>
          <div class="btn-secondary">Invoice 🧾</div>
        </div>
      </div>

      <!-- Normal Order 2 -->
      <div class="card-item">
        <div class="card-item-top">
          <div class="order-badge" style="background: #F1F5F9; color: #475569;">ORD-7695</div>
          <div class="status-pill-green">Delivered 12:40 PM</div>
        </div>
        <div class="item-title">Hindware Flora Ceramic Counter Washbasin</div>
        <div class="item-details">Qty: 1 Unit • ₹4,250 • Delivered by IntriHub Express</div>
      </div>
    `
  },
  {
    filename: "03-catalog-inventory",
    activeTab: "products",
    pillTag: "CATALOG & INVENTORY",
    pillColor: "#10B981",
    headline: "Stock Control & Price Updates",
    subheadline: "Update prices per sq.ft / box, manage variants & stock availability",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div>
          <div class="screen-title">Product Inventory</div>
          <div class="screen-sub">48 products listed • 46 in stock</div>
        </div>
        <div class="quick-add-btn">+ Add Item</div>
      </div>

      <!-- Search & Category Filter -->
      <div class="search-bar-mock">
        <span>🔍</span>
        <span style="color: #94A3B8;">Search tiles, adhesive, sanitary...</span>
      </div>

      <div class="cat-pill-scroll">
        <div class="cat-pill cat-pill-sel">All Items</div>
        <div class="cat-pill">Floor Tiles</div>
        <div class="cat-pill">Wall Tiles</div>
        <div class="cat-pill">Adhesives</div>
        <div class="cat-pill">Sanitaryware</div>
      </div>

      <!-- Product Card 1 -->
      <div class="product-card">
        <div class="prod-thumb">🖼️</div>
        <div class="prod-details-col">
          <div class="prod-header-row">
            <div class="prod-title">Kajaria 600x600 Double Charge Tiles</div>
            <div class="stock-badge-in">In Stock</div>
          </div>
          <div class="prod-specs">Category: Floor Tiles • Size: 600x600mm</div>
          <div class="prod-price-row">
            <div><strong>₹64</strong> / sq.ft <span class="sub-price">(₹896 / Box)</span></div>
            <div class="stock-count-pill">📦 140 Boxes</div>
          </div>
        </div>
      </div>

      <!-- Product Card 2 -->
      <div class="product-card">
        <div class="prod-thumb">🖼️</div>
        <div class="prod-details-col">
          <div class="prod-header-row">
            <div class="prod-title">Roff T01 NCA Tile Adhesive (30kg)</div>
            <div class="stock-badge-in">In Stock</div>
          </div>
          <div class="prod-specs">Category: Tile Chemicals • Grey High-Bond</div>
          <div class="prod-price-row">
            <div><strong>₹430</strong> / bag <span class="sub-price">MRP: ₹480</span></div>
            <div class="stock-count-pill">📦 65 Bags</div>
          </div>
        </div>
      </div>

      <!-- Product Card 3 (Low Stock) -->
      <div class="product-card" style="border-left: 4px solid #F59E0B;">
        <div class="prod-thumb">🖼️</div>
        <div class="prod-details-col">
          <div class="prod-header-row">
            <div class="prod-title">Hindware Italian Marble Glazed Sink</div>
            <div class="stock-badge-low">Low: 4 Left</div>
          </div>
          <div class="prod-specs">Category: Sanitaryware • Gloss White</div>
          <div class="prod-price-row">
            <div><strong>₹3,850</strong> / piece <span class="sub-price">MRP: ₹4,500</span></div>
            <div class="toggle-mock">Active 🟢</div>
          </div>
        </div>
      </div>

      <!-- Product Card 4 -->
      <div class="product-card">
        <div class="prod-thumb">🖼️</div>
        <div class="prod-details-col">
          <div class="prod-header-row">
            <div class="prod-title">Somany 300x450 Gloss Wall Tiles</div>
            <div class="stock-badge-in">In Stock</div>
          </div>
          <div class="prod-specs">Category: Wall Tiles • Ceramic Gloss</div>
          <div class="prod-price-row">
            <div><strong>₹48</strong> / sq.ft <span class="sub-price">(₹576 / Box)</span></div>
            <div class="stock-count-pill">📦 82 Boxes</div>
          </div>
        </div>
      </div>

      <!-- Bulk Action Bar -->
      <div class="bulk-bar">
        <span>Bulk CSV / Excel Upload & Update Available</span>
        <strong style="color: #F26522;">Upload ↗</strong>
      </div>
    `
  },
  {
    filename: "04-tax-invoicing",
    activeTab: "orders",
    pillTag: "TAX INVOICING",
    pillColor: "#F59E0B",
    headline: "GST Tax Invoices & Thermal Slips",
    subheadline: "Generate professional GST bills, print via Bluetooth or share PDF",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div>
          <div class="screen-title">Tax Invoice Preview</div>
          <div class="screen-sub">Order #ORD-REV-8492 • GST Compliant</div>
        </div>
        <div class="badge-gst">GSTIN VERIFIED</div>
      </div>

      <!-- Invoice Sheet Mockup -->
      <div class="invoice-sheet">
        <!-- Invoice Header -->
        <div class="inv-header">
          <div>
            <div class="inv-brand">INTRIHUB B2B TAX INVOICE</div>
            <div class="inv-sub">Original for Recipient • Reverse Charge: NO</div>
          </div>
          <div class="inv-no">
            <div>INV: <strong>INT-2026-0984</strong></div>
            <div>Date: <strong>13 Sep 2026</strong></div>
          </div>
        </div>

        <div class="inv-divider"></div>

        <!-- Supplier & Buyer Row -->
        <div class="inv-party-grid">
          <div>
            <div class="party-label">SUPPLIER (VENDOR):</div>
            <div class="party-name">Sri Balaji Electricals & Tiles</div>
            <div class="party-sub">GSTIN: 29AABCS1429B1Z8</div>
            <div class="party-sub">Bengaluru, Karnataka - 560068</div>
          </div>
          <div>
            <div class="party-label">BUYER (CUSTOMER):</div>
            <div class="party-name">Rahul Sharma</div>
            <div class="party-sub">Ph: +91 98765 43210</div>
            <div class="party-sub">Koramangala 4th Block, BLR</div>
          </div>
        </div>

        <div class="inv-divider"></div>

        <!-- Line Item Table -->
        <div class="inv-table-header">
          <div style="flex: 2;">Item Description</div>
          <div style="flex: 1; text-align: center;">HSN</div>
          <div style="flex: 1; text-align: center;">Qty</div>
          <div style="flex: 1; text-align: right;">Amount</div>
        </div>

        <div class="inv-table-row">
          <div style="flex: 2; font-weight: 700;">Kajaria Royal Tiles (600x600)</div>
          <div style="flex: 1; text-align: center;">6907</div>
          <div style="flex: 1; text-align: center;">24 Bx</div>
          <div style="flex: 1; text-align: right; font-weight: 700;">₹19,200</div>
        </div>

        <div class="inv-table-row">
          <div style="flex: 2; font-weight: 700;">Roff T01 Tile Adhesive (30kg)</div>
          <div style="flex: 1; text-align: center;">3506</div>
          <div style="flex: 1; text-align: center;">4 Bags</div>
          <div style="flex: 1; text-align: right; font-weight: 700;">₹1,720</div>
        </div>

        <div class="inv-divider"></div>

        <!-- Tax & Total Breakdown -->
        <div class="inv-total-grid">
          <div>Taxable Amount: <strong>₹20,920.00</strong></div>
          <div>CGST (9%) + SGST (9%): <strong>₹3,765.60</strong></div>
          <div class="grand-total">GRAND TOTAL: ₹24,685.60</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="btn-row" style="margin-top: 16px;">
        <div class="btn-primary" style="flex: 1.2;">🖨️ Print Thermal Slip</div>
        <div class="btn-secondary" style="flex: 1;">📄 Share PDF</div>
      </div>
    `
  },
  {
    filename: "05-bank-settlements",
    activeTab: "earnings",
    pillTag: "FINANCIALS & PAYOUTS",
    pillColor: "#8B5CF6",
    headline: "Direct Bank Settlements",
    subheadline: "Automated payout ledger, transparent commissions & bank transfers",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div>
          <div class="screen-title">Earnings & Payouts</div>
          <div class="screen-sub">Automated daily / weekly settlements</div>
        </div>
        <div class="badge-status-ok">ACTIVE SETTLEMENT</div>
      </div>

      <!-- Payout Balance Card -->
      <div class="balance-card-purple">
        <div class="bal-label">AVAILABLE SETTLEMENT BALANCE</div>
        <div class="bal-amount">₹68,450.00</div>
        <div class="bal-next">Next payout scheduled: <strong>Tomorrow, 10:00 AM</strong></div>
        <div class="bal-stats-grid">
          <div>
            <div class="bal-sublabel">Total Settled</div>
            <div class="bal-subval">₹4,82,900</div>
          </div>
          <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 14px;">
            <div class="bal-sublabel">Commission Rate</div>
            <div class="bal-subval">10.0%</div>
          </div>
          <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 14px;">
            <div class="bal-sublabel">Settlement Mode</div>
            <div class="bal-subval">Direct NEFT</div>
          </div>
        </div>
      </div>

      <!-- Bank Verification Box -->
      <div class="bank-box">
        <div class="bank-title-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">🏦</span>
            <strong>Registered Bank Account</strong>
          </div>
          <div class="badge-verified">Verified ✓</div>
        </div>
        <div class="bank-info-row">
          <div>A/C Holder: <strong>Sri Balaji Electricals</strong></div>
          <div>Bank: <strong>HDFC Bank Ltd</strong></div>
        </div>
        <div class="bank-info-row">
          <div>A/C No: <strong>•••• •••• •••• 4920</strong></div>
          <div>IFSC: <strong>HDFC0001842</strong></div>
        </div>
      </div>

      <!-- Recent Payout Ledger -->
      <div class="section-title" style="margin-top: 14px; margin-bottom: 8px;">Recent Payout History</div>

      <div class="payout-row">
        <div>
          <div class="payout-ref">UTR: HDFC84920194821</div>
          <div class="payout-date">10 Sep 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="payout-amt">+₹52,400</div>
          <div class="payout-status-green">Processed ✓</div>
        </div>
      </div>

      <div class="payout-row">
        <div>
          <div class="payout-ref">UTR: HDFC84810294711</div>
          <div class="payout-date">03 Sep 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="payout-amt">+₹48,920</div>
          <div class="payout-status-green">Processed ✓</div>
        </div>
      </div>

      <div class="payout-row">
        <div>
          <div class="payout-ref">UTR: HDFC84690184722</div>
          <div class="payout-date">27 Aug 2026 • Direct NEFT Settlement</div>
        </div>
        <div style="text-align: right;">
          <div class="payout-amt">+₹61,250</div>
          <div class="payout-status-green">Processed ✓</div>
        </div>
      </div>
    `
  },
  {
    filename: "06-store-settings",
    activeTab: "profile",
    pillTag: "LOGISTICS & STORE",
    pillColor: "#052A51",
    headline: "Store GPS & Logistics Setup",
    subheadline: "Configure nearest-vendor order routing, delivery radius & auto-accept",
    renderContent: `
      <!-- Header -->
      <div class="app-top-nav">
        <div>
          <div class="screen-title">Store Logistics & Profile</div>
          <div class="screen-sub">Operational settings & GPS pin</div>
        </div>
        <div class="badge-pill-orange">⚡ Quickcommerce Ready</div>
      </div>

      <!-- GPS Setup Card -->
      <div class="gps-card">
        <div class="gps-header-row">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">📍</span>
            <strong>Store GPS Location</strong>
          </div>
          <div class="gps-link">View Pin on Map ↗</div>
        </div>
        <div class="gps-desc">
          Enables 60-minute nearest-vendor order routing and rider pickup navigation.
        </div>
        <div class="coords-box">
          <div>Latitude: <strong>12.9716° N</strong></div>
          <div>Longitude: <strong>77.5946° E</strong></div>
        </div>
        <div class="service-radius-pill">
          <span>Service Area: <strong>12 km Radius</strong> (Bengaluru South)</span>
        </div>
      </div>

      <!-- Logistics Mode Card -->
      <div class="logistics-mode-card">
        <div class="mode-title">Logistics & Fulfillment Mode</div>
        
        <div class="mode-option mode-selected">
          <div class="mode-radio-sel">●</div>
          <div>
            <div class="mode-name">⚡ IntriHub Platform Logistics (Auto)</div>
            <div class="mode-sub">Rider arrives at warehouse within 15 min of packing</div>
          </div>
        </div>

        <div class="mode-option" style="margin-top: 8px;">
          <div class="mode-radio">○</div>
          <div>
            <div class="mode-name">🚛 Self-Delivery (Manual)</div>
            <div class="mode-sub">Vendor dispatches with own delivery vehicle/fleet</div>
          </div>
        </div>
      </div>

      <!-- Auto Accept Toggle -->
      <div class="toggle-card">
        <div>
          <div class="toggle-title">⚡ Auto-Accept Orders</div>
          <div class="toggle-desc">Automatically confirms orders & starts 10m packing timer</div>
        </div>
        <div class="toggle-switch-on">
          <div class="toggle-knob"></div>
        </div>
      </div>

      <!-- 24x7 Helpline Bar -->
      <div class="support-bar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🎧</span>
          <div>
            <div style="font-weight: 800; font-size: 13px;">24*7 Partner Support Desk</div>
            <div style="font-size: 11px; color: #64748B;">WhatsApp chat, ticket resolution & partner manager</div>
          </div>
        </div>
        <strong style="color: #052A51; font-size: 13px;">Contact →</strong>
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
  <title>${screen.headline}</title>
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
      background: #020B16;
      color: #FFFFFF;
      position: relative;
    }

    /* Ambient Background Layer */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 80% 15%, rgba(242, 101, 34, 0.25) 0%, transparent 45%),
        radial-gradient(circle at 20% 75%, rgba(14, 165, 233, 0.2) 0%, transparent 50%),
        linear-gradient(180deg, #030F1E 0%, #051F3C 35%, #020A14 100%);
      z-index: 1;
    }

    .blueprint-grid {
      position: absolute;
      inset: 0;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      z-index: 2;
    }

    .container {
      position: relative;
      z-index: 10;
      width: 1080px;
      height: 1920px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 70px 70px 0;
    }

    /* ─── TOP PROMOTIONAL BANNER ─── */
    .promo-banner {
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 35px;
    }

    .brand-tag-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .brand-capsule {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(16px);
      padding: 8px 18px 8px 12px;
      border-radius: 40px;
    }

    .brand-icon {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      object-fit: contain;
    }

    .brand-name {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
    }

    .pill-badge {
      background: ${screen.pillColor};
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 7px 16px;
      border-radius: 30px;
      box-shadow: 0 4px 14px rgba(242, 101, 34, 0.3);
    }

    .headline {
      font-size: 54px;
      line-height: 1.15;
      font-weight: 900;
      letter-spacing: -1.6px;
      color: #ffffff;
      margin-bottom: 12px;
      max-width: 940px;
      text-shadow: 0 4px 24px rgba(0,0,0,0.5);
    }

    .subheadline {
      font-size: 22px;
      line-height: 1.4;
      font-weight: 500;
      color: #94A3B8;
      max-width: 860px;
    }

    /* ─── PHONE MOCKUP FRAME ─── */
    .phone-wrapper {
      position: relative;
      width: 880px;
      flex: 1;
      background: #020B16;
      border-top-left-radius: 56px;
      border-top-right-radius: 56px;
      border: 10px solid #1E293B;
      border-bottom: none;
      box-shadow: 
        0 -20px 80px -10px rgba(0, 0, 0, 0.9),
        0 0 0 2px rgba(255, 255, 255, 0.18),
        0 0 60px rgba(242, 101, 34, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Island / Camera Notch */
    .phone-notch {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: 140px;
      height: 24px;
      background: #0f172a;
      border-radius: 20px;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notch-camera-lens {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1e293b;
      margin-left: 60px;
    }

    /* Native Status Bar */
    .status-bar {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      font-size: 15px;
      font-weight: 700;
      color: #052A51;
      background: #F8FAFC;
      z-index: 20;
    }

    /* Main Phone App Canvas */
    .app-screen-body {
      flex: 1;
      background: #F8FAFC;
      color: #0F172A;
      padding: 8px 26px 16px;
      display: flex;
      flex-direction: column;
      font-size: 15px;
      overflow: hidden;
    }

    /* Bottom Tab Bar */
    .bottom-tab-bar {
      height: 80px;
      background: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 16px 8px;
      z-index: 25;
    }

    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      color: #94A3B8;
    }

    .tab-btn-active {
      color: #F26522;
    }

    .tab-icon {
      font-size: 22px;
    }

    .tab-label {
      font-size: 12px;
      font-weight: 800;
    }

    /* App Nav & Profile */
    .app-top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0 14px;
      border-bottom: 1px solid #E2E8F0;
      margin-bottom: 16px;
    }

    .store-info-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .store-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #052A51;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #fff;
    }

    .store-name {
      font-size: 16px;
      font-weight: 800;
      color: #052A51;
    }

    .store-status {
      font-size: 12px;
      font-weight: 700;
      color: #10B981;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }

    .green-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
    }

    .quick-add-btn {
      background: #F26522;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(242, 101, 34, 0.25);
    }

    .screen-title {
      font-size: 20px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.5px;
    }

    .screen-sub {
      font-size: 13px;
      color: #64748B;
      font-weight: 600;
      margin-top: 2px;
    }

    .filter-pill, .badge-status-ok, .badge-gst {
      background: #ECFDF5;
      color: #065F46;
      font-weight: 800;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #A7F3D0;
    }

    .badge-pill-orange {
      background: #FFF7ED;
      color: #C2410C;
      font-weight: 800;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #FFEDD5;
    }

    /* Stat Banner */
    .stat-banner {
      background: linear-gradient(135deg, #052A51 0%, #083B70 100%);
      border-radius: 18px;
      padding: 18px 22px;
      color: #FFFFFF;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(5, 42, 81, 0.18);
    }

    .stat-banner-label {
      font-size: 12px;
      font-weight: 800;
      color: #93C5FD;
      letter-spacing: 0.8px;
    }

    .stat-val-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 4px;
    }

    .stat-val {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: -1px;
    }

    .trend-badge {
      background: rgba(16, 185, 129, 0.25);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .stat-sub-row {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 13px;
      color: #CBD5E1;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .mini-stat-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }

    .mini-label {
      font-size: 11px;
      font-weight: 800;
      color: #64748B;
      letter-spacing: 0.5px;
    }

    .mini-val {
      font-size: 20px;
      font-weight: 900;
      margin: 3px 0 1px;
    }

    .mini-note {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 600;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 900;
      color: #052A51;
    }

    .section-link {
      font-size: 12px;
      font-weight: 800;
      color: #F26522;
    }

    /* Cards */
    .card-item {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      margin-bottom: 12px;
    }

    .card-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .order-badge {
      background: #EFF6FF;
      color: #1E40AF;
      font-weight: 800;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .timer-pill {
      background: #FEF3C7;
      color: #B45309;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .status-pill-green {
      background: #ECFDF5;
      color: #065F46;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .tag-status {
      background: #FFF7ED;
      color: #C2410C;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .item-title {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 3px;
    }

    .item-details {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .btn-row {
      display: flex;
      gap: 10px;
    }

    .btn-primary {
      flex: 1;
      background: #F26522;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      text-align: center;
      padding: 10px 0;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(242, 101, 34, 0.25);
    }

    .btn-secondary {
      background: #F1F5F9;
      color: #052A51;
      font-size: 12px;
      font-weight: 800;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-outline-green {
      flex: 1;
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      font-size: 13px;
      font-weight: 800;
      text-align: center;
      padding: 10px 0;
      border-radius: 10px;
    }

    /* Tabs */
    .status-tab-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }

    .tab-chip {
      background: #F1F5F9;
      color: #64748B;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 16px;
    }

    .tab-active {
      background: #052A51;
      color: #ffffff;
    }

    /* Dispatch Big Card */
    .dispatch-highlight-card {
      background: #FFFFFF;
      border: 2px solid #F26522;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(242, 101, 34, 0.12);
      margin-bottom: 14px;
    }

    .dispatch-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .urgent-tag {
      background: #FEE2E2;
      color: #B91C1C;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .timer-badge-big {
      background: #FEF3C7;
      color: #B45309;
      font-size: 12px;
      font-weight: 900;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .dispatch-order-num {
      font-size: 16px;
      font-weight: 900;
      color: #052A51;
      margin-bottom: 8px;
    }

    .dispatch-product-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F8FAFC;
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .prod-icon {
      font-size: 22px;
    }

    .prod-name {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
    }

    .prod-variant {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }

    .delivery-address-box {
      font-size: 12px;
      color: #334155;
      background: #F1F5F9;
      padding: 8px 12px;
      border-radius: 8px;
      line-height: 1.35;
    }

    /* Catalog Screen Components */
    .search-bar-mock {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .cat-pill-scroll {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
      overflow: hidden;
    }

    .cat-pill {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      color: #64748B;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 16px;
      white-space: nowrap;
    }

    .cat-pill-sel {
      background: #052A51;
      color: #FFFFFF;
      border-color: #052A51;
    }

    .product-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }

    .prod-thumb {
      width: 58px;
      height: 58px;
      border-radius: 10px;
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .prod-details-col {
      flex: 1;
    }

    .prod-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .prod-title {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
    }

    .stock-badge-in {
      background: #ECFDF5;
      color: #065F46;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 5px;
    }

    .stock-badge-low {
      background: #FEF3C7;
      color: #B45309;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 5px;
    }

    .prod-specs {
      font-size: 11px;
      color: #64748B;
      margin-bottom: 4px;
    }

    .prod-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #052A51;
    }

    .sub-price {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
    }

    .stock-count-pill {
      background: #F1F5F9;
      color: #334155;
      font-weight: 800;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 5px;
    }

    .toggle-mock {
      font-size: 11px;
      font-weight: 800;
      color: #10B981;
    }

    .bulk-bar {
      background: #FFF7ED;
      border: 1px dashed #F26522;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #C2410C;
      font-weight: 700;
      margin-top: 4px;
    }

    /* Invoice Screen Components */
    .invoice-sheet {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 16px;
      padding: 16px 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }

    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .inv-brand {
      font-size: 15px;
      font-weight: 900;
      color: #052A51;
      letter-spacing: -0.3px;
    }

    .inv-sub {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }

    .inv-no {
      text-align: right;
      font-size: 11px;
      color: #334155;
      line-height: 1.4;
    }

    .inv-divider {
      height: 1px;
      background: #E2E8F0;
      margin: 12px 0;
    }

    .inv-party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      font-size: 11px;
    }

    .party-label {
      font-size: 10px;
      font-weight: 800;
      color: #94A3B8;
      letter-spacing: 0.5px;
    }

    .party-name {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      margin: 2px 0;
    }

    .party-sub {
      color: #64748B;
      line-height: 1.3;
    }

    .inv-table-header {
      display: flex;
      background: #F8FAFC;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
    }

    .inv-table-row {
      display: flex;
      padding: 8px;
      border-bottom: 1px dashed #E2E8F0;
      font-size: 11px;
      color: #1E293B;
    }

    .inv-total-grid {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      font-size: 12px;
      color: #475569;
    }

    .grand-total {
      font-size: 15px;
      font-weight: 900;
      color: #052A51;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 2px solid #052A51;
    }

    /* Payout Screen Components */
    .balance-card-purple {
      background: linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%);
      border-radius: 18px;
      padding: 20px;
      color: #FFFFFF;
      box-shadow: 0 8px 24px rgba(109, 40, 217, 0.2);
      margin-bottom: 14px;
    }

    .bal-label {
      font-size: 11px;
      font-weight: 800;
      color: #DDD6FE;
      letter-spacing: 0.8px;
    }

    .bal-amount {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -1px;
      margin: 3px 0;
    }

    .bal-next {
      font-size: 12px;
      color: #E9D5FF;
      margin-bottom: 14px;
    }

    .bal-stats-grid {
      display: flex;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }

    .bal-sublabel {
      font-size: 10px;
      color: #C4B5FD;
      font-weight: 700;
    }

    .bal-subval {
      font-size: 16px;
      font-weight: 900;
      color: #FFFFFF;
      margin-top: 2px;
    }

    .bank-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      margin-bottom: 12px;
    }

    .bank-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: #052A51;
    }

    .badge-verified {
      background: #ECFDF5;
      color: #065F46;
      font-weight: 800;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 5px;
    }

    .bank-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #475569;
      margin-bottom: 3px;
    }

    .payout-row {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .payout-ref {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
    }

    .payout-date {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }

    .payout-amt {
      font-size: 15px;
      font-weight: 900;
      color: #10B981;
    }

    .payout-status-green {
      font-size: 10px;
      font-weight: 700;
      color: #059669;
    }

    /* Store Settings Components */
    .gps-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .gps-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #052A51;
      margin-bottom: 4px;
    }

    .gps-link {
      font-size: 11px;
      font-weight: 800;
      color: #F26522;
    }

    .gps-desc {
      font-size: 12px;
      color: #64748B;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .coords-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #334155;
      margin-bottom: 8px;
    }

    .service-radius-pill {
      font-size: 11px;
      color: #052A51;
      background: #EFF6FF;
      padding: 6px 10px;
      border-radius: 6px;
    }

    .logistics-mode-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }

    .mode-title {
      font-size: 13px;
      font-weight: 900;
      color: #052A51;
      margin-bottom: 8px;
    }

    .mode-option {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
    }

    .mode-selected {
      background: #EFF6FF;
      border-color: #3B82F6;
    }

    .mode-radio-sel {
      color: #3B82F6;
      font-size: 14px;
      font-weight: 900;
    }

    .mode-radio {
      color: #94A3B8;
      font-size: 14px;
    }

    .mode-name {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
    }

    .mode-sub {
      font-size: 10px;
      color: #64748B;
      margin-top: 1px;
    }

    .toggle-card {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .toggle-title {
      font-size: 13px;
      font-weight: 800;
      color: #166534;
    }

    .toggle-desc {
      font-size: 11px;
      color: #4B5563;
      margin-top: 1px;
    }

    .toggle-switch-on {
      width: 46px;
      height: 24px;
      border-radius: 12px;
      background: #10B981;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 2px;
    }

    .toggle-knob {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #FFFFFF;
    }

    .support-bar {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

  </style>
</head>
<body>

  <div class="bg-gradient"></div>
  <div class="blueprint-grid"></div>

  <div class="container">

    <!-- Top Promotional Banner -->
    <div class="promo-banner">
      <div class="brand-tag-row">
        <div class="brand-capsule">
          ${iconBase64 ? `<img src="${iconBase64}" class="brand-icon" alt="Icon" />` : `🏢`}
          <span class="brand-name">IntriHub Business</span>
        </div>
        <div class="pill-badge">${screen.pillTag}</div>
      </div>

      <h1 class="headline">${screen.headline}</h1>
      <p class="subheadline">${screen.subheadline}</p>
    </div>

    <!-- Phone Frame Mockup -->
    <div class="phone-wrapper">
      <div class="phone-notch">
        <div class="notch-camera-lens"></div>
      </div>

      <!-- Android Status Bar -->
      <div class="status-bar">
        <span>09:41</span>
        <div style="display: flex; gap: 8px;">
          <span>📶 5G</span>
          <span>🔋 100%</span>
        </div>
      </div>

      <!-- Live App Screen Inside Mockup -->
      <div class="app-screen-body">
        ${screen.renderContent}
      </div>

      <!-- Bottom Tab Navigation Bar -->
      ${getBottomTabBar(screen.activeTab)}
    </div>

  </div>

</body>
</html>
  `;
}

async function run() {
  console.log("Generating Enhanced Business Phone Screenshots (1080x1920, 9:16)...");

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

    // 1080x1920 viewport (exact 9:16 portrait)
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
      const jpgName = `${screen.filename}.jpg`;

      const pngPath = path.join(SCREENSHOTS_DIR, pngName);
      const jpgPath = path.join(SCREENSHOTS_DIR, jpgName);

      // Save PNG
      await page.screenshot({
        path: pngPath,
        type: "png",
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });

      // Save JPEG (95% quality, < 8 MB)
      await page.screenshot({
        path: jpgPath,
        type: "jpeg",
        quality: 95,
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
      });

      const pngSize = (fs.statSync(pngPath).size / 1024).toFixed(1);
      const jpgSize = (fs.statSync(jpgPath).size / 1024).toFixed(1);

      console.log(`✓ [${i + 1}/6] Generated ${pngName} (${pngSize} KB) & ${jpgName} (${jpgSize} KB)`);
    }

    console.log("\nAll 6 Enhanced Phone Screenshots ready in:");
    console.log(SCREENSHOTS_DIR);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Screenshot generation error:", err);
  process.exit(1);
});
