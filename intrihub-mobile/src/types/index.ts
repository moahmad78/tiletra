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
  street: string;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
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

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  size?: string | null;
  finish?: string | null;
  thickness?: string | null;
  pricePerSqft?: number | null;
  pricePerBox?: number | null;
  sqftPerBox?: number | null;
  piecesPerBox?: number | null;
  stockBoxes: number;
  inStock: boolean;
  sku?: string | null;
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
  categoryId?: string | null;
  categorySlug: string;
  categoryName: string;
  subcategory?: string | null;
  unitOfSale: string;
  material: string;
  finish: string;
  size: string;
  pricePerSqft: number;
  mrp?: number | null;
  thickness: string;
  usage?: string;
  look?: string;
  coverageRate?: number | null;
  wastageFactor?: number | null;
  isTrending?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  inStock: boolean;
  images: string[];
  description: string;
  rating: number;
  reviewCount: number;
  specs?: Record<string, any> | null;
  vendorId?: string | null;
  vendor?: VendorMini | null;
  variants?: ProductVariant[];
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
