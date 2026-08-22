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
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  couponCode?: string;
  total?: number;
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

    // ── Execute everything in an ACID Transaction for Atomic Stock Management & Data Integrity ──
    const order = await prisma.$transaction(async (tx) => {
      // 1. Recalculate Prices Server-Side & Perform Atomic Stock Verification / Decrement
      let calculatedSubtotal = 0;
      const verifiedItems: Array<{
        productId: string;
        productName: string;
        variantId: string;
        variantDetails: string;
        boxQuantity: number;
        pricePerBox: number;
        totalPrice: number;
        image: string;
      }> = [];

      for (const item of input.items) {
        let pricePerBox = item.pricePerBox || 0;
        let productName = item.productName || "Product";

        if (item.variantId && item.variantId !== "default") {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: { select: { name: true, id: true, images: true } } },
          });

          if (variant) {
            if (variant.stockBoxes < item.boxQuantity) {
              const pName = variant.product?.name || item.productName;
              throw new Error(
                `Insufficient stock for "${pName}". Only ${variant.stockBoxes} left in stock (requested ${item.boxQuantity}).`
              );
            }

            // Server-derived price (cannot be manipulated by client)
            pricePerBox =
              variant.pricePerBox ||
              (variant.pricePerSqft ? variant.pricePerSqft * (variant.sqftPerBox || 1) : item.pricePerBox);
            if (variant.product?.name) productName = variant.product.name;

            const updatedVariant = await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockBoxes: { decrement: item.boxQuantity },
                inStock: variant.stockBoxes - item.boxQuantity > 0,
              },
            });

            // If this variant reached 0, check if all variants are out of stock
            if (updatedVariant.stockBoxes <= 0 && variant.productId) {
              const remainingStock = await tx.productVariant.findFirst({
                where: { productId: variant.productId, stockBoxes: { gt: 0 } },
              });
              if (!remainingStock) {
                await tx.product.update({
                  where: { id: variant.productId },
                  data: { inStock: false },
                });
              }
            }
          }
        } else if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            pricePerBox = product.pricePerSqft || item.pricePerBox;
            productName = product.name;
          }
        }

        const itemTotal = pricePerBox * item.boxQuantity;
        calculatedSubtotal += itemTotal;

        verifiedItems.push({
          productId: item.productId,
          productName,
          variantId: item.variantId || "default",
          variantDetails: item.variantDetails || "Standard",
          boxQuantity: item.boxQuantity,
          pricePerBox,
          totalPrice: itemTotal,
          image: item.image || "",
        });
      }

      // 1.1 Server-Side Coupon Verification and Atomic Usage Increment
      let calculatedDiscount = 0;
      if (input.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: input.couponCode.toUpperCase().trim() },
        });

        if (coupon && coupon.isActive) {
          const isExpired = coupon.validTill && new Date() > new Date(coupon.validTill);
          const limitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
          const minOrderSatisfied = !coupon.minOrderValue || calculatedSubtotal >= coupon.minOrderValue;

          if (!isExpired && !limitReached && minOrderSatisfied) {
            if (coupon.discountType === "percentage") {
              calculatedDiscount = Math.round((calculatedSubtotal * coupon.value) / 100);
              if (coupon.maxDiscountCap && calculatedDiscount > coupon.maxDiscountCap) {
                calculatedDiscount = coupon.maxDiscountCap;
              }
            } else {
              calculatedDiscount = coupon.value;
            }

            // Atomically increment coupon usage count
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      } else if (input.discount && input.discount > 0) {
        calculatedDiscount = Math.min(input.discount, calculatedSubtotal);
      }

      // 1.2 Server-Side Delivery Fee & Final Order Total Calculation
      const calculatedDeliveryFee = calculatedSubtotal >= 50000 ? 0 : (input.deliveryFee !== undefined ? input.deliveryFee : 0);
      const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount);

      // 1.3 Strict Payment Bypass Prevention: Verify Razorpay Signature for Online Orders
      let finalPaymentStatus = "Pending";
      let finalPaymentCollected = false;

      if (input.paymentMethod === "COD") {
        // COD orders must ALWAYS be pending until manually collected
        finalPaymentStatus = "Pending";
        finalPaymentCollected = false;
      } else {
        // Online payment: Require valid HMAC-SHA256 signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (input.razorpayOrderId && input.razorpayPaymentId && input.razorpaySignature && keySecret) {
          const text = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
          const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(text)
            .digest("hex");

          const expectedBuffer = Buffer.from(expectedSignature);
          const signatureBuffer = Buffer.from(input.razorpaySignature);

          const isMatch =
            expectedBuffer.length === signatureBuffer.length &&
            crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

          if (isMatch) {
            finalPaymentStatus = "Paid";
            finalPaymentCollected = true;
          } else {
            console.warn(`[Security Warning] Payment signature mismatch for order ${orderId}. Defaulting to Pending.`);
            finalPaymentStatus = "Pending";
            finalPaymentCollected = false;
          }
        } else {
          // No signature provided: cannot mark as Paid
          finalPaymentStatus = "Pending";
          finalPaymentCollected = false;
        }
      }

      // 2. Resolve or create User in PostgreSQL inside transaction
      let validUserId: string | null = null;
      if (input.userId) {
        const existingUser = await tx.user.findUnique({ where: { id: input.userId } });
        if (existingUser) validUserId = existingUser.id;
      }
      if (!validUserId && cleanEmail) {
        const userByEmail = await tx.user.findUnique({ where: { email: cleanEmail } });
        if (userByEmail) validUserId = userByEmail.id;
      }
      if (!validUserId && cleanPhone.length === 10) {
        const userByPhone = await tx.user.findUnique({ where: { phone: cleanPhone } });
        if (userByPhone) validUserId = userByPhone.id;
      }
      if (!validUserId) {
        try {
          const newUser = await tx.user.create({
            data: {
              phone: cleanPhone.length === 10 ? cleanPhone : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              email: cleanEmail || null,
              name: input.customerName || (cleanPhone.length === 10 ? `Customer ${cleanPhone.slice(-4)}` : "Customer"),
              role: "customer",
            },
          });
          validUserId = newUser.id;
        } catch {
          if (cleanEmail) {
            const fallbackUser = await tx.user.findUnique({ where: { email: cleanEmail } });
            if (fallbackUser) validUserId = fallbackUser.id;
          }
          if (!validUserId && cleanPhone.length === 10) {
            const fallbackUser = await tx.user.findUnique({ where: { phone: cleanPhone } });
            if (fallbackUser) validUserId = fallbackUser.id;
          }
        }
      }

      // 3. Upsert Customer CRM inside transaction
      await tx.customer.upsert({
        where: { phone: input.customerPhone },
        update: {
          name: input.customerName,
          email: input.customerEmail || undefined,
          city: input.shippingAddress.city || "Bangalore",
          totalOrders: { increment: 1 },
          totalSpent: { increment: calculatedTotal },
        },
        create: {
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail || null,
          city: input.shippingAddress.city || "Bangalore",
          totalOrders: 1,
          totalSpent: calculatedTotal,
          status: "Active",
        },
      });

      // 4. Create Parent Order & Items inside transaction
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: validUserId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || "customer@intrihub.com",
          shippingAddress: input.shippingAddress as any,
          subtotal: calculatedSubtotal,
          deliveryFee: calculatedDeliveryFee,
          discount: calculatedDiscount,
          total: calculatedTotal,
          paymentStatus: finalPaymentStatus,
          paymentMethod: input.paymentMethod,
          codConfirmed: input.paymentMethod === "COD" || Boolean(input.codConfirmed),
          paymentCollected: finalPaymentCollected,
          paymentId: input.paymentId || (finalPaymentCollected ? input.razorpayPaymentId : null),
          razorpayOrderId: input.razorpayOrderId || null,
          razorpayPaymentId: input.razorpayPaymentId || null,
          razorpaySignature: input.razorpaySignature || null,
          orderStatus: "Processing",
          estimatedDelivery: "3–5 Business Days",
          items: {
            create: verifiedItems.map((item) => ({
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

      // 5. Multi-Vendor Marketplace: Route & Split Order to Vendors with Delivery Method capture
      const productIds = verifiedItems.map((i) => i.productId).filter(Boolean);
      if (productIds.length > 0) {
        const dbProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            vendorId: true,
            vendor: {
              select: {
                id: true,
                commissionRate: true,
                businessName: true,
                deliveryMethod: true,
              },
            },
          },
        });

        const productVendorMap = new Map<
          string,
          { vendorId: string; commissionRate: number; deliveryMethod: string }
        >();
        for (const p of dbProducts) {
          if (p.vendorId && p.vendor) {
            productVendorMap.set(p.id, {
              vendorId: p.vendorId,
              commissionRate: p.vendor.commissionRate ?? 15,
              deliveryMethod: p.vendor.deliveryMethod || "self",
            });
          }
        }

        // Group items by vendor
        const vendorSubtotals = new Map<
          string,
          { subtotal: number; commissionRate: number; deliveryMethod: string }
        >();
        for (const item of verifiedItems) {
          const vInfo = productVendorMap.get(item.productId);
          if (vInfo) {
            const current = vendorSubtotals.get(vInfo.vendorId) || {
              subtotal: 0,
              commissionRate: vInfo.commissionRate,
              deliveryMethod: vInfo.deliveryMethod,
            };
            current.subtotal += item.totalPrice;
            vendorSubtotals.set(vInfo.vendorId, current);
          }
        }

        // Create VendorOrderSplit records
        for (const [vId, vData] of vendorSubtotals.entries()) {
          // Commission & payout calculated/finalized when fulfillmentStatus reaches "delivered"
          const commissionAmount = Number(((vData.subtotal * vData.commissionRate) / 100).toFixed(2));
          const vendorPayoutAmount = Number((vData.subtotal - commissionAmount).toFixed(2));

          await tx.vendorOrderSplit.create({
            data: {
              orderId: createdOrder.id,
              vendorId: vId,
              subtotal: vData.subtotal,
              commissionRate: vData.commissionRate,
              commissionAmount: 0, // finalized upon delivery
              vendorPayoutAmount: 0, // finalized upon delivery
              deliveryMethod: vData.deliveryMethod || "self",
              fulfillmentStatus: "processing",
              paymentCollected: finalPaymentCollected,
            },
          });
        }
      }

      return createdOrder;
    }, {
      maxWait: 15000,
      timeout: 35000,
    });

    // ── Post-Transaction Notifications & Broadcasts ──
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

export async function deleteOrder(id: string) {
  try {
    // 1. Delete associated VendorOrderSplit records
    await prisma.vendorOrderSplit.deleteMany({
      where: { orderId: id },
    });

    // 2. Delete associated OrderItems
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // 3. Delete the Order
    await prisma.order.delete({
      where: { id },
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin");
    safeRevalidate(`/admin/orders/${id}`);
    safeRevalidate("/account/orders");
    safeRevalidate("/vendor/orders");

    return { success: true, message: `Order #${id} deleted permanently from database` };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return { success: false, error: error?.message || "Failed to delete order" };
  }
}

export async function deleteOrdersBulk(ids: string[]) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No order IDs provided for bulk deletion" };
    }

    // 1. Delete associated VendorOrderSplit records
    await prisma.vendorOrderSplit.deleteMany({
      where: { orderId: { in: ids } },
    });

    // 2. Delete associated OrderItems
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: ids } },
    });

    // 3. Delete the Orders
    const result = await prisma.order.deleteMany({
      where: { id: { in: ids } },
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin");
    safeRevalidate("/account/orders");
    safeRevalidate("/vendor/orders");

    return {
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} order(s) permanently from database`,
    };
  } catch (error: any) {
    console.error("Error bulk deleting orders:", error);
    return { success: false, error: error?.message || "Failed to bulk delete orders" };
  }
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  items,
  couponCode,
}: {
  amount?: number; // in paise
  currency?: string;
  receipt?: string;
  items?: Array<{ productId: string; variantId?: string; boxQuantity: number; pricePerBox?: number }>;
  couponCode?: string;
}) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return { success: false, error: "Razorpay credentials not configured on server" };
    }

    let calculatedPaise = 0;

    if (items && items.length > 0) {
      // 1. Recalculate price server-side from database
      let subtotal = 0;
      for (const item of items) {
        let pricePerBox = item.pricePerBox || 0;
        if (item.variantId && item.variantId !== "default") {
          const v = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
          if (v) {
            pricePerBox = v.pricePerBox || (v.pricePerSqft ? v.pricePerSqft * (v.sqftPerBox || 1) : pricePerBox);
          }
        } else if (item.productId) {
          const p = await prisma.product.findUnique({ where: { id: item.productId } });
          if (p) {
            pricePerBox = p.pricePerSqft || pricePerBox;
          }
        }
        subtotal += pricePerBox * item.boxQuantity;
      }

      // 2. Validate coupon discount server-side
      let discount = 0;
      if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
        if (coupon && coupon.isActive) {
          const isExpired = coupon.validTill && new Date() > new Date(coupon.validTill);
          const limitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
          const minOrderSatisfied = !coupon.minOrderValue || subtotal >= coupon.minOrderValue;
          if (!isExpired && !limitReached && minOrderSatisfied) {
            discount =
              coupon.discountType === "percentage"
                ? Math.min(coupon.maxDiscountCap || Infinity, Math.round((subtotal * coupon.value) / 100))
                : coupon.value;
          }
        }
      }

      const deliveryFee = subtotal >= 50000 ? 0 : 0;
      const totalRupees = Math.max(1, subtotal + deliveryFee - discount);
      calculatedPaise = Math.round(totalRupees * 100);
    } else if (amount) {
      calculatedPaise = typeof amount === "number" ? Math.round(amount) : parseInt(amount, 10);
    }

    if (!calculatedPaise || isNaN(calculatedPaise) || calculatedPaise < 100) {
      return { success: false, error: "Amount must be at least ₹1 (100 paise)" };
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: calculatedPaise,
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
      key_id,
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
