# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Item Upload & Variant Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Target Platforms:** Mobile App (React Native), Mobile Web, and Desktop Admin Panel (Next.js)
* **Core Goal:** Hardware, interior, plumbing, electrical, aur construction materials ko super-fast, responsive, aur financially transparent workflow ke saath list, draft, aur live karna.

---

## 1. Executive Summary & Core Business Logic
IntriHub marketplace par complex construction materials ke alag-alag dimensions, colors, units, aur bulk rates hote hain. Is module ka target vendor onboarding time reduce karna, dynamic master lookup expansion (`+ Add New`) allow karna, **3-Tier Financial Pricing (MRP, Sale Price, Purchase Cost)** with **Real-Time Admin Margin % Calculation**, **Promotional Badges/Tags**, **Auto-Slug Generation**, **Real-Time Stock Detection & Low-Stock Alerts**, aur **📌 Pin Default Preferences** provide karna hai.

---

## 2. Dynamic Roles & Financial Privacy Matrix

| User Role | Visible Pricing & Fields | Auto-Calculated Metrics | Privacy & Security Rules |
| :--- | :--- | :--- | :--- |
| **Vendor / Merchant** | • MRP (₹)<br>• Selling / Offer Price (₹)<br>• Purchase / Cost Rate (₹) | Customer Discount % `((MRP - SP)/MRP * 100)` | 🔒 **Profit Margin % is HIDDEN.** Vendor cannot view platform net margin/profit analytics. |
| **Admin / CPO Panel** | • MRP (₹)<br>• Selling / Offer Price (₹)<br>• Purchase / Cost Rate (₹) | ⚡ **Net Profit (₹):** `SP - CP`<br>⚡ **Profit Margin (%):** `((SP - CP)/SP) * 100`<br>⚡ **Customer Discount (%):** `((MRP - SP)/MRP * 100)` | 🔓 **FULL ACCESS.** Live profit margin & discount analytics update in real-time as rates are typed. |

---

## 3. End-to-End Functional Architecture & Mobile Workflow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: CATEGORY SELECTION                      │
│ [ Primary Category Dropdown  ▼ ]  [+ Add New]                           │
│ [ Sub-Category Dropdown      ▼ ]  [+ Add New]                           │
│ [ 📌 Set Category Selection as Default Toggle ]                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 2: PARENT ITEM DETAILS                        │
│ Product Title ──► ⚡ Auto Slug Engine (Backend/Frontend Auto-Gen)     │
│ [ Brand Name Dropdown        ▼ ]  [+ Add New]                           │
│ Product Description (Expandable Text Area)                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             STEP 3: MULTI-VARIANT, PRICING & STOCK MANAGEMENT          │
│ 👉 [ + Add Multi-Variant / Sub-Item ] Full-Width Touch Button          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Mobile Bottom-Sheet Modal:                                         │ │
│ │ • Size / Dimension Dropdown      │ Color / Shade Dropdown          │ │
│ │ • Selling Unit Dropdown         │ Smart Calculator Coverage       │ │
│ │                                                                    │ │
│ │ 💰 3-TIER PRICING MATRIX:                                          │ │
│ │   [ MRP (₹) ]  [ Selling Price (₹) ]  [ Cost / Purchase Rate (₹) ] │ │
│ │                                                                    │ │
│ │ 🟢 ADMIN/CPO REAL-TIME INDICATOR (Hidden for Vendor):              │ │
│ │   ⚡ Profit: ₹150  |  📊 Margin: 27.2%  | 🏷️ Customer Disc: 31%     │ │
│ │                                                                    │ │
│ │ 🚨 STOCK & ALERT SETTINGS:                                         │ │
│ │   [ Total Stock Count: 150 ]   [ Low Stock Alert Threshold: 10 ]   │ │
│ │ • Touch Multi-Image Picker Upload                                  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ 👉 [ Save Variant ]  │  👉 [ 📄 Duplicate Variant Card ]              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 4: BADGES & PROMOTIONAL LABELS                   │
│ ⚡ Auto Discount Badge: [ ON / OFF ] (Calculates "% OFF" dynamically)  │
│ Select Tags: [ 🔥 Best Seller ] [ 🏬 Factory Price ] [ ⚡ Quick Dispatch]│
│ Custom Text Badge: [ Enter Custom Text ] Color: (•) 🔴 Red ( ) 🟢 Green│
│ 📌 [ Pin Badge Selection as Default ]                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 5: LOGISTICS & DELIVERY SETTINGS                 │
│ (•) ⚡ Instant Delivery (60-90 Mins) [DEFAULT]                          │
│ ( ) 🚛 Custom Heavy / Bulky Dispatch (Estimated ETA Window)             │
│ 📌 [ Pin Selected Delivery Option as Default ]                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 6: RETURN & REPLACEMENT POLICY                  │
│ Return Toggle: [ ON / OFF ]                                            │
│ If ON ──► Days, Refund/Replacement Type, Condition Notes              │
│ 📌 [ Pin Return Policy as Default ]                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 7: STICKY MOBILE BOTTOM BAR                   │
│ [ 💾 Save Draft ]         [ 👁️ Preview ]          [ 🚀 Publish Live ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Specifications & Database Schema (Prisma ORM)

```prisma
// 1. MASTER LOOKUP TABLES (For Dynamic + Add New Feature)
model MasterCategory {
  id            String              @id @default(uuid())
  name          String              @unique
  slug          String              @unique // Auto-generated
  subCategories MasterSubCategory[]
  createdAt     DateTime            @default(now())
}

model MasterSubCategory {
  id         String         @id @default(uuid())
  name       String
  slug       String         @unique // Auto-generated
  categoryId String
  category   MasterCategory @relation(fields: [categoryId], references: [id])
}

model MasterBrand {
  id         String  @id @default(uuid())
  name       String  @unique
  slug       String  @unique // Auto-generated
  isApproved Boolean @default(true)
}

model MasterAttribute {
  id    String        @id @default(uuid())
  type  AttributeType // SIZE, COLOR, MATERIAL_GRADE, UNIT
  value String
}

enum AttributeType {
  SIZE
  COLOR
  MATERIAL_GRADE
  UNIT
}

// 2. PARENT PRODUCT & VARIANT TABLES (Includes Pricing, Badges, Auto-Slug & Stock)
model Product {
  id               String           @id @default(uuid())
  title            String
  slug             String           @unique // ⚡ Auto-generated from Title
  description      String?
  categoryId       String
  subCategoryId    String
  brandId          String
  deliveryType     DeliveryType     @default(INSTANT)
  customEta        String?          // e.g. "Next Day Dispatch"
  isReturnable     Boolean          @default(false)
  returnDays       Int?
  returnConditions String?
  status           ProductStatus    @default(DRAFT)
  variants         ProductVariant[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model ProductVariant {
  id                String      @id @default(uuid())
  productId         String
  product           Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku               String      @unique
  size              String?     // e.g., "600x600mm"
  color             String?     // e.g., "Glossy White"
  unit              String      // e.g., "Box", "Meter"
  
  // 💰 3-TIER PRICING FIELDS
  mrp               Float       // Maximum Retail Price
  sellingPrice      Float       // Sale Price for Customer
  costPrice         Float       // Purchase/Landing Cost for Vendor
  
  // 🚨 STOCK MANAGEMENT
  stockQuantity     Int         @default(0)
  lowStockThreshold Int         @default(5)  // Triggers alert when stock <= threshold
  stockStatus       StockStatus @default(IN_STOCK)
  coveragePerUnit   Float?      // For Smart Calculator (e.g., 1 box = 15.5 sq ft)
  
  // 🏷️ BADGES & LABELS
  customBadgeText   String?     // e.g., "Buy 10 Get 1 Free"
  badgeColor        String?     // e.g., "RED", "GOLD", "GREEN"
  tags              String[]    // Array e.g. ["BEST_SELLER", "FACTORY_PRICE"]
  showAutoDiscount  Boolean     @default(true)
  
  images            String[]    // Array of Image URLs
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// 3. USER PREFERENCES (For 📌 Pin Default Feature)
model UserPreference {
  userId            String       @id
  defaultCategoryId String?
  defaultSubCatId   String?
  defaultBrandId    String?
  defaultDelivery   DeliveryType @default(INSTANT)
  defaultReturnDays Int?
  defaultTags       String[]
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
}

enum DeliveryType {
  INSTANT
  CUSTOM_HEAVY
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 5. System Logic & Formulas

### A. Auto-Slug Engine Logic (Node.js)
```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}
// Collision Example: "finolex-wire" -> "finolex-wire-1"
```

### B. Admin Profit & Discount Margin Formulas
```typescript
function calculateAdminMetrics(mrp: number, sellingPrice: number, costPrice: number) {
  const netProfit = sellingPrice - costPrice;
  const profitMarginPercentage = sellingPrice > 0 ? ((netProfit / sellingPrice) * 100).toFixed(2) : 0;
  const customerDiscountPercentage = mrp > 0 ? (((mrp - sellingPrice) / mrp) * 100).toFixed(2) : 0;

  return { netProfit, profitMarginPercentage, customerDiscountPercentage };
}
```

### C. Low Stock Alert Logic
```typescript
if (stockQuantity <= lowStockThreshold && stockQuantity > 0) {
  stockStatus = "LOW_STOCK";
  sendPushNotification(vendorId, `Alert: ${variantName} stock is low (${stockQuantity} left)`);
} else if (stockQuantity === 0) {
  stockStatus = "OUT_OF_STOCK";
  disableAddToCartOnUserApp(variantId);
}
```

---

## 6. CSS / Responsive Touch Target Rules
* **Mobile Responsive Container:** `w-full max-w-2xl mx-auto px-4 py-6`
* **Touch Target Standard:** All Dropdowns, Inputs, and Badges must have a minimum height of `h-12` (48px) for thumb-friendly usage.
* **Sticky Bottom Navigation:** `fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-3 shadow-2xl flex gap-2`

---

## 7. Release Milestones & Execution Plan
* **Phase 1 (Core Engine & Responsive UI):** Mobile & Desktop form layout, Category Selection, Auto Slug generation, Draft/Publish Live status controls.
* **Phase 2 (Pricing, Variant & Badge Matrix):** 3-Tier Pricing, Admin Real-Time Margin calculation, Mobile Bottom-Sheet for Variants, Badges & Custom Text Tags, Dynamic + Add New master tables.
* **Phase 3 (Preferences, Logistics & Stock Engine):** 📌 Pin Default preference persistence, Custom Return Drawer, Heavy vs Instant Delivery toggle, and Automated Low-Stock Alert Notifications.
