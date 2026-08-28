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

    // 1. Overall Aggregates
    const [
      totalOrdersCount,
      totalUsersCount,
      totalVendorsCount,
      activeVendorsCount,
      totalProductsCount,
      allOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "approved" } }),
      prisma.product.count(),
      prisma.order.findMany({
        select: {
          total: true,
          subtotal: true,
          orderStatus: true,
          paymentStatus: true,
        },
      }),
    ]);

    // Calculate Platform GMV and Revenue
    const totalGmv = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const paidOrders = allOrders.filter(
      (o) => o.paymentStatus === "paid" || o.orderStatus === "delivered"
    );
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    // 2. Recent Orders with Full Customer, Vendor & Item Details
    const recentOrders = await prisma.order.findMany({
      take: 12,
      where: { orderStatus: { not: "deleted" } },
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

    const recentOrderIds = recentOrders.map((o) => o.id);
    const recentSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: recentOrderIds } },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            category: true,
            businessAddress: true,
          },
        },
      },
    });

    const splitsMap = new Map<string, any[]>();
    recentSplits.forEach((s) => {
      const arr = splitsMap.get(s.orderId) || [];
      arr.push(s);
      splitsMap.set(s.orderId, arr);
    });

    // 3. Pending Vendor Approvals
    const pendingVendors = await prisma.vendor.findMany({
      where: { status: "pending" },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // 4. Low Stock & Out of Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        OR: [
          { inStock: false },
          { status: "out_of_stock" },
          { variants: { some: { stockBoxes: { lt: 10 } } } },
        ],
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
      include: {
        variants: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            ownerId: true,
          },
        },
      },
    });

    const fallbackProductImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

    return mobileApiResponse({
      success: true,
      stats: {
        totalGmv,
        totalRevenue,
        totalOrdersCount,
        totalUsersCount,
        totalVendorsCount,
        activeVendorsCount,
        totalProductsCount,
        pendingApprovalsCount: pendingVendors.length,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders: recentOrders.map((o) => {
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
          .join(", ") || o.deliveryAddress || "Site Location Provided at Dispatch";

        const mappedItems = o.items.map((it) => {
          const itemImg = it.image || it.product?.images?.[0] || fallbackProductImage;
          return {
            id: it.id,
            productName: it.productName || it.product?.name || "Building Material Item",
            variantDetails: it.variantDetails || "Standard Variant",
            boxQuantity: it.boxQuantity || 1,
            pricePerBox: it.pricePerBox || 0,
            totalPrice: it.totalPrice || 0,
            image: itemImg,
            vendorName: it.product?.vendor?.businessName || "Direct / Admin",
            vendorPhone: it.product?.vendor?.contactPhone || "",
          };
        });

        const oSplits = splitsMap.get(o.id) || [];
        const mappedVendors = oSplits.length > 0
          ? oSplits.map((s) => ({
              vendorId: s.vendor?.id || s.vendorId,
              businessName: s.vendor?.businessName || "Partner Vendor",
              contactPhone: s.vendor?.contactPhone || "",
              contactEmail: s.vendor?.contactEmail || "",
              category: s.vendor?.category || "Building Materials",
              address: s.vendor?.businessAddress || "",
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
              address: "Central Warehouse",
              subtotal: o.subtotal || o.total,
              commissionAmount: 0,
              vendorPayoutAmount: o.total,
              fulfillmentStatus: o.orderStatus,
              deliveryMethod: "platform",
            }));

        return {
          id: o.id,
          orderNumber: o.id.slice(-8).toUpperCase(),
          total: o.total,
          subtotal: o.subtotal || o.total,
          deliveryFee: o.deliveryFee || 0,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          itemsCount: o.items.length,
          createdAt: o.createdAt.toISOString(),
          formattedDate: new Date(o.createdAt).toLocaleString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          customer: {
            name: o.deliveryName || o.customerName || "Customer",
            phone: o.deliveryPhone || o.customerPhone || "N/A",
            email: o.customerEmail || "N/A",
            avatar: null,
            address: fullAddress,
            city: o.deliveryCity || "N/A",
            state: o.deliveryState || "N/A",
            pincode: o.deliveryPostalCode || "N/A",
            latitude: o.deliveryLatitude || null,
            longitude: o.deliveryLongitude || null,
          },
          items: mappedItems,
          vendors: mappedVendors,
        };
      }),
      pendingVendors: pendingVendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        category: v.category,
        createdAt: v.createdAt.toISOString(),
      })),
      lowStockProducts: lowStockProducts.map((p) => {
        const firstVariant = p.variants?.[0];
        const pImg = p.images?.[0] || firstVariant?.image || firstVariant?.swatchImage || fallbackProductImage;
        return {
          id: p.id,
          name: p.name,
          pricePerBox: firstVariant?.pricePerBox || 0,
          pricePerSqft: p.pricePerSqft || firstVariant?.pricePerSqft || 0,
          stockBoxes: firstVariant?.stockBoxes ?? (p.inStock ? 50 : 0),
          unitOfSale: p.unitOfSale || "box",
          images: [pImg],
          status: p.status,
          vendor: p.vendor,
        };
      }),
    });
  } catch (err: any) {
    console.error("Mobile admin dashboard error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch dashboard data" },
      500
    );
  }
}
