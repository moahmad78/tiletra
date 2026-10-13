# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Item Upload & Variant Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Core Goal:** Mobile App, Tablet, aur Desktop par Vendors, CPO, aur Admins ke liye hardware, interior, plumbing, electrical, aur construction materials ko super-fast live/draft karne ka responsive & financially transparent workflow.

---

## 1. Executive Summary & Objective
IntriHub e-commerce marketplace par complex material attributes (sizes, thickness, colors, volume units, bulk pricing) hote hain. Is module ka target vendor onboarding time ko fast karna, dynamic sub-categories & variants handle karna, **3-Tier Financial Pricing Engine (MRP, Selling Price, Cost Price)** with **Real-Time Admin Profit Margin % Calculation**, mobile responsiveness, 📌 Pin Default Preferences, Auto Slug Generation, aur Real-Time Stock Detection & Alerts provide karna hai.

---

## 2. Financial Pricing Engine & Privacy Access Control

| User Role | Visible Pricing Fields | Auto-Calculated Metrics | Privacy Rule |
| :--- | :--- | :--- | :--- |
| **Vendor / Merchant** | 1. MRP (₹)<br>2. Selling Price (₹)<br>3. Cost Price (₹) | Customer Discount % `((MRP - SP)/MRP * 100)` | **Margin % HIDDEN.** Vendor cannot see platform net margin/profit. |
| **Admin / CPO Panel** | 1. MRP (₹)<br>2. Selling Price (₹)<br>3. Cost Price (₹) | ⚡ **Net Profit (₹):** `SP - CP`<br>⚡ **Profit Margin (%):** `((SP - CP)/SP) * 100`<br>⚡ **Customer Discount (%):** `((MRP - SP)/MRP * 100)` | **FULL ACCESS.** Real-time live profit percentage & analytics visible on form submission. |

---

## 3. End-to-End Functional Architecture & Workflow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: CATEGORY SELECTION                      │
│ [ Primary Category Dropdown  ▼ ]  [+ Add New]                           │
│ [ Sub-Category Dropdown      ▼ ]  [+ Add New]                           │
│ [ 📌 Set Selection as Default Toggle ]                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 2: PARENT ITEM DETAILS                        │
│ Product Title ──► ⚡ Auto Slug Engine (Backend Auto-Gen)               │
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
│ │ • Selling Unit Dropdown         │ 🚨 Low Stock Threshold Limit    │ │
│ │ 💰 PRICING MATRIX:                                                 │ │
│ │   [ MRP (₹) ]  [ Selling Price (₹) ]  [ Cost / Purchase Rate (₹) ] │ │
│ │                                                                    │ │
│ │ 🟢 ADMIN/CPO REAL-TIME LIVE INDICATOR (Hidden for Vendor):          │ │
│ │   ⚡ Profit: ₹150  |  📊 Margin: 27.2%  | 🏷️ Customer Disc: 20%     │ │
│ │ • Total Available Stock Count   │ Smart Calculator Coverage       │ │
│ │ • Touch Multi-Image Picker Upload                                  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ 👉 [ Save Variant ]  │  👉 [ 📄 Duplicate Variant Card ]              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 4: LOGISTICS & DELIVERY SETTINGS                 │
│ (•) ⚡ Instant Delivery (60-90 Mins) [DEFAULT]                          │
│ ( ) 🚛 Custom Heavy / Bulky Dispatch (ETA Window)                       │
│ 📌 [ Pin Delivery Option as Default ]                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 5: RETURN & REPLACEMENT POLICY                  │
│ Return Toggle: [ ON / OFF ]                                            │
│ If ON ──► Days, Refund/Replacement Type, Condition Notes              │
│ 📌 [ Pin Return Policy as Default ]                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 6: STICKY MOBILE BOTTOM BAR                   │
│ [ 💾 Draft ]             [ 👁️ Preview ]          [ 🚀 Publish Live ]   │
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

// 2. PARENT PRODUCT & VARIANT TABLES (Includes 3-Tier Financial Pricing & Auto Slug)
model Product {
  id               String           @id @default(uuid())
  title            String
  slug             String           @unique // ⚡ Auto-generated from title
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
  sellingPrice      Float       // Selling/Discounted Rate for Customer
  costPrice         Float       // Purchase/Landing Cost (For Margin Calculation)
  
  stockQuantity     Int         @default(0)
  lowStockThreshold Int         @default(5)  // 🚨 Triggers Alert when stock <= threshold
  stockStatus       StockStatus @default(IN_STOCK)
  coveragePerUnit   Float?      // For Smart Calculator (e.g., 1 box = 15.5 sq ft)
  images            String[]    // Array of image URLs
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

## 5. Live Profit Calculation Formulae (For Admin/CPO Dashboard)

```typescript
// Backend / Admin UI Logic
function calculateMetrics(mrp: number, sellingPrice: number, costPrice: number) {
  const netProfit = sellingPrice - costPrice;
  const profitMarginPercentage = sellingPrice > 0 ? ((netProfit / sellingPrice) * 100).toFixed(2) : 0;
  const customerDiscountPercentage = mrp > 0 ? (((mrp - sellingPrice) / mrp) * 100).toFixed(2) : 0;

  return {
    netProfit,                     // e.g. ₹150
    profitMarginPercentage,        // e.g. 27.27%
    customerDiscountPercentage     // e.g. 20.00%
  };
}
```

---

## 6. Non-Functional & UI Requirements
1. **Responsive Input Focus:** 3 Pricing inputs (MRP, Selling Price, Cost Price) mobile screen par numerical keypad (`inputMode="decimal"`) ke saath side-by-side (3 columns) ya clean 1-column layout mein render hote hain.
2. **Privacy Guarding:** Vendor Token API response se `costPrice` aur `profitMargin` fields frontend Redux/State ya vendor-facing DOM mein kabhi leak nahi hone chahiye.
3. **Storage & Auto-Slug:** WebP auto-compression and unique slug collision checks (`-1`, `-2`) backend level par handle kiye gaye hain.
