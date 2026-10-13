# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Multi-Vendor Item Upload, Inventory & Order Routing Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Target Platforms:** Mobile App (React Native), Mobile Web, and Desktop Admin Panel (Next.js)
* **Core Goal:** Hardware, interior, plumbing, electrical, aur construction materials ko super-fast, responsive, financially transparent, aur vendor-specific inventory/order mapping ke saath manage karna.

---

## 1. Executive Summary & Core Multi-Vendor Logic
IntriHub marketplace ek multi-vendor B2B quick-commerce platform hai. Is module ka target vendor-level isolation maintain karna hai:
* **Vendor Privacy:** Vendors ko sirf unke dwara upload kiye gaye (ya Admin dwara unhe assign kiye gaye) products hi unke dashboard/app par dikhenge.
* **Direct Order Routing:** Jab koi customer app par order place karega, toh system product ki `vendorId` read karke order dispatch notification **sirf usi specific vendor ke panel/app** par bhejega.
* **CPO Panel Assignment:** Admin/CPO Panel se item upload karte waqt dropdown se targeted vendor ko choose karne ka option rahega, jisse wo item directly us vendor ki account mapping mein chala jaye.

---

## 2. Dynamic Roles, Multi-Vendor Scope & Financial Privacy Matrix

| User Role | Visible Inventory Scope | Order Routing Queue | Pricing Visibility & Metrics |
| :--- | :--- | :--- | :--- |
| **Vendor / Merchant** | 🔒 **Only Self-Uploaded / Assigned Items** (`vendorId == currentVendor.id`) | 📦 **Self Orders Only.** Receives orders for items listed under their vendor account. | • MRP (₹)<br>• Selling Price (₹)<br>• Purchase Cost (₹)<br>🔒 **Profit Margin % is HIDDEN.** |
| **Admin / CPO Panel** | 🌐 **Global Inventory View.** Can filter products by specific Vendor. | 🚚 **All Platform Orders.** Can track fulfillment across all Dark Stores & Vendors. | 🔓 **FULL ACCESS.**<br>⚡ Net Profit (₹)<br>⚡ Profit Margin (%)<br>⚡ Customer Discount (%) |

---

## 3. End-to-End Functional Architecture & Mobile Workflow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 1: VENDOR / STORE MAPPING                       │
│ Vendor App: Auto-mapped to logged-in Vendor ID                         │
│ CPO/Admin Panel: [ Select Target Vendor Dropdown ▼ ] [+ Add New Vendor]│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 2: CATEGORY SELECTION                      │
│ [ Primary Category Dropdown  ▼ ]  [+ Add New Category]                 │
│ [ Sub-Category Dropdown      ▼ ]  [+ Add New Sub-Cat]                  │
│ [ 📌 Set Category Selection as Default Toggle ]                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 3: PARENT ITEM DETAILS                        │
│ Product Title ──► ⚡ Auto Slug Engine (Backend/Frontend Auto-Gen)     │
│ [ Brand Name Dropdown        ▼ ]  [+ Add New Brand]                 │
│ Product Description (Expandable Text Area)                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             STEP 4: MULTI-VARIANT, PRICING & STOCK MANAGEMENT          │
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
│ │ • 🛡️ IntriHub Logo Anti-Theft Watermark Toggle: [ ON / OFF ]        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ 👉 [ Save Variant ]  │  👉 [ 📄 Duplicate Variant Card ]              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 5: BADGES & PROMOTIONAL LABELS                   │
│ ⚡ Auto Discount Badge: [ ON / OFF ] (Calculates "% OFF" dynamically)  │
│ Select Tags: [ 🔥 Best Seller ] [ 🏬 Factory Price ] [ ⚡ Quick Dispatch]│
│ Custom Text Badge: [ Enter Custom Text ] Color: (•) 🔴 Red ( ) 🟢 Green│
│ 📌 [ Pin Badge Selection as Default ]                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 6: LOGISTICS & DELIVERY SETTINGS                 │
│ (•) ⚡ Instant Delivery (60-90 Mins) [DEFAULT]                          │
│ ( ) 🚛 Custom Heavy / Bulky Dispatch (Estimated ETA Window)             │
│ 📌 [ Pin Selected Delivery Option as Default ]                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 7: RETURN & REPLACEMENT POLICY                  │
│ Return Toggle: [ ON / OFF ]                                            │
│ If ON ──► Days, Refund/Replacement Type, Condition Notes              │
│ 📌 [ Pin Return Policy as Default ]                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 8: STICKY MOBILE BOTTOM BAR                   │
│ [ 💾 Save Draft ]         [ 👁️ Preview ]          [ 🚀 Publish Live ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Specifications & Database Schema (Prisma ORM)

```prisma
// 1. VENDOR / MERCHANT PROFILE
model Vendor {
  id           String    @id @default(uuid())
  businessName String
  ownerName    String
  phone        String    @unique
  products     Product[]
  orders       Order[]
  createdAt    DateTime  @default(now())
}

// 2. MASTER LOOKUP TABLES (For Dynamic + Add New Feature)
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

// 3. PARENT PRODUCT & VARIANT TABLES (Includes vendorId Foreign Key)
model Product {
  id               String           @id @default(uuid())
  vendorId         String           // 🔑 Mapped to Vendor Account
  vendor           Vendor           @relation(fields: [vendorId], references: [id])
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

// 4. ORDER & ORDER-ITEM MAPPING (Order Routing Engine)
model Order {
  id          String      @id @default(uuid())
  orderNumber String      @unique
  customerId  String
  vendorId    String      // 🔑 Direct routing to assigned Vendor
  vendor      Vendor      @relation(fields: [vendorId], references: [id])
  totalAmount Float
  status      OrderStatus @default(PENDING)
  createdAt   DateTime    @default(now())
}

// 5. USER PREFERENCES (For 📌 Pin Default Feature)
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

enum OrderStatus {
  PENDING
  ACCEPTED
  DISPATCHED
  DELIVERED
  CANCELLED
}
```

---

## 5. System Logic & Formulas

### A. Vendor Inventory Query Security (Node.js/Prisma)
```typescript
// Vendor App Query: Fetch items ONLY for the logged-in vendor
async function getVendorProducts(currentVendorId: string) {
  return await prisma.product.findMany({
    where: { vendorId: currentVendorId },
    include: { variants: true }
  });
}
```

### B. Order Routing Engine Rule
```typescript
// Customer Checkout: Create separate order items grouped by vendorId
async function processOrderCheckout(cartItems: CartItem[], customerId: string) {
  const groupedByVendor = groupBy(cartItems, item => item.vendorId);
  
  for (const [vendorId, items] of Object.entries(groupedByVendor)) {
    const newOrder = await prisma.order.create({
      data: {
        vendorId: vendorId,
        customerId: customerId,
        totalAmount: calculateTotal(items),
        status: "PENDING"
      }
    });
    
    // 🔔 Real-time Socket/Push Alert sent ONLY to that Vendor's App
    sendVendorOrderPushNotification(vendorId, newOrder.id);
  }
}
```

### C. 3-Tier Financial Margin Formulas
```typescript
// Margin calculations (strictly visible to Admin / CPO only)
const profitAmount = sellingPrice - costPrice;
const profitMarginPercent = sellingPrice > 0 ? ((profitAmount / sellingPrice) * 100).toFixed(1) : 0;
const customerDiscountPercent = mrp > 0 ? (((mrp - sellingPrice) / mrp) * 100).toFixed(0) : 0;
```

### D. IntriHub Anti-Theft Logo Watermark Engine
```typescript
// Server & Client Watermark compositing
// Automatically embeds official IntriHub logo with 65% opacity at bottom-right of product photos
// Toggle Control: [ ON / OFF ] available right inside the item upload & gallery manager.
const watermarkTargetWidth = Math.max(120, Math.min(480, Math.round(imageWidth * 0.28)));
```

---

## 6. CSS / Responsive Touch Target Rules
* **Mobile Responsive Container:** `w-full max-w-2xl mx-auto px-4 py-6`
* **Touch Target Standard:** All Dropdowns, Inputs, and Badges must have a minimum height of `h-12` (48px) for thumb-friendly usage.
* **Sticky Bottom Navigation:** `fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-3 shadow-2xl flex gap-2`
