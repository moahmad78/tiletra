# 📄 Product Requirement Document (PRD)

### 📌 Document Metadata
* **Product Name:** IntriHub Vendor & Admin App — Item Upload & Variant Module
* **Slogan Alignment:** "Every Material. Every Space."
* **Core Goal:** Vendors, CPO, aur Admins ke liye hardware, interior, plumbing, electrical, aur construction materials ko high speed aur flexibility ke saath live/draft karne ka seamless workflow.

---

## 1. Executive Summary & Objective
IntriHub e-commerce marketplace par complex material attributes (sizes, thickness, colors, volume units, bulk pricing) hote hain. Is module ka target vendor onboarding time ko fast karna, dynamic sub-categories & variants handle karna, dynamic master lookup expansion (+ Add New) allow karna, aur 📌 Pin Default Preference features provide karna hai.

---

## 2. Core User Stories & Roles

| Role | User Story |
| :--- | :--- |
| **Vendor / Merchant** | Main seller jo bulk inventory list karta hai aur fast repeating uploads chahta hai. |
| **CPO / Catalog Manager** | Main admin jo brand/category taxonomy clean rakhta hai aur custom master data approve/manage karta hai. |
| **Contractor / Customer** | End-buyer jo precise size, color, coverage, aur delivery ETA ke hisaab se correct product select karta hai. |

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
│ Product Title  │ Brand Name (+ Add New) │ Product Description          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   STEP 3: MULTI-VARIANT / SUB-ITEMS                    │
│ 👉 [ + Add Multi-Variant / Sub-Item ] Button                           │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Variant Modal / Form / Table:                                      │ │
│ │ • Size / Dimension (+ Add New)  │ Color / Shade (+ Add New)        │ │
│ │ • Selling Unit (+ Add New)      │ Selling Price & MRP              │ │
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
