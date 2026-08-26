# Intrihub Mobile App (Native Android & iOS)

Buyer-facing native mobile application for **Intrihub** (India's Multi-Vendor Interior & Construction Supply Marketplace), built with **React Native + Expo (Managed Workflow)** connected to the live Intrihub backend.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.76 + Expo SDK 52 (Managed Workflow) |
| **Navigation & Routing** | Expo Router (File-based navigation + Native Bottom Tabs) |
| **State Management** | Zustand (with AsyncStorage & SecureStore persistence) |
| **Data Fetching & Cache** | TanStack Query (React Query v5) |
| **Authentication** | Bearer JWT (SecureStore encrypted access & refresh tokens) |
| **Payments** | Razorpay React Native + Cash on Delivery (COD) |
| **Real-time Sync** | Socket.IO Client (Live order status tracking & room subscriptions) |
| **Push Notifications** | Expo Notifications + FCM (Order dispatch/delivery alerts) |
| **Design System** | Intrihub Brand System (Deep Navy `#052a51`, Warm Accent `#ff9900`) |

---

## 📁 Repository Structure

```
intrihub-mobile/
├── app/                        # Expo Router Screens
│   ├── (auth)/
│   │   └── login.tsx           # Mobile OTP & Phone/Email Sign In
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom Tab Navigator
│   │   ├── home.tsx            # Home Feed, Banners, Deals, Categories
│   │   ├── categories.tsx      # Dual-Rail Category Browser & Search
│   │   ├── cart.tsx            # Multi-Vendor Cart & Free Delivery Tracker
│   │   ├── orders.tsx          # Real-time Live Order History
│   │   └── profile.tsx         # Account, Saved Addresses, Helpline
│   ├── product/[id].tsx        # Product Details, Gallery, Sqft Calculator
│   ├── category/[slug].tsx     # Category Catalog & Subcategory Filters
│   ├── checkout.tsx            # Delivery Selection, Razorpay & COD
│   ├── order/[id].tsx          # Step-by-Step Delivery Tracking Timeline
│   ├── _layout.tsx             # Root Stack, Auth & Notification Providers
│   └── index.tsx               # Redirect to Home
├── src/
│   ├── api/                    # API Client with auto-refresh interceptors
│   │   ├── client.ts           # Axios instance & SecureStore token handlers
│   │   ├── auth.ts             # Sign in, verify OTP, profile APIs
│   │   ├── products.ts         # Categories, catalog search APIs
│   │   ├── cart.ts             # Cart sync APIs
│   │   ├── orders.ts           # Checkout, payment verification, order status
│   │   └── push.ts             # Push token registration API
│   ├── store/                  # Zustand Global Stores
│   │   ├── authStore.ts        # Auth state & address selection
│   │   ├── cartStore.ts        # Offline-first multi-vendor cart
│   │   └── socketStore.ts      # Live Socket.IO event broadcaster
│   ├── components/             # Reusable UI Components
│   │   ├── Header.tsx          # Brand navbar, search, location selector pill
│   │   ├── ProductCard.tsx     # Flipkart-style rich product card
│   │   ├── BannerCarousel.tsx  # Hero promotions slider
│   │   ├── CategoryGrid.tsx    # Category icon grid and chips
│   │   └── AddressModal.tsx    # Delivery address manager & creator
│   ├── constants/
│   │   ├── config.ts           # Environment-driven API & Gateway URLs
│   │   └── theme.ts            # Design system tokens, colors, radius, shadows
│   ├── hooks/
│   │   └── usePushNotifications.ts # Expo push token listener hook
│   └── types/                  # Shared TypeScript models (mirrors Prisma)
├── app.json                    # Expo configuration (package: com.intrihub.app)
├── eas.json                    # EAS Build & Play Store submit profiles
└── package.json
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
cd intrihub-mobile
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in `intrihub-mobile/`:
```env
EXPO_PUBLIC_API_URL=https://intrihub.com
EXPO_PUBLIC_SOCKET_URL=https://intrihub.com
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key
```

### 3. Run Development Server
```bash
# Start Expo development server
npm start

# Run directly on connected Android device / emulator
npm run android

# Run on iOS simulator
npm run ios
```

---

## 📦 Building for Google Play Store (EAS Build)

### 1. Install EAS CLI & Login
```bash
npm install -g eas-cli
eas login
```

### 2. Configure EAS Project
```bash
eas project:init
```

### 3. Generate Android APK for Internal Testing
```bash
eas build -p android --profile preview
```

### 4. Build Production Android App Bundle (.aab)
```bash
eas build -p android --profile production
```

### 5. Submit to Google Play Console
```bash
eas submit -p android --profile production
```
