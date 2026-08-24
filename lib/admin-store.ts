"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products as initialProducts, type Product, type ProductVariant } from "@/lib/data/products";
import { categories as initialCategories, type Category } from "@/lib/data/categories";

export type OrderStatus =
  | "Processing"
  | "Confirmed"
  | "Dispatched"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type AdminOrderItem = {
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  boxQuantity: number;
  pricePerBox: number;
  totalPrice: number;
  image: string;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    state: string;
  };
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  paymentMethod: "UPI" | "Card" | "NetBanking" | "COD" | "Online";
  paymentCollected?: boolean;
  paymentId?: string;
  orderStatus: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  courierName?: string;
  trackingNumber?: string;
  internalNotes?: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  status: "Active" | "Blocked";
  notes?: string;
};

export type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  author: string;
  city: string;
  rating: number;
  comment: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

export type AdminCoupon = {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number; // e.g. 10 (%) or 500 (INR)
  minOrderValue: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validTill: string;
  isActive: boolean;
};

export type AdminOfferBanner = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  bgGradient: string;
  isActive: boolean;
};

export type AdminHeroContent = {
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  bgImage: string;
};

export type AdminSettings = {
  storeName: string;
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  deliveryFeeEnabled: boolean;
  autoAcceptOrders: boolean;
  lowStockThreshold: number;
  codEnabled: boolean;
  codMaxLimit: number;
  codBlockedPincodes: string[];
};

// Initial Sample Orders
const SEED_ORDERS: AdminOrder[] = [
  {
    id: "TL-849201",
    customerName: "Rajesh Sharma",
    customerPhone: "+91 98450 12345",
    customerEmail: "rajesh.sharma@gmail.com",
    shippingAddress: {
      line1: "Flat 402, Prestige Lakeside",
      line2: "Varthur Main Road, Whitefield",
      city: "Bangalore",
      pincode: "560066",
      state: "Karnataka",
    },
    items: [
      {
        productId: "prod-001",
        productName: "Calacatta Marble Effect",
        variantId: "v-001-a",
        variantDetails: "800x800mm · Polished · White",
        boxQuantity: 4,
        pricePerBox: 3200,
        totalPrice: 12800,
        image: "/placeholders/product.svg",
      },
    ],
    subtotal: 12800,
    deliveryFee: 999,
    discount: 0,
    total: 13799,
    paymentStatus: "Paid",
    paymentMethod: "UPI",
    paymentId: "pay_rzp_984729104",
    orderStatus: "Dispatched",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    estimatedDelivery: "August 18, 2026",
    courierName: "Delhivery Freight",
    trackingNumber: "DEL-TL-849201",
    internalNotes: "Customer requested morning delivery between 9 AM - 12 PM.",
  },
  {
    id: "TL-721904",
    customerName: "Pooja Hegde",
    customerPhone: "+91 97412 88990",
    customerEmail: "pooja.hegde@yahoo.com",
    shippingAddress: {
      line1: "#12, 4th Cross, Gokulam 3rd Stage",
      city: "Mysore",
      pincode: "570002",
      state: "Karnataka",
    },
    items: [
      {
        productId: "prod-004",
        productName: "Arctic White Subway",
        variantId: "v-004-a",
        variantDetails: "300x150mm · Glossy · White",
        boxQuantity: 8,
        pricePerBox: 950,
        totalPrice: 7600,
        image: "/placeholders/product.svg",
      },
      {
        productId: "prod-002",
        productName: "Concrete Grey Industrial",
        variantId: "v-002-a",
        variantDetails: "600x600mm · Matte · Grey",
        boxQuantity: 6,
        pricePerBox: 1800,
        totalPrice: 10800,
        image: "/placeholders/product.svg",
      },
    ],
    subtotal: 18400,
    deliveryFee: 0,
    discount: 0,
    total: 18400,
    paymentStatus: "Paid",
    paymentMethod: "Card",
    paymentId: "pay_rzp_654129881",
    orderStatus: "Delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    estimatedDelivery: "Delivered on Aug 01, 2026",
    courierName: "SafeXpress Logistics",
    trackingNumber: "SX-9948271",
  },
  {
    id: "TL-993812",
    customerName: "Anil Murthy",
    customerPhone: "+91 99801 44552",
    customerEmail: "anil.murthy@outlook.com",
    shippingAddress: {
      line1: "Villa 18, Palm Meadows",
      city: "Bangalore",
      pincode: "560066",
      state: "Karnataka",
    },
    items: [
      {
        productId: "prod-006",
        productName: "Onyx Black Marble",
        variantId: "v-006-a",
        variantDetails: "600x600mm · Matte · Black",
        boxQuantity: 5,
        pricePerBox: 3800,
        totalPrice: 19000,
        image: "/placeholders/product.svg",
      },
    ],
    subtotal: 19000,
    deliveryFee: 0,
    discount: 1000,
    total: 18000,
    paymentStatus: "Paid",
    paymentMethod: "UPI",
    paymentId: "pay_rzp_448102948",
    orderStatus: "Processing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    estimatedDelivery: "August 19, 2026",
    internalNotes: "Tile batch check passed in warehouse.",
  },
];

// Initial Customers
const SEED_CUSTOMERS: AdminCustomer[] = [
  {
    id: "cust-001",
    name: "Rajesh Sharma",
    phone: "+91 98450 12345",
    email: "rajesh.sharma@gmail.com",
    city: "Bangalore",
    totalOrders: 2,
    totalSpent: 32200,
    joinedDate: "June 2026",
    status: "Active",
  },
  {
    id: "cust-002",
    name: "Pooja Hegde",
    phone: "+91 97412 88990",
    email: "pooja.hegde@yahoo.com",
    city: "Mysore",
    totalOrders: 1,
    totalSpent: 18400,
    joinedDate: "July 2026",
    status: "Active",
  },
  {
    id: "cust-003",
    name: "Anil Murthy",
    phone: "+91 99801 44552",
    email: "anil.murthy@outlook.com",
    city: "Bangalore",
    totalOrders: 1,
    totalSpent: 18000,
    joinedDate: "August 2026",
    status: "Active",
  },
  {
    id: "cust-004",
    name: "Kavita Reddy",
    phone: "+91 98860 99881",
    email: "kavita.reddy@gmail.com",
    city: "Hyderabad",
    totalOrders: 3,
    totalSpent: 48600,
    joinedDate: "May 2026",
    status: "Active",
  },
];

// Initial Reviews
const SEED_REVIEWS: AdminReview[] = [
  {
    id: "rev-001",
    productId: "prod-001",
    productName: "Calacatta Marble Effect",
    author: "Rajesh Sharma",
    city: "Bangalore",
    rating: 5,
    comment: "Superb quality tiles! The finish is extremely premium and zero breakages during delivery. Highly recommend Intrihub.",
    date: "2 weeks ago",
    status: "approved",
  },
  {
    id: "rev-002",
    productId: "prod-004",
    productName: "Arctic White Subway",
    author: "Pooja Hegde",
    city: "Mysore",
    rating: 5,
    comment: "The coverage calculator gave the exact boxes needed. We had just half a box spare after laying. Perfect fitting!",
    date: "1 month ago",
    status: "approved",
  },
  {
    id: "rev-003",
    productId: "prod-006",
    productName: "Onyx Black Marble",
    author: "Anil Murthy",
    city: "Bangalore",
    rating: 4,
    comment: "Looks exactly like real marble. Delivered in 4 days in neat sturdy packaging. Satisfied with the purchase.",
    date: "1 month ago",
    status: "approved",
  },
  {
    id: "rev-004",
    productId: "prod-002",
    productName: "Concrete Grey Industrial",
    author: "Vikram Malhotra",
    city: "Chennai",
    rating: 5,
    comment: "Gives a great modern industrial loft aesthetic. Texture prevents slipping even when wet.",
    date: "3 days ago",
    status: "pending",
  },
];

// Initial Coupons
const SEED_COUPONS: AdminCoupon[] = [
  {
    id: "cp-001",
    code: "INTRI10",
    discountType: "percentage",
    value: 10,
    minOrderValue: 10000,
    maxDiscountCap: 2500,
    usageLimit: 100,
    usedCount: 42,
    validFrom: "2026-01-01",
    validTill: "2026-12-31",
    isActive: true,
  },
  {
    id: "cp-002",
    code: "FLAT1000",
    discountType: "flat",
    value: 1000,
    minOrderValue: 15000,
    usageLimit: 50,
    usedCount: 18,
    validFrom: "2026-06-01",
    validTill: "2026-09-30",
    isActive: true,
  },
  {
    id: "cp-003",
    code: "SAMPLEFREE",
    discountType: "flat",
    value: 299,
    minOrderValue: 0,
    usageLimit: 500,
    usedCount: 114,
    validFrom: "2026-01-01",
    validTill: "2026-12-31",
    isActive: true,
  },
];

// Initial Offer Banners
const SEED_OFFER_BANNERS: AdminOfferBanner[] = [
  {
    id: "slide-1",
    badge: "Special Offer",
    title: "Flat 20% Off Vitrified Tiles",
    subtitle: "Premium Italian marble & concrete looks",
    cta: "Shop Now",
    href: "/shop/floor-tiles",
    image: "/placeholders/product.svg",
    bgGradient: "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
    isActive: true,
  },
  {
    id: "slide-2",
    badge: "Zero Shipping Cost",
    title: "Free Delivery Above ₹15,000",
    subtitle: "Safe box packing & direct doorstep transit",
    cta: "Explore Tiles",
    href: "/shop",
    image: "/placeholders/product.svg",
    bgGradient: "from-[#0c3966]/95 via-[#052a51]/85 to-transparent",
    isActive: true,
  },
  {
    id: "slide-3",
    badge: "Confidence First",
    title: "Order a Tile Sample Box",
    subtitle: "Check finish & light in your home before buying",
    cta: "Get Samples",
    href: "/shop",
    image: "/placeholders/product.svg",
    bgGradient: "from-[#1a1c29]/95 via-[#052a51]/85 to-transparent",
    isActive: true,
  },
];

type AdminStore = {
  // State
  products: Product[];
  categories: Category[];
  orders: AdminOrder[];
  customers: AdminCustomer[];
  reviews: AdminReview[];
  coupons: AdminCoupon[];
  offerBanners: AdminOfferBanner[];
  heroContent: AdminHeroContent;
  settings: AdminSettings;

  // Product Actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  importProducts: (products: Product[]) => void;

  // Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;

  // Order Actions
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderTracking: (orderId: string, courier: string, tracking: string) => void;
  updateOrderNotes: (orderId: string, notes: string) => void;
  markPaymentCollected: (orderId: string) => void;
  addOrder: (order: AdminOrder) => void;

  // Review Actions
  updateReviewStatus: (id: string, status: "approved" | "rejected") => void;
  deleteReview: (id: string) => void;

  // Coupon Actions
  addCoupon: (coupon: AdminCoupon) => void;
  updateCoupon: (id: string, updates: Partial<AdminCoupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;

  // Content Actions
  updateHeroContent: (updates: Partial<AdminHeroContent>) => void;
  addOfferBanner: (banner: AdminOfferBanner) => void;
  updateOfferBanner: (id: string, updates: Partial<AdminOfferBanner>) => void;
  deleteOfferBanner: (id: string) => void;

  // Settings Actions
  updateSettings: (updates: Partial<AdminSettings>) => void;
  resetToDefaults: () => void;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      categories: initialCategories,
      orders: SEED_ORDERS,
      customers: SEED_CUSTOMERS,
      reviews: SEED_REVIEWS,
      coupons: SEED_COUPONS,
      offerBanners: SEED_OFFER_BANNERS,
      heroContent: {
        badge: "Free delivery above ₹15,000",
        headline: "Quality Tiles. Strong Spaces.",
        subheadline: "Discover 200+ premium floor, wall, bathroom & kitchen tiles. Browse by room, choose your size & finish, and order directly to your door.",
        ctaText: "Shop All Tiles",
        ctaHref: "/shop",
        secondaryCtaText: "Explore Catalog",
        secondaryCtaHref: "/shop",
        bgImage: "/placeholders/product.svg",
      },
      settings: {
        storeName: "Intrihub",
        contactPhone: "+91 78709 35277",
        whatsappNumber: "+91 78709 35277",
        email: "info@intrihub.com",
        address: "41, 10th A Cross Rd, Janapriya Layout, Classic Paradise Layout, Begur, Bengaluru, Karnataka 560114",
        freeDeliveryThreshold: 15000,
        standardDeliveryFee: 999,
        deliveryFeeEnabled: true,
        autoAcceptOrders: true,
        lowStockThreshold: 10,
        codEnabled: true,
        codMaxLimit: 25000,
        codBlockedPincodes: ["560099"],
      },

      // Products
      addProduct: (prod) => set((s) => ({ products: [prod, ...s.products] })),
      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      duplicateProduct: (id) => {
        const prod = get().products.find((p) => p.id === id);
        if (!prod) return;
        const newId = `prod-${Date.now().toString().slice(-4)}`;
        const duplicated: Product = {
          ...prod,
          id: newId,
          name: `${prod.name} (Copy)`,
          slug: `${prod.slug}-copy-${Date.now().toString().slice(-3)}`,
          variants: prod.variants.map((v, i) => ({
            ...v,
            id: `v-${newId}-${i}`,
          })),
        };
        set((s) => ({ products: [duplicated, ...s.products] }));
      },
      bulkDeleteProducts: (ids) =>
        set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),
      importProducts: (newProds) =>
        set((s) => ({ products: [...newProds, ...s.products] })),

      // Categories
      addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCategory: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        if (!cat) return false;
        // Check if products exist in category
        const hasProducts = get().products.some((p) => p.categorySlug === cat.slug);
        if (hasProducts) {
          return false;
        }
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
        return true;
      },

      // Orders
      updateOrderStatus: (orderId, orderStatus) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, orderStatus } : o)),
        })),
      updateOrderTracking: (orderId, courierName, trackingNumber) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, courierName, trackingNumber } : o
          ),
        })),
      updateOrderNotes: (orderId, internalNotes) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, internalNotes } : o)),
        })),
      markPaymentCollected: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, paymentStatus: "Paid", paymentCollected: true } : o
          ),
        })),
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

      // Reviews
      updateReviewStatus: (id, status) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
        })),
      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      // Coupons
      addCoupon: (coupon) => set((s) => ({ coupons: [coupon, ...s.coupons] })),
      updateCoupon: (id, updates) =>
        set((s) => ({
          coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCoupon: (id) =>
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
      toggleCoupon: (id) =>
        set((s) => ({
          coupons: s.coupons.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        })),

      // Content
      updateHeroContent: (updates) =>
        set((s) => ({ heroContent: { ...s.heroContent, ...updates } })),
      addOfferBanner: (banner) =>
        set((s) => ({ offerBanners: [...s.offerBanners, banner] })),
      updateOfferBanner: (id, updates) =>
        set((s) => ({
          offerBanners: s.offerBanners.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      deleteOfferBanner: (id) =>
        set((s) => ({ offerBanners: s.offerBanners.filter((b) => b.id !== id) })),

      // Settings
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      resetToDefaults: () =>
        set({
          products: initialProducts,
          categories: initialCategories,
          orders: SEED_ORDERS,
          customers: SEED_CUSTOMERS,
          reviews: SEED_REVIEWS,
          coupons: SEED_COUPONS,
          offerBanners: SEED_OFFER_BANNERS,
        }),
    }),
    {
      name: "intrihub-admin-store",
    }
  )
);
