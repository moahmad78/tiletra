import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedMobileUser(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                unitOfSale: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return mobileApiResponse({ success: false, error: "Order not found" }, 404);
    }

    const vendorSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactPhone: true,
          },
        },
      },
    });

    // Security check: if user is logged in, ensure order belongs to them
    if (user && order.userId && order.userId !== user.id && order.customerPhone !== user.phone) {
      return mobileApiResponse({ success: false, error: "Unauthorized access to order" }, 403);
    }

    return mobileApiResponse({
      success: true,
      order: {
        ...order,
        vendorSplits,
      },
    });
  } catch (err: any) {
    console.error("Mobile order details error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch order details" },
      500
    );
  }
}
