import { apiClient } from "./client";
import { Category, Product, OfferBanner } from "../types";

export interface ProductsQuery {
  q?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  finish?: string;
  material?: string;
  trending?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  sort?: "popular" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  banners: OfferBanner[];
  error?: string;
}

export interface ProductDetailsResponse {
  success: boolean;
  product: Product;
  relatedProducts: Partial<Product>[];
  error?: string;
}

export async function getCategories(): Promise<CategoriesResponse> {
  const res = await apiClient.get<CategoriesResponse>("/api/mobile/categories");
  return res.data;
}

export async function getProducts(params: ProductsQuery = {}): Promise<ProductsResponse> {
  const res = await apiClient.get<ProductsResponse>("/api/mobile/products", { params });
  return res.data;
}

export async function getProductDetails(idOrSlug: string): Promise<ProductDetailsResponse> {
  const res = await apiClient.get<ProductDetailsResponse>(`/api/mobile/products/${encodeURIComponent(idOrSlug)}`);
  return res.data;
}
