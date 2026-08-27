import { apiClient } from "./client";
import {
  VendorDashboardData,
  Product,
  Category,
  VendorOrderSplit,
  VendorEarningsData,
} from "../types";

// 1. Vendor Dashboard
export async function fetchVendorDashboard(): Promise<{
  success: boolean;
  vendor?: VendorDashboardData["vendor"];
  stats?: VendorDashboardData["stats"];
  recentOrders?: VendorDashboardData["recentOrders"];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/vendor/dashboard");
  return res.data;
}

// 2. Vendor Products
export async function fetchVendorProducts(params?: {
  search?: string;
  status?: string;
  approvalStatus?: string;
}): Promise<{
  success: boolean;
  products?: Product[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/vendor/products", { params });
  return res.data;
}

export async function fetchVendorProduct(id: string): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  const res = await apiClient.get(`/api/mobile/vendor/products/${id}`);
  return res.data;
}

export async function createVendorProduct(data: {
  name: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  pricePerSqft?: number;
  pricePerBox?: number;
  mrp?: number;
  unitOfSale?: string;
  description?: string;
  images?: string[];
  stockBoxes?: number;
  material?: string;
  finish?: string;
  size?: string;
  thickness?: string;
  usage?: string;
  look?: string;
  status?: "active" | "paused" | "draft";
}): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.post("/api/mobile/vendor/products", data);
  return res.data;
}

export async function updateVendorProduct(
  id: string,
  data: Partial<{
    name: string;
    categoryId: string;
    categorySlug: string;
    categoryName: string;
    pricePerSqft: number;
    pricePerBox: number;
    mrp: number;
    unitOfSale: string;
    description: string;
    images: string[];
    stockBoxes: number;
    material: string;
    finish: string;
    size: string;
    thickness: string;
    usage: string;
    look: string;
    status: "active" | "paused" | "draft";
  }>
): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/vendor/products/${id}`, data);
  return res.data;
}

export async function deleteVendorProduct(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.delete(`/api/mobile/vendor/products/${id}`);
  return res.data;
}

export async function toggleVendorProductStatus(
  id: string,
  status: "active" | "paused"
): Promise<{
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/vendor/products/${id}/status`, { status });
  return res.data;
}

// 3. Vendor Orders
export async function fetchVendorOrders(status?: string): Promise<{
  success: boolean;
  orders?: VendorOrderSplit[];
  count?: number;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/vendor/orders", {
    params: { status: status || "all" },
  });
  return res.data;
}

export async function updateVendorOrderStatus(
  splitId: string,
  status: string,
  extra?: { trackingNumber?: string; courierName?: string; paymentCollected?: boolean }
): Promise<{
  success: boolean;
  split?: any;
  message?: string;
  error?: string;
}> {
  const res = await apiClient.patch(`/api/mobile/vendor/orders/${splitId}/status`, {
    status,
    ...extra,
  });
  return res.data;
}

// 4. Categories Picker
export async function fetchVendorCategories(): Promise<{
  success: boolean;
  categories?: Category[];
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/vendor/categories");
  return res.data;
}

// 5. Vendor Earnings
export async function fetchVendorEarnings(): Promise<{
  success: boolean;
  earnings?: VendorEarningsData;
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/vendor/earnings");
  return res.data;
}

// 6. Upload Image
export async function uploadProductImage(
  uri: string,
  fileName?: string,
  mimeType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    const cleanName = fileName || `product-${Date.now()}.jpg`;
    const cleanType = mimeType || "image/jpeg";

    formData.append("file", {
      uri,
      name: cleanName,
      type: cleanType,
    } as any);

    const baseURL = apiClient.defaults.baseURL || "https://www.intrihub.com";
    const res = await fetch(`${baseURL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const fullUrl = data.url.startsWith("http") ? data.url : `${baseURL}${data.url}`;
      return { success: true, url: fullUrl };
    }
    return { success: false, error: data.error || "Upload failed" };
  } catch (err: any) {
    console.error("uploadProductImage error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}
