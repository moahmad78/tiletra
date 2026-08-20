"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";
import Razorpay from "razorpay";
import crypto from "crypto";

export type OrderItemInput = {
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  boxQuantity: number;
  pricePerBox: number;
  totalPrice: number;
  image?: string;
};

export type CreateOrderInput = {
  id?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  items: OrderItemInput[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  codConfirmed?: boolean;
};

export async function createOrder(input: CreateOrderInput) {
  try {
    const orderId = input.id || `ORD-${Date.now().toString().slice(-6)}`;

    const cleanPhone = input.customerPhone.replace(/\D/g, "");
    const cleanEmail = input.customerEmail?.trim().toLowerCase() || "";

    // ── Resolve or create User in PostgreSQL to guarantee FK integrity ──
    let validUserId: string | null = null;

    // 1. Check by explicit userId (logged-in session)
    if (input.userId) {
      const existingUser = await prisma.user.findUnique({ where: { id: input.userId } });
      if (existingUser) {
        validUserId = existingUser.id;
      }
    }

    // 2. Check by email (handles Google OAuth users, Email OTP users, returning customers)
    if (!validUserId && cleanEmail) {
      const userByEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (userByEmail) {
        validUserId = userByEmail.id;

        // If user had a synthetic placeholder phone (e.g. google_... or email_...), upgrade to real phone if available
        if (cleanPhone.length === 10 && (userByEmail.phone.startsWith("google_") || userByEmail.phone.startsWith("email_"))) {
          const phoneInUse = await prisma.user.findUnique({ where: { phone: cleanPhone } });
          if (!phoneInUse) {
            await prisma.user.update({
              where: { id: userByEmail.id },
              data: { phone: cleanPhone, name: input.customerName || userByEmail.name },
            }).catch(() => {});
          }
        }
      }
    }

    // 3. Check by phone number
    if (!validUserId && cleanPhone.length === 10) {
      const userByPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
      if (userByPhone) {
        validUserId = userByPhone.id;
      }
    }

    // 4. If user still doesn't exist, create a new customer user record safely
    if (!validUserId) {
      try {
        const newUser = await prisma.user.create({
          data: {
            phone: cleanPhone.length === 10 ? cleanPhone : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            email: cleanEmail || null,
            name: input.customerName || (cleanPhone.length === 10 ? `Customer ${cleanPhone.slice(-4)}` : "Customer"),
            role: "customer",
          },
        });
        validUserId = newUser.id;
      } catch {
        // Fallback in case of race condition / unique collision
        if (cleanEmail) {
          const fallbackUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (fallbackUser) validUserId = fallbackUser.id;
        }
        if (!validUserId && cleanPhone.length === 10) {
          const fallbackUser = await prisma.user.findUnique({ where: { phone: cleanPhone } });
          if (fallbackUser) validUserId = fallbackUser.id;
        }
      }
    }

    // Create or update customer record in Customer CRM
    await prisma.customer.upsert({
      where: { phone: input.customerPhone },
      update: {
        name: input.customerName,
        email: input.customerEmail || undefined,
        city: input.shippingAddress.city || "Bangalore",
        totalOrders: { increment: 1 },
        totalSpent: { increment: input.total },
      },
      create: {
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail || null,
        city: input.shippingAddress.city || "Bangalore",
        totalOrders: 1,
        totalSpent: input.total,
        status: "Active",
      },
    });

    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: validUserId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || "customer@intrihub.com",
        shippingAddress: input.shippingAddress as any,
        subtotal: input.subtotal,
        deliveryFee: input.deliveryFee,
        discount: input.discount,
        total: input.total,
        paymentStatus: input.paymentStatus || (input.paymentMethod === "COD" ? "Pending" : "Paid"),
        paymentMethod: input.paymentMethod,
        codConfirmed: Boolean(input.codConfirmed),
        paymentCollected: input.paymentMethod !== "COD",
        paymentId: input.paymentId || null,
        razorpayOrderId: input.razorpayOrderId || null,
        razorpayPaymentId: input.razorpayPaymentId || null,
        razorpaySignature: input.razorpaySignature || null,
        orderStatus: "Processing",
        estimatedDelivery: "3–5 Business Days",
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId || "default",
            variantDetails: item.variantDetails || "Standard",
            boxQuantity: item.boxQuantity,
            pricePerBox: item.pricePerBox,
            totalPrice: item.totalPrice,
            image: item.image || "",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Create an Admin Notification
    try {
      await prisma.adminNotification.create({
        data: {
          title: `New Order #${order.id}`,
          message: `${order.customerName} placed an order for ₹${order.total.toLocaleString("en-IN")}`,
          type: "order",
          link: `/admin/orders/${order.id}`,
        },
      });
    } catch (e) {
      console.error("Failed to create admin notification:", e);
    }

    // Real-Time Socket Broadcast to Admin Room (Phase 5b PRD)
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        event: "new-order",
        room: "admin",
        data: {
          id: order.id,
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          itemsCount: order.items.length,
          items: order.items,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      });
    } catch (e) {
      console.error("Failed to emit socket new-order event:", e);
    }

    // 5. Multi-Vendor Marketplace: Route & Split Order to Vendors
    try {
      const productIds = input.items.map((i) => i.productId).filter(Boolean);
      if (productIds.length > 0) {
        const dbProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            vendorId: true,
            vendor: { select: { id: true, commissionRate: true, businessName: true } },
          },
        });

        const productVendorMap = new Map<string, { vendorId: string; commissionRate: number }>();
        for (const p of dbProducts) {
          if (p.vendorId && p.vendor) {
            productVendorMap.set(p.id, {
              vendorId: p.vendorId,
              commissionRate: p.vendor.commissionRate ?? 15,
            });
          }
        }

        // Group items by vendor
        const vendorSubtotals = new Map<string, { subtotal: number; commissionRate: number }>();
        for (const item of input.items) {
          const vInfo = productVendorMap.get(item.productId);
          if (vInfo) {
            const current = vendorSubtotals.get(vInfo.vendorId) || {
              subtotal: 0,
              commissionRate: vInfo.commissionRate,
            };
            current.subtotal += item.totalPrice || item.pricePerBox * item.boxQuantity;
            vendorSubtotals.set(vInfo.vendorId, current);
          }
        }

        // Create VendorOrderSplit records
        for (const [vId, vData] of vendorSubtotals.entries()) {
          const commissionAmount = Number(((vData.subtotal * vData.commissionRate) / 100).toFixed(2));
          const vendorPayoutAmount = Number((vData.subtotal - commissionAmount).toFixed(2));

          await prisma.vendorOrderSplit.create({
            data: {
              orderId: order.id,
              vendorId: vId,
              subtotal: vData.subtotal,
              commissionRate: vData.commissionRate,
              commissionAmount,
              vendorPayoutAmount,
              fulfillmentStatus: "Processing",
            },
          });

          safeRevalidate(`/vendor/orders`);
          safeRevalidate(`/admin/vendors/${vId}`);
        }
      }
    } catch (splitErr) {
      console.error("Error creating vendor order splits:", splitErr);
    }

    safeRevalidate("/admin/orders");
    safeRevalidate("/account/orders");
    safeRevalidate("/vendor/orders");

    return { success: true, order };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error?.message || "Failed to create order" };
  }
}

export async function getOrders(options?: {
  status?: string;
  phone?: string;
  limit?: number;
}) {
  try {
    const where: any = {};
    if (options?.status && options.status !== "All") {
      where.orderStatus = options.status;
    }
    if (options?.phone) {
      where.customerPhone = { contains: options.phone };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return order;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

export async function getCustomerOrders(params: { userId?: string; phone?: string; email?: string }) {
  try {
    const orConditions: any[] = [];

    // Match exact userId if valid DB id (not synthetic)
    if (params.userId && params.userId.trim() && !params.userId.startsWith("usr-")) {
      orConditions.push({ userId: params.userId.trim() });
    }

    // Match real 10-digit phone number only (never synthetic placeholders)
    if (params.phone && params.phone.trim()) {
      const raw = params.phone.trim();
      if (!raw.startsWith("google_") && !raw.startsWith("email_")) {
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 10) {
          orConditions.push({ customerPhone: digits });
          orConditions.push({ customerPhone: `+91 ${digits}` });
          orConditions.push({ customerPhone: `+91${digits}` });
        }
      }
    }

    // Match exact customerEmail if provided and valid
    if (params.email && params.email.trim() && !params.email.includes("example.com")) {
      orConditions.push({ customerEmail: params.email.trim().toLowerCase() });
    }

    if (orConditions.length === 0) return [];

    const orders = await prisma.order.findMany({
      where: { OR: orConditions },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

export async function getOrdersByPhone(phone: string) {
  return getCustomerOrders({ phone });
}

export async function updateOrderStatus(id: string, orderStatus: string) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { orderStatus },
      include: { items: true },
    });

    const cleanCustomerPhone = order.customerPhone.replace(/\D/g, "");
    const targetRooms = [
      "admin",
      ...(order.userId ? [`user:${order.userId}`] : []),
      ...(cleanCustomerPhone ? [`phone:${cleanCustomerPhone}`] : []),
    ];

    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        event: "order-status-updated",
        rooms: targetRooms,
        data: {
          orderId: order.id,
          orderStatus: order.orderStatus,
          trackingNumber: order.trackingNumber,
          courierName: order.courierName,
          estimatedDelivery: order.estimatedDelivery,
          updatedAt: order.updatedAt,
        },
      });
    } catch (e) {
      console.error("Failed to emit order-status-updated socket event:", e);
    }

    safeRevalidate("/admin/orders");
    safeRevalidate(`/admin/orders/${id}`);
    safeRevalidate("/account/orders");

    return { success: true, order };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error?.message || "Failed to update order status" };
  }
}

export async function updateOrderTracking(
  id: string,
  data: { courierName: string; trackingNumber: string }
) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        orderStatus: "Dispatched",
      },
      include: { items: true },
    });

    const cleanCustomerPhone = order.customerPhone.replace(/\D/g, "");
    const targetRooms = [
      "admin",
      ...(order.userId ? [`user:${order.userId}`] : []),
      ...(cleanCustomerPhone ? [`phone:${cleanCustomerPhone}`] : []),
    ];

    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        event: "order-status-updated",
        rooms: targetRooms,
        data: {
          orderId: order.id,
          orderStatus: order.orderStatus,
          trackingNumber: order.trackingNumber,
          courierName: order.courierName,
          estimatedDelivery: order.estimatedDelivery,
          updatedAt: order.updatedAt,
        },
      });
    } catch (e) {
      console.error("Failed to emit order-status-updated socket event:", e);
    }

    safeRevalidate("/admin/orders");
    safeRevalidate(`/admin/orders/${id}`);
    safeRevalidate("/account/orders");

    return { success: true, order };
  } catch (error: any) {
    console.error("Error updating order tracking:", error);
    return { success: false, error: error?.message || "Failed to update tracking info" };
  }
}

export async function updateOrderNotes(id: string, internalNotes: string) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { internalNotes },
    });

    safeRevalidate(`/admin/orders/${id}`);
    return { success: true, order };
  } catch (error: any) {
    console.error("Error updating order notes:", error);
    return { success: false, error: error?.message || "Failed to update notes" };
  }
}

export async function updatePaymentCollected(id: string, paymentCollected: boolean) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentCollected,
        paymentStatus: paymentCollected ? "Paid" : "Pending",
      },
    });

    safeRevalidate("/admin/orders");
    safeRevalidate(`/admin/orders/${id}`);

    return { success: true, order };
  } catch (error: any) {
    console.error("Error updating payment collected:", error);
    return { success: false, error: error?.message || "Failed to update payment status" };
  }
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
}: {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
}) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return { success: false, error: "Razorpay credentials not configured on server" };
    }

    const parsedAmount = typeof amount === "number" ? Math.round(amount) : parseInt(amount, 10);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      return { success: false, error: "Amount must be at least ₹1 (100 paise)" };
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: parsedAmount,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      payment_capture: true,
    });

    return {
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return {
      success: false,
      error: error?.error?.description || error?.message || "Failed to create Razorpay order",
    };
  }
}

export async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return { success: false, error: "Razorpay secret key not configured on server" };
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: "Missing payment verification parameters" };
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    const isMatch =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      return { success: false, error: "Invalid payment signature. Verification failed." };
    }

    return {
      success: true,
      message: "Payment signature verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    };
  } catch (error: any) {
    console.error("Error verifying payment signature:", error);
    return { success: false, error: error?.message || "Verification failed" };
  }
}
