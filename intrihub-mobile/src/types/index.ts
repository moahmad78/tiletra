export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  phone: string;
  role: string;
  avatar?: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt?: string;
  addresses?: Address[];
  orderCount?: number;
}

export interface Address {
  id: string;
  userId?: string;
  label?: string; // Home | Work | Site | Other
  fullName?: string | null;
  phone?: string | null;
  houseNumber?: string | null;
  buildingName?: string | null;
  floor?: string | null;
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
  district?: string | null;
  state: string;
  country?: string;
  pincode: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  source?: "GPS" | "MAP_PIN" | "SEARCH" | "MANUAL" | string;
  deliveryInstructions?: string | null;
  formattedAddress?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image?: string;
  order?: number;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export interface PriceTier {
  id?: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  customerType?: string;
}

export interface ProductVariant {
  id: string;
  productId?: string;
  name?: string;
  sku?: string | null;
  size: string;
  finish: string;
  color?: string | null;
  colorHex?: string | null;
  swatchImage?: string | null;
  image?: string | null;
  unit?: string | null;
  attributeLabel?: string | null;
  attributeValue?: string | null;
  variantSpecs?: any;
  thickness?: string | null;
  weightKg?: number | null;
  pricePerSqft?: number | null;
  pricePerBox?: number | null;
  mrp?: number | null;
  sqftPerBox?: number | null;
  piecesPerBox?: number | null;
  stockBoxes: number;
  inStock: boolean;
  priceTiers?: PriceTier[];
}

export interface VendorMini {
  id: string;
  businessName: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  category?: string | null;
  contactPhone?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  modelNumber?: string | null;
  sku?: string | null;
  categoryId?: string | null;
  categorySlug: string;
  categoryName: string;
  subcategory?: string | null;
  unitOfSale: string;
  sellingUnit?: string;
  baseUnit?: string | null;
  conversionRatio?: number | null;
  piecesPerUnit?: number | null;
  lengthPerUnit?: number | null;
  weightKg?: number | null;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
  incrementQuantity?: number;
  allowDecimals?: boolean;
  decimalPrecision?: number;
  material: string;
  finish: string;
  size: string;
  pricePerSqft: number;
  pricePerBox?: number | null;
  mrp?: number | null;
  thickness: string;
  usage?: string;
  look?: string;
  grade?: string | null;
  series?: string | null;
  warranty?: string | null;
  hsnCode?: string | null;
  gstPercent?: number;
  status?: string;
  approvalStatus?: string;
  featuredImage?: string;
  coverageRate?: number | null;
  wastageFactor?: number | null;
  isTrending?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  inStock: boolean;
  images: string[];
  videos?: string[];
  description: string;
  shortDescription?: string | null;
  rating: number;
  reviewCount: number;
  specs?: Record<string, any> | null;
  vendorId?: string | null;
  vendor?: VendorMini | null;
  variants?: ProductVariant[];
  priceTiers?: PriceTier[];
  attributes?: { key: string; value: string }[];
  category?: Partial<Category> | null;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant | null;
  quantity: number; // in boxes / units
  calculatedPrice: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  boxQuantity: number;
  pricePerBox: number;
  totalPrice: number;
  image?: string | null;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    unitOfSale: string;
  } | null;
}

export interface Order {
  id: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: Address;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderStatus: string; // Processing | Confirmed | Dispatched | Out for Delivery | Delivered | Cancelled
  paymentMethod: string; // online | cod
  paymentStatus: string; // paid | pending | failed
  trackingNumber?: string | null;
  courierName?: string | null;
  estimatedDelivery?: string | null;

  // Immutable Delivery Snapshot
  deliveryName?: string | null;
  deliveryPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryHouseNumber?: string | null;
  deliveryBuildingName?: string | null;
  deliveryFloor?: string | null;
  deliveryStreet?: string | null;
  deliveryArea?: string | null;
  deliveryLandmark?: string | null;
  deliveryCity?: string | null;
  deliveryDistrict?: string | null;
  deliveryState?: string | null;
  deliveryCountry?: string | null;
  deliveryPostalCode?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryAccuracy?: number | null;
  deliveryLocationSource?: string | null;
  deliveryInstructions?: string | null;

  createdAt: string;
  items: OrderItem[];
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
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string; // "order_status" | "order" | "offer" | "promo" | "general" | "info"
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

// ----------------------------------------------------
// Vendor Panel Types
// ----------------------------------------------------
export interface VendorProfile {
  id: string;
  businessName: string;
  slug: string;
  category?: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  logo?: string | null;
  ownerName?: string | null;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: "self" | "platform";
}

export interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  pausedProducts: number;
  pendingApprovals: number;
  rejectedProducts: number;
  lowStockCount: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface VendorDashboardOrder {
  splitId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  subtotal: number;
  vendorPayoutAmount: number;
  fulfillmentStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export interface VendorDashboardData {
  vendor: VendorProfile;
  stats: VendorStats;
  recentOrders: VendorDashboardOrder[];
}

export interface VendorOrderSplit {
  id: string;
  orderId: string;
  vendorId: string;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayoutAmount: number;
  fulfillmentStatus: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  createdAt: string;
  updatedAt: string;
  parentOrder?: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    shippingAddress: Address;
    paymentStatus: string;
    paymentMethod: string;
    orderStatus: string;
    items: OrderItem[];
  } | null;
}

export interface VendorEarningsTrend {
  label: string;
  amount: number;
}

export interface VendorPayoutHistoryItem {
  id: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  periodStart: string;
  periodEnd: string;
  paymentReference: string;
  paidAt: string;
  orderCount: number;
}

export interface VendorEarningsData {
  totalEarnings: number;
  readyForPayoutAmount: number;
  inProgressEstimatedPayout: number;
  lifetimePaidOut: number;
  unsettledSplitsCount: number;
  inProgressCount: number;
  payoutHistory: VendorPayoutHistoryItem[];
  trend: VendorEarningsTrend[];
}


