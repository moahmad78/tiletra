# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Item Upload & Variant Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Core Goal:** Mobile App, Tablet, aur Desktop par Vendors, CPO, aur Admins ke liye hardware, interior, plumbing, electrical, aur construction materials ko super-fast live/draft karne ka responsive workflow.

---

## 1. Executive Summary & Objective
IntriHub e-commerce marketplace par complex material attributes (sizes, thickness, colors, volume units, bulk pricing) hote hain. Is module ka target mobile responsiveness, fast vendor onboarding, dynamic variants, dynamic master lookup expansion (+ Add New), 📌 Pin Default Preferences, Auto Slug Generation, aur Real-Time Stock Detection & Alerts provide karna hai.

---

## 2. Responsive Mobile & App UI Strategy

### 📱 Key Mobile UX Principles
1. **Single-Column Stacked Layout:** Mobile screens (React Native / Mobile Web) par saare fields 100% full width (`w-full`) ek column mein auto-adjust honge (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
2. **Sticky Bottom Action Sheet:** Draft, Preview, aur Publish Live buttons hamesha screen ke bottom par pinned rahenge (`fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-3 shadow-lg flex gap-2`) taaki user ko scroll na karna pade.
3. **Card-Based Mobile Table:** Desktop par dikhne wala Variant Summary Table mobile screen par **Swipeable / Stacked Cards** (`block md:hidden`) mein convert ho jayega.
4. **Touch-Friendly Controls:** Dropdowns, `+ Add New` Modals, aur Pin Icons 48px+ touch targets ke saath honge taaki thumb-use easy ho.

---

## 3. End-to-End Functional Architecture & Mobile Workflow

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
│                   STEP 3: MULTI-VARIANT & STOCK MANAGEMENT             │
│ 👉 [ + Add Multi-Variant / Sub-Item ] Full-Width Touch Button          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Mobile Bottom-Sheet Modal:                                         │ │
│ │ • Size / Dimension Dropdown      │ Color / Shade Dropdown          │ │
│ │ • Selling Unit Dropdown         │ Price, MRP & Stock Count        │ │
│ │ • 🚨 Low Stock Threshold Limit  │ Smart Calculator Coverage       │ │
│ │ • Touch Multi-Image Picker Upload                                  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ 👉 [ Save Variant ]  │  👉 [ 📄 Duplicate Variant Card ]              │
│                                                                        │
│ 📱 Mobile Variant Card View (Responsive Table Alternative):            │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 🖼️ Img │ 600x600mm | Glossy White | ₹550 | Stock: 150              │ │
│ │ [ ✏️ Edit ]   [ 🗑️ Delete ]   [ 📄 Duplicate ]                      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
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
Code snippet architecture supporting Auto Slug, Master Lookups, Parent Products, Variants with Stock Thresholds, and User Preference Defaults:

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

## 5. CSS / Tailwind Responsive Rules (For Mobile & Web)
- **Container Fluidity:** `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grid Breakpoints:** Single column on mobile (`grid-cols-1`), 2 columns on tablet (`md:grid-cols-2`), 3 columns on desktop (`lg:grid-cols-3`).
- **Sticky Navigation Bar:** `fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-3 shadow-lg flex gap-2`
- **Touch Optimization:** Inputs/Buttons min-height `h-12` (48px) with `rounded-xl` for smooth tap targets.

---

## 6. Auto Slug & Stock Detection Engine Rules
### Auto Slug Generation:
- `"Finolex 4mm Wire"` ──► `"finolex-4mm-wire"` (Automated slug with collision check `-1`, `-2`).

### Stock Alert Detection:
- When `stockQuantity <= lowStockThreshold`, trigger push notification & mark variant as `LOW_STOCK`.
- When `stockQuantity == 0`, mark variant as `OUT_OF_STOCK` & disable cart button on user app.
