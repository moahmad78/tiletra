import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/actions/orders";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * GET /api/orders
 * Returns orders with filtering by phone, userId, or status.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (phone) where.customerPhone = phone.replace(/\D/g, "");
    if (userId) where.userId = userId;
    if (status) where.orderStatus = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/orders Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Places an order with inventory verification:
 * - AUTOMATIC ACCEPTANCE: If stock >= ordered quantity, marks order as "Confirmed",
 *   deducts stock count in DB, and dispatches "Order Auto-Confirmed" to customer and vendor.
 * - MANUAL FALLBACK: If stock is low/out-of-stock, marks order as "PENDING_VENDOR_APPROVAL",
 *   and triggers ringing chime alert on Vendor App.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userId,
      customerName = "Customer",
      customerPhone,
      customerEmail,
      shippingAddress,
      items = [],
      subtotal,
      deliveryFee = 0,
      discount = 0,
      couponCode,
      paymentMethod = "COD",
      paymentStatus = "Pending",
      codConfirmed = true,
      isScheduled = false,
      scheduledFor,
      deliverySlot,
      slotId,
    } = body;

    if (!customerPhone || typeof customerPhone !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid customer phone number is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // 1. Direct Inventory Pre-Check against PostgreSQL intrihub_db
    let allInStock = true;
    let inventoryDetails: Array<{
      productId: string;
      variantId?: string;
      requestedQty: number;
      availableStock: number;
      inStock: boolean;
      name: string;
    }> = [];

    for (const item of items) {
      const boxQty = Math.max(1, parseInt(String(item.boxQuantity || item.quantity || item.boxes || 1), 10));
      let availableStock = 0;
      let itemName = item.productName || "Product";
      let isItemInStock = true;

      if (item.variantId && item.variantId !== "default") {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { name: true, inStock: true } } },
        });

        if (variant) {
          availableStock = variant.stockBoxes;
          itemName = variant.product?.name || itemName;
          isItemInStock = variant.stockBoxes >= boxQty;
        } else {
          isItemInStock = false;
        }
      } else if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, inStock: true },
        });

        if (product) {
          itemName = product.name;
          isItemInStock = Boolean(product.inStock);
          availableStock = product.inStock ? 999 : 0;
        }
      }

      if (!isItemInStock) {
        allInStock = false;
      }

      inventoryDetails.push({
        productId: item.productId,
        variantId: item.variantId,
        requestedQty: boxQty,
        availableStock,
        inStock: isItemInStock,
        name: itemName,
      });
    }

    // 2. Invoke createOrder action which atomically persists order, deducts stock if in stock,
    // and sends real-time push notifications & ringing chimes to vendor and customer.
    const result = await createOrder({
      userId,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress: shippingAddress || {
        fullName: customerName,
        phone: customerPhone,
        street: "Default Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      items,
      subtotal,
      deliveryFee,
      discount,
      couponCode,
      paymentMethod,
      paymentStatus,
      codConfirmed,
      isScheduled,
      scheduledFor,
      deliverySlot,
      slotId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create order" },
        { status: 400 }
      );
    }

    const order = result.order;

    return NextResponse.json(
      {
        success: true,
        orderId: order?.id,
        autoAccepted: order?.autoAccepted,
        status: order?.orderStatus,
        inventoryVerified: allInStock,
        inventoryDetails,
        message: order?.autoAccepted
          ? "AUTOMATIC ACCEPTANCE: Sufficient stock confirmed. Order marked as Confirmed and stock deducted."
          : "MANUAL FALLBACK: Low/out-of-stock items detected. Order status set to PENDING_VENDOR_APPROVAL with ringing alert dispatched to vendor.",
        order,
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("[POST /api/orders Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error creating order" },
      { status: 500 }
    );
  }
}
