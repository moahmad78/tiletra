import { apiClient } from "./client";
import { CartItem } from "../types";

export async function fetchCart(): Promise<{ success: boolean; items: CartItem[]; error?: string }> {
  const res = await apiClient.get("/api/mobile/cart");
  return res.data;
}

export async function syncCart(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<{ success: boolean; items?: CartItem[]; error?: string }> {
  const res = await apiClient.post("/api/mobile/cart", { items });
  return res.data;
}
