# IntriHub — Shiprocket Logistics Automation Integration

## Overview
This document outlines the architecture, configuration, and workflows for the automated Shiprocket delivery integration in the IntriHub Next.js e-commerce platform.

IntriHub operates on a dual logistics architecture:
1. **Hyperlocal (<45 km / Bengaluru pincodes `560xxx`):** In-house 2-wheeler riders with automatic Borzo bike fallback (<20 kg) and Porter 3-wheelers / Tata Ace for medium and heavy/bulky orders (>20 kg).
2. **Pan-India & Regional Surface/Air Courier (Outside Bengaluru / Nationwide):** Automated through Shiprocket, providing dynamic carrier selection (Delhivery, Blue Dart, DTDC, Shadowfax, Ekart, etc.), live rate comparison, automated AWB generation, pickup scheduling, and real-time checkpoint synchronization.

---

## Architecture & Modules

### 1. Shiprocket API Authentication
- **Location:** `lib/delivery/shiprocket.ts` (`getShiprocketToken`)
- Authenticates using `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`.
- In-memory JWT token caching valid for 9 days (Shiprocket tokens expire after 10 days).
- Automatic retry and re-authentication upon encountering HTTP 401.

### 2. Courier Serviceability & Live Rate Calculator
- **Location:** `lib/delivery/shiprocket.ts` (`checkShiprocketServiceability`)
- **API Endpoint:** `GET /api/shipping/calculate` and `POST /api/shipping/calculate`
- Queries live rates based on pickup pincode, delivery pincode, weight (kg), cash-on-delivery (COD) status, declared order value, and package dimensions (length, breadth, height).
- Evaluates and ranks all available couriers by price, speed (ETD), and rating, returning the recommended courier partner.

### 3. Vendor Pickup Address Management
- **Location:** `lib/delivery/shiprocket.ts` (`registerVendorPickupLocation`)
- Automatically registers vendor warehouses as pickup locations on Shiprocket using standardized nicknames:
  - Format: `IH_<VENDOR_NAME_ALPHANUMERIC>_<VENDOR_ID_SUFFIX>`
  - Max 36 characters alphanumeric.
- Verifies existing pickup addresses before creating duplicates.

### 4. Automatic Shipment Creation
- **Location:** `lib/delivery/shiprocket.ts` (`createShiprocketOrderForSplit`)
- Splits each multi-vendor order into separate Shiprocket adhoc orders (`/orders/create/adhoc`).
- Maps items, weights, selling prices, dimensions, and customer billing/shipping details.
- Stores Shiprocket `order_id` and `shipment_id` in `VendorOrderSplit.thirdPartyRef`.

### 5. AWB Generation & Shipping Labels
- **Location:** `lib/delivery/shiprocket.ts` (`generateShiprocketAWB`, `getShiprocketLabelUrl`)
- Assigns the recommended courier (or selected courier ID) and returns the AWB code.
- Updates `VendorOrderSplit.trackingNumber` and `VendorOrderSplit.courierName`.
- Generates printable PDF shipping label URLs directly accessible from the Admin Deliveries dashboard.

### 6. Pickup Scheduling
- **Location:** `lib/delivery/shiprocket.ts` (`scheduleShiprocketPickup`)
- Dispatches courier pickup requests to the vendor warehouse for a specified date.
- Records courier pickup token and scheduled pickup timestamp.

### 7. Real-Time Tracking & Customer View
- **Location:** `lib/delivery/shiprocket.ts` (`trackShiprocketShipment`)
- **API Endpoint:** `GET /api/shipping/track?awb=...` or `?splitId=...`
- Customer Modal: `components/orders/OrderTrackingModal.tsx` provides a direct 1-click link to live Shiprocket tracking.
- Admin Deliveries: Interactive timeline modal displaying all hub scans, timestamps, activities, and current courier location.

### 8. Webhook Integration
- **Endpoint:** `POST /api/webhooks/shiprocket`
- **Security:** Verified via `SHIPROCKET_WEBHOOK_TOKEN` (`x-api-key` header or `?token=` parameter).
- **Status Mapping:**
  - `AWB_ASSIGNED` / `LABEL_GENERATED` / `PICKUP_SCHEDULED` $\rightarrow$ `ready_for_pickup`
  - `PICKED_UP` / `PICKUP_DONE` $\rightarrow$ `picked_up`
  - `IN_TRANSIT` / `SHIPPED` $\rightarrow$ `dispatched`
  - `OUT_FOR_DELIVERY` $\rightarrow$ `out_for_delivery`
  - `DELIVERED` $\rightarrow$ `delivered` (computes vendor commission, payout, and marks payment collected)
  - `CANCELED` $\rightarrow$ `cancelled`
  - `RTO` $\rightarrow$ `returned`
- Broadcasts real-time updates via Socket.IO to admin and customer rooms.

### 9. Cancellation & Return Management
- **Location:** `lib/delivery/shiprocket.ts` (`cancelShiprocketShipment`)
- Allows one-click cancellation of pending shipments prior to courier pickup.
- Updates split status to `cancelled` with audit records.

### 10. Admin Delivery Management Dashboard
- **Location:** `app/admin/deliveries/page.tsx`
- Filter deliveries by logistics provider (Shiprocket, In-house, Porter, Borzo).
- One-click buttons:
  - **Book Shiprocket:** Live courier rate comparison dialog to select and book the best courier partner.
  - **Track Live:** Inspect real-time checkpoint timeline and courier transit hubs.
  - **Label:** Open printable shipping label PDF.
  - **Sync:** Force-synchronize delivery status from Shiprocket.
  - **Request Pickup:** Trigger courier pickup dispatch.

---

## Environment Variables Configuration

Add the following credentials to your `.env` file (or host environment manager):

```bash
# ------------------------------------------------------------------------------
# SHIPROCKET LOGISTICS CONFIGURATION
# ------------------------------------------------------------------------------
SHIPROCKET_EMAIL="logistics@intrihub.com"
SHIPROCKET_PASSWORD="your-secure-shiprocket-password"
SHIPROCKET_BASE_URL="https://apiv2.shiprocket.in/v2/console"
SHIPROCKET_WEBHOOK_TOKEN="your-random-webhook-secret-token"
```

---

## Shiprocket Webhook Setup Instructions

1. Log into your [Shiprocket Console](https://app.shiprocket.in/).
2. Navigate to **Settings** $\rightarrow$ **API** $\rightarrow$ **Webhooks**.
3. Click **Add Webhook**.
4. Enter Webhook Details:
   - **Event:** Select all shipment events (`AWB Assigned`, `Pickup Done`, `In Transit`, `Out for Delivery`, `Delivered`, `Cancelled`, `RTO`).
   - **URL:** `https://www.intrihub.com/api/webhooks/shiprocket?token=YOUR_SHIPROCKET_WEBHOOK_TOKEN`
   - **HTTP Method:** `POST`
5. Save the webhook and test connection.
