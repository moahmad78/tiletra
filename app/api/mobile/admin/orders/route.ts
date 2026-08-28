import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 100);

    const where: any = {};
    if (status !== "all") {
      where.orderStatus = { equals: status, mode: "insensitive" };
    } else {
      where.orderStatus = { not: "deleted" };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                categorySlug: true,
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                    contactPhone: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const orderIds = orders.map((o) => o.id);
    const allSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            category: true,
          },
        },
      },
    });

    const splitsMap = new Map<string, any[]>();
    allSplits.forEach((s) => {
      const arr = splitsMap.get(s.orderId) || [];
      arr.push(s);
      splitsMap.set(s.orderId, arr);
    });

    const fallbackProductImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

    return mobileApiResponse({
      success: true,
      orders: orders.map((o) => {
        const fullAddress = [
          o.deliveryHouseNumber,
          o.deliveryBuildingName,
          o.deliveryStreet,
          o.deliveryArea,
          o.deliveryAddress,
          o.deliveryLandmark ? `Near ${o.deliveryLandmark}` : null,
          o.deliveryCity,
          o.deliveryState,
          o.deliveryPostalCode ? `- ${o.deliveryPostalCode}` : null,
        ]
          .filter(Boolean)
          .join(", ") || o.deliveryAddress || "Site Location";

        const mappedItems = o.items.map((it) => ({
          id: it.id,
          productName: it.productName || it.product?.name || "Material Item",
          variantDetails: it.variantDetails || "Standard",
          boxQuantity: it.boxQuantity || 1,
          pricePerBox: it.pricePerBox || 0,
          totalPrice: it.totalPrice || 0,
          image: it.image || it.product?.images?.[0] || fallbackProductImage,
          vendorName: it.product?.vendor?.businessName || "Direct / Admin",
          vendorPhone: it.product?.vendor?.contactPhone || "",
        }));

        const oSplits = splitsMap.get(o.id) || [];
        const mappedVendors = oSplits.length > 0
          ? oSplits.map((s) => ({
              vendorId: s.vendor?.id || s.vendorId,
              businessName: s.vendor?.businessName || "Partner Vendor",
              contactPhone: s.vendor?.contactPhone || "",
              contactEmail: s.vendor?.contactEmail || "",
              category: s.vendor?.category || "Building Materials",
              subtotal: s.subtotal || 0,
              commissionAmount: s.commissionAmount || 0,
              vendorPayoutAmount: s.vendorPayoutAmount || 0,
              fulfillmentStatus: s.fulfillmentStatus || "processing",
              deliveryMethod: s.deliveryMethod || "platform",
            }))
          : mappedItems.map((it) => ({
              vendorId: "direct",
              businessName: it.vendorName,
              contactPhone: it.vendorPhone,
              contactEmail: "",
              category: "Direct Central Hub",
              subtotal: o.subtotal || o.total,
              commissionAmount: 0,
              vendorPayoutAmount: o.total,
              fulfillmentStatus: o.orderStatus,
              deliveryMethod: "platform",
            }));

        return {
          id: o.id,
          orderNumber: o.id.slice(-8).toUpperCase(),
          customerName: o.deliveryName || o.customerName || "Customer",
          customerPhone: o.deliveryPhone || o.customerPhone || "",
          customerEmail: o.customerEmail || "",
          customerAddress: fullAddress,
          total: o.total,
          subtotal: o.subtotal,
          deliveryFee: o.deliveryFee,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          estimatedDelivery: o.estimatedDelivery,
          deliveryCity: o.deliveryCity,
          deliveryLatitude: o.deliveryLatitude,
          deliveryLongitude: o.deliveryLongitude,
          itemsCount: o.items.length,
          splitsCount: oSplits.length,
          items: mappedItems,
          vendors: mappedVendors,
          createdAt: o.createdAt,
        };
      }),
      count: orders.length,
    });
  } catch (err: any) {
    console.error("Mobile admin orders list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch orders" },
      500
    );
  }
}
