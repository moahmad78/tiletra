import { apiClient } from "./client";
import { Order, Address } from "../types";

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  paymentMethod: "online" | "cod";
  items: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variantDetails: string;
    boxQuantity: number;
    pricePerBox: number;
    totalPrice: number;
    image?: string;
  }>;
  shippingAddress: Address;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  couponCode?: string;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: any[];
  shippingAddress: Address;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  couponCode?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export async function createCheckoutOrder(params: CreateOrderParams) {
  const res = await apiClient.post("/api/mobile/checkout/create-order", params);
  return res.data;
}

export async function verifyCheckoutPayment(params: VerifyPaymentParams) {
  const res = await apiClient.post("/api/mobile/checkout/verify-payment", params);
  return res.data;
}

export async function getOrders(page = 1, limit = 15): Promise<{
  success: boolean;
  orders: Order[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  error?: string;
}> {
  const res = await apiClient.get("/api/mobile/orders", { params: { page, limit } });
  return res.data;
}

export async function getOrderDetails(orderId: string): Promise<{
  success: boolean;
  order: Order;
  error?: string;
}> {
  const res = await apiClient.get(`/api/mobile/orders/${encodeURIComponent(orderId)}`);
  return res.data;
}
