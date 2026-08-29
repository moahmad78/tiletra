export type UserRole = "vendor" | "admin" | "superadmin" | "customer";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar?: string | null;
  createdAt?: string;
}

export interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  category?: string | null;
  status: "pending" | "approved" | "rejected" | "suspended" | "active";
  logo?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ownerName?: string | null;
  businessAddress?: string | null;
  deliveryMethod?: string | null;
  commissionRate?: number | null;
  verified?: boolean;
  autoPublishEnabled?: boolean;
  city?: string | null;
  state?: string | null;
  productsCount?: number;
  ordersCount?: number;
  stats?: any;
  plainPassword?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  brand?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  pricePerSqft?: number;
  pricePerBox?: number;
  mrp?: number;
  unitOfSale?: string;
  description?: string;
  images: string[];
  stockBoxes: number;
  status: "active" | "paused" | "draft";
  featured?: boolean;
  material?: string;
  finish?: string;
  size?: string;
  thickness?: string;
  usage?: string;
  category?: string;
  price?: number;
  stock?: number;
  coveragePerBox?: number;
  approvalStatus?: string;
  rejectionReason?: string;
  vendorName?: string;
  vendorId?: string;
  vendor?: {
    id: string;
    businessName: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
  };
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export interface VendorOrderSplit {
  splitId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  subtotal: number;
  vendorPayoutAmount: number;
  fulfillmentStatus: "pending" | "confirmed" | "ready_for_pickup" | "dispatched" | "delivered" | "cancelled";
  paymentStatus: string;
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  deliveryAddress?: string;
  shippingAddress?: any;
  items?: any[];
}

export interface VendorDashboardData {
  vendor: {
    id: string;
    businessName: string;
    slug: string;
    category?: string;
    status: string;
    logo?: string;
    ownerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    businessAddress?: string;
    deliveryMethod?: string;
    autoPublishEnabled?: boolean;
  };
  stats: {
    totalRevenue: number;
    pendingPayout: number;
    completedPayouts: number;
    totalOrders: number;
    pendingOrders: number;
    dispatchedOrders: number;
    deliveredOrders: number;
    activeProductsCount: number;
    lowStockProductsCount: number;
  };
  recentOrders: VendorOrderSplit[];
}

export interface VendorEarningsData {
  vendor: {
    id: string;
    businessName: string;
    commissionRate: number;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  };
  summary: {
    totalRevenue: number;
    totalPayoutAmount: number;
    pendingPayoutAmount: number;
    completedPayoutAmount: number;
    totalPlatformFee: number;
  };
  payouts: Array<{
    id: string;
    orderId: string;
    subtotal: number;
    platformFee: number;
    vendorPayoutAmount: number;
    payoutStatus: "pending" | "processing" | "paid" | "failed";
    payoutReference?: string;
    payoutDate?: string;
    createdAt: string;
  }>;
}

export interface AdminDashboardData {
  stats: {
    totalGmv: number;
    totalRevenue: number;
    totalOrdersCount: number;
    totalUsersCount: number;
    totalVendorsCount: number;
    activeVendorsCount: number;
    totalProductsCount: number;
    pendingApprovalsCount: number;
    lowStockCount?: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    total: number;
    subtotal?: number;
    deliveryFee?: number;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    itemsCount: number;
    createdAt: string;
    formattedDate?: string;
    customer?: {
      name: string;
      phone: string;
      email?: string;
      avatar?: string | null;
      address: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number | null;
      longitude?: number | null;
    };
    items?: any[];
    vendors?: any[];
  }>;
  pendingVendors: Array<{
    id: string;
    businessName: string;
    contactEmail: string;
    contactPhone: string;
    category: string;
    createdAt: string;
  }>;
  lowStockProducts?: Array<{
    id: string;
    name: string;
    pricePerBox: number;
    pricePerSqft: number;
    stockBoxes: number;
    unitOfSale: string;
    images?: string[];
    status?: string;
    vendor?: {
      id: string;
      businessName: string;
      contactPhone?: string;
      contactEmail?: string;
    };
  }>;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  totalAmount?: number;
  amount?: number;
  subtotal: number;
  deliveryFee: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  estimatedDelivery?: string;
  deliveryCity?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  itemsCount: number;
  splitsCount: number;
  createdAt: string;
  items?: any[];
  vendorSplits?: any[];
}

export interface VendorApplication {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  address?: string;
  description?: string;
  aadharDocUrl?: string;
  panDocUrl?: string;
  shopPhotoUrl?: string;
  status: "new_inquiry" | "contacted" | "converted" | "rejected";
  internalNotes?: string;
  rejectionReason?: string;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  minOrderValue: number;
  maxDiscountCap?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  validFrom?: string;
  validTill?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferBanner {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  image: string;
  bgGradient?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminHeroContent {
  headline: string;
  subheadline: string;
  badge: string;
  ctaText: string;
  ctaHref: string;
  bgImage: string;
}

export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkHref?: string;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  gstNumber?: string | null;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  deliveryFeeEnabled: boolean;
  bikeDeliveryRate: number;
  fourWheelerDeliveryRate: number;
  weightThresholdKg: number;
  lowStockThreshold: number;
  codEnabled: boolean;
  codMaxLimit: number;
  codBlockedPincodes: string[];
  estimatedDelivery?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId?: string | null;
  author: string;
  city: string;
  rating: number;
  comment: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  photos: string[];
  verifiedPurchase: boolean;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: string;
    name: string;
    images?: string[];
    pricePerSqft?: number;
    mrp?: number;
    categoryName?: string;
  };
}
