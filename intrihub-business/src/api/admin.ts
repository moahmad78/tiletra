import { apiClient } from "./client";
import {
  AdminDashboardData,
  Vendor,
  Product,
  AdminOrder,
  User,
} from "../types";

// 1. Admin Dashboard
export async function fetchAdminDashboard(): Promise<{
  success: boolean;
  stats?: AdminDashboardData["stats"];
  recentOrders?: AdminDashboardData["recentOrders"];
  pendingVendors?: AdminDashboardData["pendingVendors"];
  lowStockProducts?: AdminDashboardData["lowStockProducts"];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/dashboard");
  return res.data;
}

// 2. Admin Vendors
export async function fetchAdminVendors(params?: {
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  vendors?: Vendor[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/vendors", { params });
  return res.data;
}

export async function fetchAdminVendorDetail(id: string): Promise<{
  success: boolean;
  vendor?: any;
  stats?: any;
  error?: string;
}> {
  const res = await apiClient.get(`/api/mobile/admin/vendors/${id}`);
  return res.data;
}

export async function updateAdminVendor(
  id: string,
  data: {
    businessName?: string;
    ownerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    category?: string;
    businessAddress?: string;
    gstNumber?: string;
    status?: string;
    commissionRate?: number;
    verified?: boolean;
    deliveryMethod?: string;
    autoPublishEnabled?: boolean;
    ownerId?: string;
  }
): Promise<{
  success: boolean;
  vendor?: Vendor;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/vendors/${id}`, data);
  return res.data;
}

export async function deleteAdminVendor(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/vendors/${id}`);
  return res.data;
}

// 3. Admin Products
export async function fetchAdminProducts(params?: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  products?: Product[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/products", { params });
  return res.data;
}

export async function createAdminProduct(data: {
  name: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  pricePerSqft?: number;
  pricePerBox?: number;
  mrp?: number;
  stockBoxes?: number;
  unitOfSale?: string;
  description?: string;
  images?: string[];
  material?: string;
  finish?: string;
  size?: string;
  thickness?: string;
  variants?: any[];
  vendorId?: string | null;
  status?: string;
}): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/products", data);
  return res.data;
}

export async function updateAdminProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    featured?: boolean;
    pricePerBox?: number;
    pricePerSqft?: number;
    mrp?: number;
    stockBoxes?: number;
    unitOfSale?: string;
    categorySlug?: string;
    categoryId?: string;
    images?: string[];
    material?: string;
    finish?: string;
    size?: string;
    thickness?: string;
    specifications?: any;
  }
): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/products/${id}`, data);
  return res.data;
}

export async function deleteAdminProduct(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/products/${id}`);
  return res.data;
}

// 4. Admin Orders
export async function fetchAdminOrders(params?: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  orders?: AdminOrder[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/orders", { params });
  return res.data;
}

export async function updateAdminOrder(
  id: string,
  data: {
    orderStatus?: string;
    paymentStatus?: string;
    estimatedDelivery?: string;
  }
): Promise<{
  success: boolean;
  order?: AdminOrder;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/orders/${id}`, data);
  return res.data;
}

// 5. Admin Users
export async function fetchAdminUsers(params?: {
  search?: string;
  role?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  users?: User[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/users", { params });
  return res.data;
}

export async function updateAdminUserRole(
  userId: string,
  role: string
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch("/api/mobile/admin/users", { userId, role });
  return res.data;
}

// 6. Admin Vendor Applications (Path A Public Onboardings)
export async function fetchAdminVendorApplications(params?: {
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  applications?: any[];
  total?: number;
  pendingCount?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/vendor-applications", { params });
  return res.data;
}

export async function fetchAdminVendorApplicationDetail(id: string): Promise<{
  success: boolean;
  application?: any;
  error?: string;
}> {
  const res = await apiClient.get(`/api/mobile/admin/vendor-applications/${id}`);
  return res.data;
}

export async function approveAdminVendorApplication(
  id: string,
  data?: {
    commissionRate?: number;
    customPassword?: string;
    gstNumber?: string;
  }
): Promise<{
  success: boolean;
  vendor?: any;
  credentials?: any;
  plainPassword?: string;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/vendor-applications/${id}`, {
    action: "approve",
    ...data,
  });
  return res.data;
}

export async function rejectAdminVendorApplication(
  id: string,
  rejectionReason: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/vendor-applications/${id}`, {
    action: "reject",
    rejectionReason,
  });
  return res.data;
}

// 7. Admin Product Approvals (Moderation Queue)
export async function fetchAdminProductApprovals(params?: {
  search?: string;
}): Promise<{
  success: boolean;
  products?: Product[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/product-approvals", { params });
  return res.data;
}

export async function approveAdminProductPending(id: string): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/product-approvals/${id}`, {
    action: "approve",
  });
  return res.data;
}

export async function rejectAdminProductPending(
  id: string,
  reason: string
): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/product-approvals/${id}`, {
    action: "reject",
    reason,
  });
  return res.data;
}

// 8. Admin Platform Logistics & Deliveries
export async function fetchAdminDeliveries(params?: {
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  deliveries?: any[];
  splits?: any[];
  total?: number;
  counts?: {
    all: number;
    ready: number;
    transit: number;
    delivered: number;
    codPending: number;
  };
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/deliveries", { params });
  return res.data;
}

export async function updateAdminDelivery(
  id: string,
  data: {
    fulfillmentStatus?: string;
    trackingNumber?: string;
    courierName?: string;
    paymentCollected?: boolean;
  }
): Promise<{
  success: boolean;
  split?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/deliveries/${id}`, data);
  return res.data;
}

export async function assignAdminCourier(
  id: string,
  data: {
    courierName: string;
    courierPhone?: string;
    trackingNumber?: string;
    status?: string;
  }
): Promise<{
  success: boolean;
  split?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/deliveries/${id}/assign-courier`, data);
  return res.data;
}

export const assignAdminDeliveryCourier = assignAdminCourier;

export async function updateAdminDeliveryTracking(
  id: string,
  data: {
    trackingNumber: string;
    courierName?: string;
    status?: string;
  }
): Promise<{
  success: boolean;
  split?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/deliveries/${id}/tracking`, data);
  return res.data;
}

export async function confirmAdminDeliveryCod(
  id: string,
  data?: {
    paymentCollected?: boolean;
    status?: string;
  }
): Promise<{
  success: boolean;
  split?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/deliveries/${id}/cod-confirm`, data || { paymentCollected: true });
  return res.data;
}

// 9. Admin Coupons & Discounts
export async function fetchAdminCoupons(params?: {
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  coupons?: any[];
  total?: number;
  counts?: {
    all: number;
    active: number;
    expired: number;
    disabled: number;
  };
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/coupons", { params });
  return res.data;
}

export async function createAdminCoupon(data: {
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  minOrderValue?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  validTill?: string;
}): Promise<{
  success: boolean;
  coupon?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/coupons", data);
  return res.data;
}

export async function updateAdminCoupon(
  id: string,
  data: {
    code?: string;
    discountType?: "percentage" | "flat";
    value?: number;
    minOrderValue?: number;
    maxDiscountCap?: number;
    usageLimit?: number;
    validTill?: string;
    isActive?: boolean;
  }
): Promise<{
  success: boolean;
  coupon?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/coupons/${id}`, data);
  return res.data;
}

export async function deleteAdminCoupon(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/coupons/${id}`);
  return res.data;
}

// 10. Admin Homepage CMS & Banners
export async function fetchAdminBanners(): Promise<{
  success: boolean;
  banners?: any[];
  total?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/content/banners");
  return res.data;
}

export async function createAdminBanner(data: {
  title: string;
  subtitle?: string;
  badge?: string;
  cta?: string;
  href?: string;
  image: string;
  bgGradient?: string;
}): Promise<{
  success: boolean;
  banner?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/content/banners", data);
  return res.data;
}

export async function updateAdminBanner(
  id: string,
  data: {
    title?: string;
    subtitle?: string;
    badge?: string;
    cta?: string;
    href?: string;
    image?: string;
    bgGradient?: string;
    order?: number;
    isActive?: boolean;
  }
): Promise<{
  success: boolean;
  banner?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/content/banners/${id}`, data);
  return res.data;
}

export async function deleteAdminBanner(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/content/banners/${id}`);
  return res.data;
}

export const fetchAdminContentBanners = fetchAdminBanners;
export const createAdminContentBanner = createAdminBanner;
export const deleteAdminContentBanner = deleteAdminBanner;

export async function fetchAdminHero(): Promise<{
  success: boolean;
  hero?: any;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/content/hero");
  return res.data;
}

export async function updateAdminHero(data: any): Promise<{
  success: boolean;
  hero?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch("/api/mobile/admin/content/hero", data);
  return res.data;
}

export async function fetchAdminAnnouncements(): Promise<{
  success: boolean;
  announcements?: any;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/content/announcements");
  return res.data;
}

export async function updateAdminAnnouncements(data: any): Promise<{
  success: boolean;
  announcements?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/content/announcements", data);
  return res.data;
}

// 11. Admin Global Store Settings & Rules
export async function fetchAdminStoreSettings(): Promise<{
  success: boolean;
  settings?: any;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/settings");
  return res.data;
}

export async function updateAdminStoreSettings(data: any): Promise<{
  success: boolean;
  settings?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch("/api/mobile/admin/settings", data);
  return res.data;
}

// 12. Admin Reviews Moderation
export async function fetchAdminReviews(params?: {
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  reviews?: any[];
  total?: number;
  counts?: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/reviews", { params });
  return res.data;
}

export async function updateAdminReviewStatus(
  id: string,
  status: "approved" | "rejected" | "pending"
): Promise<{
  success: boolean;
  review?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/reviews/${id}`, { status });
  return res.data;
}

export async function approveAdminReview(id: string) {
  return updateAdminReviewStatus(id, "approved");
}

export async function rejectAdminReview(id: string) {
  return updateAdminReviewStatus(id, "rejected");
}

export async function deleteAdminReview(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/reviews/${id}`);
  return res.data;
}

// 13. Admin Bulk Product CSV Import
export async function fetchAdminBulkTemplate(category?: string): Promise<{
  success: boolean;
  template?: {
    name: string;
    filename: string;
    csvContent: string;
  };
  availableCategories?: { key: string; name: string; filename: string }[];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/products/bulk/template", {
    params: { category },
  });
  return res.data;
}

export async function validateAdminBulkCSV(csvText: string): Promise<{
  success: boolean;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  errors?: string[];
  preview?: any[];
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/products/bulk/validate", {
    csvText,
  });
  return res.data;
}

export async function commitAdminBulkProducts(productsOrCsv: any): Promise<{
  success: boolean;
  count?: number;
  importedCount?: number;
  message?: string;
  products?: any[];
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/products/bulk/commit", {
    products: typeof productsOrCsv === "string" ? productsOrCsv : productsOrCsv,
    csvText: typeof productsOrCsv === "string" ? productsOrCsv : undefined,
  });
  return res.data;
}

// 14. Manual Vendor Creation
export async function createAdminVendorManual(data: {
  businessName: string;
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  category?: string;
  businessAddress?: string;
  gstNumber?: string;
  description?: string;
  commissionRate?: number;
  customPassword?: string;
}): Promise<{
  success: boolean;
  vendor?: any;
  plainPassword?: string;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/vendors", data);
  return res.data;
}

// 15. Admin Categories Management
export async function fetchAdminCategories(params?: { search?: string }): Promise<{
  success: boolean;
  categories?: any[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/categories", { params });
  return res.data;
}

export async function createAdminCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  calculatorType?: string;
}): Promise<{
  success: boolean;
  category?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/categories", data);
  return res.data;
}

export async function updateAdminCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
    parentId?: string | null;
    calculatorType?: string;
  }
): Promise<{
  success: boolean;
  category?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/admin/categories/${id}`, data);
  return res.data;
}

export async function deleteAdminCategory(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/categories/${id}`);
  return res.data;
}

// 16. Notify Vendor Restock
export async function notifyAdminVendorRestock(data: {
  vendorId: string;
  productId?: string;
  productName?: string;
  stockBoxes?: number;
  message?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/notify-vendor", data);
  return res.data;
}

// 17. Admin Orders Delete
export async function deleteAdminOrder(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/admin/orders/${id}`);
  return res.data;
}

// 18. Admin Trash & Recycle Bin (Mistouch Protection with 3-Day Auto-Purge)
export async function fetchAdminTrash(): Promise<{
  success: boolean;
  products?: any[];
  orders?: any[];
  counts?: {
    products: number;
    orders: number;
    total: number;
  };
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/trash");
  return res.data;
}

export async function restoreAdminTrashItem(
  type: "product" | "order",
  id: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/trash/restore", { type, id });
  return res.data;
}

export async function deleteAdminTrashItemPermanently(
  type: "product" | "order",
  id: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete("/api/mobile/admin/trash", {
    params: { type, id },
  });
  return res.data;
}

// 19. Admin Revenue & Vendor Breakdown Analytics
export async function fetchAdminRevenueAnalytics(period: string = "today"): Promise<{
  success: boolean;
  period?: string;
  summary?: {
    platformTotalGross: number;
    platformTodayGross: number;
    platformTotalCommission: number;
    platformTodayCommission: number;
    activeVendorsCount: number;
    totalOrdersCount: number;
  };
  vendors?: any[];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/revenue", {
    params: { period },
  });
  return res.data;
}

// 20. Admin Vendor Settlements & Commission Engine
export async function fetchAdminSettlements(): Promise<{
  success: boolean;
  vendors?: any[];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/admin/settlements");
  return res.data;
}

export async function updateAdminSettlementConfig(data: {
  vendorId: string;
  commissionRate?: number;
  settlementDays?: number;
  autopay?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch("/api/mobile/admin/settlements", data);
  return res.data;
}

export async function executeAdminVendorPayout(data: {
  vendorId: string;
  customAmount?: number;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  payout?: any;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/admin/settlements", data);
  return res.data;
}
