# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Item Upload & Variant Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Core Goal:** Vendors, CPO, aur Admins ke liye hardware, interior, plumbing, electrical, aur construction materials ko high speed aur flexibility ke saath live/draft karne ka seamless workflow.

---

## 1. Executive Summary & Objective
IntriHub e-commerce marketplace par complex material attributes (sizes, thickness, colors, volume units, bulk pricing) hote hain. Is module ka target vendor onboarding time ko fast karna, dynamic sub-categories & variants handle karna, dynamic master lookup expansion (+ Add New) allow karna, 📌 Pin Default Preference features, **Auto Slug Generation from Title/Heading**, aur **Real-Time Stock Detection & Automated Low-Stock Alerts** provide karna hai.

---

## 2. Core User Stories & Roles

| Role | User Story |
| :--- | :--- |
| **Vendor / Merchant** | Main seller jo bulk inventory list karta hai, fast repeating uploads karta hai, aur automatic slug creation & stock alerts chahta hai. |
| **CPO / Catalog Manager** | Main admin jo brand/category taxonomy clean rakhta hai aur custom master data approve/manage karta hai. |
| **Contractor / Customer** | End-buyer jo precise size, color, coverage, delivery ETA, aur real-time stock availability ke hisaab se correct product select karta hai. |

---

## 3. End-to-End Functional Architecture & Workflow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: CATEGORY SELECTION                      │
│ Primary Category Dropdown  │ Sub-Category Dropdown │ 📌 Pin Default     │
│ [+ Add New Category]      │ [+ Add New Sub-Cat]   │                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 2: PARENT ITEM DETAILS                        │
│ Product Title ──► ⚡ Auto Slug Engine (Backend/Frontend Auto-Gen)     │
│ Brand Name (+ Add New) │ Product Description                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 3: MULTI-VARIANT & STOCK MANAGEMENT             │
│ 👉 [ + Add Multi-Variant / Sub-Item ] Button                           │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Variant Modal / Form / Table:                                      │ │
│ │ • Size / Dimension (+ Add New)  │ Color / Shade (+ Add New)        │ │
│ │ • Selling Unit (+ Add New)      │ Selling Price & MRP              │ │
│ │ • Total Available Stock Count   │ 🚨 Low Stock Alert Threshold Limit│ │
│ │ • Variant Images Upload         │ Stock Count & SKU                │ │
│ │ • Smart Calculator Coverage     │ B2B Tier Pricing (Bulk)          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ 👉 [ Save Sub-Item ]  │  👉 [ 📄 Duplicate Variant ]                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 4: LOGISTICS & DELIVERY SETTINGS                 │
│ (•) ⚡ Instant Delivery (60-90 Mins) [DEFAULT]                          │
│ ( ) 🚛 Custom Heavy / Bulky Dispatch (Estimated ETA Window)             │
│ 📌 [ Pin Selected Option as Default ]                                  │
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
│                         STEP 6: BOTTOM ACTION BAR                      │
│ [ 💾 Save to Draft ]        [ 👁️ Preview ]       [ 🚀 Publish Live ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Specifications & Database Schema (Prisma ORM)
Below is the database architecture to support Auto Slug, Master Lookups, Parent Products, Variants with Stock Thresholds, and User Preference Defaults:

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

// 2. PARENT PRODUCT & VARIANT TABLES (Includes Auto Slug & Stock Detection)
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
  mrp               Float
  sellingPrice      Float
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

## 5. Auto Slug Generation Engine Rules (Node.js / Backend Logic)
### Title-to-Slug Conversion:
Jaise hi user Product Title/Heading enter karta hai, system automatically slug format karta hai:
- Lowercase conversion.
- Special characters remove honge.
- Spaces ko `-` (dash) se replace kiya jayega.
- Example: `"Finolex 4mm Copper Wire (Red)"` ──► `"finolex-4mm-copper-wire-red"`

### Unique Slug Collision Handling:
Agar exact same slug pehle se DB mein exist karta hai, toh backend automatically incremental suffix add kar dega:
- Example: `"finolex-4mm-copper-wire-red-1"`, `"finolex-4mm-copper-wire-red-2"`

---

## 6. Stock Detection & Notification Trigger Rules
### Low Stock Detection Logic:
When `stockQuantity <= lowStockThreshold`:
- System automatically sets `stockStatus = LOW_STOCK`.
- Push Notification / Alert trigger hoti hai Dark Store / Vendor ke liye.
- Variant ko Vendor / CPO dashboard mein **Orange Warning Badge (Low Stock ⚠️)** se highlight kiya jata hai.

### Out of Stock Logic:
When `stockQuantity == 0`:
- System automatically sets `stockStatus = OUT_OF_STOCK`.
- Storefront aur apps par **"Out of Stock / Restocking Soon" (Red Badge)** display hota hai.
- Disables "Add to Cart" for that specific variant to avoid unfulfillable orders.

---

## 7. Non-Functional Requirements (NFRs)
- **Performance:** Form validation, auto slug generation, aur variant array manipulation frontend/backend par under 100ms execute honi chahiye.
- **Storage & Optimisation:** Images ko WebP format mein auto-compress karke CDN / local upload endpoint par store kiya jaye.
- **Master Data Sanitization:** `+ Add New` se add kiye gaye attributes baseline DB mein sanitize hoke auto-capitalize aur trim hon taaki duplicates na banein (e.g., `"600x600 mm"` vs `"600x600mm"`).
