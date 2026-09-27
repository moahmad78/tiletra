import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/help/returns - List returns with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const type = searchParams.get("type");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (orderId) {
      where.orderId = orderId;
    }
    if (type) {
      where.type = type;
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
          },
        },
        orderItem: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, returns });
  } catch (error: any) {
    console.error("Fetch returns API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch returns" },
      { status: 500 }
    );
  }
}

// POST /api/help/returns - Create Return or Exchange
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderItemId,
      items,
      reason,
      type = "return",
      photos = [],
      photoUrls = [],
      notes,
      exchangeItemId,
      exchangeVariant,
      exchangeNotes,
      userId,
    } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        { success: false, error: "Order ID and Reason are required" },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const combinedPhotos = Array.from(
      new Set([...(Array.isArray(photos) ? photos : []), ...(Array.isArray(photoUrls) ? photoUrls : [])])
    );

    const newReturn = await prisma.returnRequest.create({
      data: {
        orderId,
        orderItemId: orderItemId || null,
        userId: userId || order.userId || null,
        items: items ? items : order.items.map((it) => ({
          orderItemId: it.id,
          productName: it.productName,
          boxQuantity: it.boxQuantity,
          pricePerBox: it.pricePerBox,
          totalPrice: it.totalPrice,
        })),
        reason,
        type: type === "exchange" ? "exchange" : "return",
        status: "Requested",
        photos: combinedPhotos,
        photoUrls: combinedPhotos,
        notes: notes || null,
        exchangeItemId: exchangeItemId || null,
        exchangeVariant: exchangeVariant || null,
        exchangeNotes: exchangeNotes || null,
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            total: true,
          },
        },
      },
    });

    // Also auto-log an internal complaint/note for staff audit
    await prisma.complaintNote.create({
      data: {
        orderId,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        note: `[Auto-Logged] ${type.toUpperCase()} raised. Reason: ${reason}. ${notes ? `Notes: ${notes}` : ""}`,
        status: "In Progress",
        priority: type === "exchange" ? "High" : "Medium",
        category: "Return",
        createdBy: "System (Staff Desk)",
      },
    });

    return NextResponse.json({ success: true, returnRequest: newReturn });
  } catch (error: any) {
    console.error("Create return API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create return request" },
      { status: 500 }
    );
  }
}

// PATCH /api/help/returns - Update Status / Process Refund
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      status,
      refundAmount,
      refundMethod,
      refundNotes,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Return Request ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Process refund parameters
    if (refundAmount !== undefined && refundAmount !== null) {
      updateData.refundAmount = parseFloat(refundAmount);
    }
    if (refundMethod) {
      updateData.refundMethod = refundMethod;
    }
    if (refundNotes) {
      updateData.refundNotes = refundNotes;
    }

    if (status === "Refunded" || status === "Completed" || refundAmount) {
      updateData.refundDate = new Date();
      updateData.resolvedAt = new Date();
      if (!updateData.status) updateData.status = "Refunded";
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
      },
    });

    // If refund was processed, log audit note
    if (updateData.refundAmount) {
      await prisma.complaintNote.create({
        data: {
          orderId: updated.orderId,
          customerPhone: updated.order.customerPhone,
          customerName: updated.order.customerName,
          note: `[Refund Processed] Amount: ₹${updateData.refundAmount} via ${updateData.refundMethod || "Original Payment"}. Notes: ${refundNotes || "Processed by support staff"}`,
          status: "Resolved",
          priority: "Medium",
          category: "Payment",
          createdBy: "Support Desk",
          resolvedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (error: any) {
    console.error("Update return API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update return request" },
      { status: 500 }
    );
  }
}
