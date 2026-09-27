import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function extractLast10Digits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone")?.trim() || "";
    const query = searchParams.get("query")?.trim() || "";

    if (!phone && !query) {
      return NextResponse.json({
        success: true,
        orders: [],
        summary: { totalOrders: 0, lifetimeSpend: 0, customerName: null, customerPhone: null },
      });
    }

    const whereConditions: any[] = [];

    if (query) {
      // Search by Order ID, Phone number, or Customer Name
      const cleanQueryPhone = extractLast10Digits(query);
      whereConditions.push(
        { id: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
        { customerPhone: { contains: cleanQueryPhone || query } },
        { customerEmail: { contains: query, mode: "insensitive" } }
      );
    } else if (phone) {
      const last10 = extractLast10Digits(phone);
      whereConditions.push(
        { customerPhone: { contains: last10 } },
        { customerPhone: { contains: phone } }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: whereConditions,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                categorySlug: true,
              },
            },
          },
        },
      },
    });

    const totalOrders = orders.length;
    const lifetimeSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const firstOrder = orders[0];
    const customerName = firstOrder?.customerName || null;
    const customerPhone = firstOrder?.customerPhone || phone || null;
    const customerEmail = firstOrder?.customerEmail || null;

    const formattedOrders = orders.map((o) => {
      const address =
        o.deliveryAddress ||
        (typeof o.shippingAddress === "object" && o.shippingAddress !== null
          ? (o.shippingAddress as any).street || (o.shippingAddress as any).address || ""
          : "") ||
        [o.deliveryHouseNumber, o.deliveryBuildingName, o.deliveryStreet, o.deliveryArea, o.deliveryCity]
          .filter(Boolean)
          .join(", ");

      return {
        id: o.id,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: o.total,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        discount: o.discount,
        estimatedDelivery: o.estimatedDelivery,
        createdAt: o.createdAt,
        deliveryAddress: address || "Bengaluru, Karnataka",
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        items: o.items.map((it) => ({
          id: it.id,
          productName: it.productName || it.product?.name || "Tile / Building Material",
          categorySlug: it.product?.categorySlug || "tiles",
          image: it.image || it.product?.images?.[0] || null,
          variantDetails: it.variantDetails || null,
          boxQuantity: it.boxQuantity,
          pricePerBox: it.pricePerBox,
          totalPrice: it.totalPrice,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      summary: {
        totalOrders,
        lifetimeSpend,
        customerName,
        customerPhone,
        customerEmail,
      },
    });
  } catch (error: any) {
    console.error("GET /api/customer/orders error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
