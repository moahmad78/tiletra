# Product Requirement Document (PRD): IntriHub Quick-Commerce & Multi-Vendor Platform

## 1. Product Overview
- **Product Name**: IntriHub
- **Vision**: Local shop owners aur vendors (building materials, hardware, furniture, aur essentials) ko digital storefront dena aur fast local delivery ke zariye unki sales ko boost karna.
- **Core Value Proposition**: Customers ke liye hyper-local quick-commerce aur vendors ke liye easy multi-vendor digital management platform.

---

## 2. Target Audience & Personas
1. **Local Vendors / Dukanwale**: Jo apne local area mein building materials, hardware ya furniture bechte hain aur digital visibility aur sales badhana chahte hain.
2. **Customers / End Users**: Jo ghar baithe ya construction site ke liye quick delivery par hardware, building raw materials ya furniture order karna chahte hain.
3. **Platform Admins (IntriHub Team)**: Jo vendors, orders, deliveries aur platform operations ko manage karte hain.

---

## 3. Tech Stack & Architecture
- **Frontend / Web App**: Next.js (App Router), React.js, Tailwind CSS, Framer Motion, TypeScript, Lucide React (modern clean outline icons).
- **Mobile Apps (Expo / React Native)**:
  - **Customer App**: `intrihub-mobile` (`com.intrihub.app`)
  - **Vendor App**: `intrihub-business` (`com.intrihub.business`)
- **Backend & Database**: Node.js API routes, Prisma ORM, PostgreSQL.
- **Authentication**: NextAuth.js / Email OTP 2FA flow / Google OAuth with secure mobile bridge.
- **Hosting & Deployment**: Vercel (Next.js Edge/Serverless), GoDaddy DNS management.
- **Payments**: Razorpay Payment Gateway integration (Live & Test mode with GST compliance).

---

## 4. Key Modules & Functional Requirements

### A. Customer App & Website (intrihub.com)
- **Modern UI/UX**: Saare purane/generic AI star ya wand icons ko hata kar clean, modern outline icons (Lucide React / Heroicons jaise `LayoutGrid`, `Store`, `Truck`, `ShieldCheck`) use karna.
- **Multi-Vendor Catalog**: Users apne nazdeeki local vendors ki shops, products (building materials, hardware, etc.) browse kar sakein.
- **Quick-Commerce Checkout**: Fast cart management, address selection, aur Razorpay secure payment gateway integration.
- **Order Tracking**: Real-time order status tracking (`Placed`, `Packed`, `Out for Delivery`, `Delivered`).

### B. Vendor Portal (IntriHub Business)
- **Digital Storefront**: Vendors apne products, prices, aur stock ko easily add/update kar sakein.
- **Sales & Order Management**: Live dashboard jahan naye orders, fulfilled orders, aur total sales ka data dikhe.
- **Quick Onboarding**: Vendors ke liye simple KYC aur product listing forms.

### C. Admin Dashboard (IntriHub Console)
- **Vendor Approvals**: Naye dukan walon ki requests aur documents (MSME/GST) ko verify karke approve karna.
- **Analytics & Reports**: Platform par total orders, active vendors, aur delivery metrics track karna.
- **SEO & Indexing**: Next.js sitemap, robots.txt, aur Google Search Console optimization.

---

## 5. Non-Functional Requirements
- **Performance**: Page load time 2 seconds se kam hona chahiye. Responsive design jo mobile aur desktop dono par smooth chale.
- **Security**: Secure password policies (8-15 chars, uppercase, lowercase, numbers, allowed special characters), email OTP verification, aur secure database queries via Prisma.
- **Scalability**: High traffic aur multi-vendor data load ko handle karne ke liye cloud deployment (Vercel Edge & Serverless).

---

## 6. Future Roadmap / Phases
- **Phase 1 (Current)**: Closed testing on Google Play Console (14 days / 12+ testers), MSME registration, basic multi-vendor catalogue setup, aur UI modernization (modern icons replacement).
- **Phase 2**: Razorpay live activation (with approved GST), production release on Google Play Store, and regional vendor expansion.
- **Phase 3**: Advanced delivery logistics tracking, automated push notifications, and AI-driven product recommendations for construction materials.
