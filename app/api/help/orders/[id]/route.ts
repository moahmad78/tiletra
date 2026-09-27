import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true,
                sku: true,
              },
            },
          },
        },
        returnRequests: {
          orderBy: { createdAt: "desc" },
        },
        complaints: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          include: {
            addresses: true,
            orders: {
              take: 10,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                orderStatus: true,
                paymentStatus: true,
                total: true,
                createdAt: true,
              },
            },
          },
        },
        deliveryPartner: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Also fetch all past orders for this customer phone to show full lifetime metrics
    const customerPhone = order.customerPhone;
    let customerOrdersCount = 1;
    let customerLifetimeSpend = order.total;

    if (customerPhone) {
      const allOrders = await prisma.order.findMany({
        where: { customerPhone },
        select: { id: true, total: true, orderStatus: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      customerOrdersCount = allOrders.length;
      customerLifetimeSpend = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    }

    return NextResponse.json({
      success: true,
      order,
      customerMetrics: {
        totalOrders: customerOrdersCount,
        lifetimeSpend: customerLifetimeSpend,
      },
    });
  } catch (error: any) {
    console.error("Order detail API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}
