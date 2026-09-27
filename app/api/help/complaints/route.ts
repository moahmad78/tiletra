import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/help/complaints - List complaints
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (orderId) {
      where.orderId = orderId;
    }
    if (phone) {
      where.customerPhone = { contains: phone.replace(/\D/g, "").slice(-10) };
    }

    const complaints = await prisma.complaintNote.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            total: true,
            orderStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, complaints });
  } catch (error: any) {
    console.error("Fetch complaints API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

// POST /api/help/complaints - Create Complaint or Staff Note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      userId,
      customerPhone,
      customerName,
      note,
      status = "Open",
      priority = "Medium",
      category = "General",
      createdBy = "Staff",
    } = body;

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Note content is required" },
        { status: 400 }
      );
    }

    // If orderId is provided, enrich missing customer info
    let enrichedPhone = customerPhone;
    let enrichedName = customerName;
    let enrichedUserId = userId;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { customerPhone: true, customerName: true, userId: true },
      });
      if (order) {
        if (!enrichedPhone) enrichedPhone = order.customerPhone;
        if (!enrichedName) enrichedName = order.customerName;
        if (!enrichedUserId) enrichedUserId = order.userId;
      }
    }

    const newComplaint = await prisma.complaintNote.create({
      data: {
        orderId: orderId || null,
        userId: enrichedUserId || null,
        customerPhone: enrichedPhone || null,
        customerName: enrichedName || null,
        note: note.trim(),
        status,
        priority,
        category,
        createdBy,
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

    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (error: any) {
    console.error("Create complaint API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create complaint" },
      { status: 500 }
    );
  }
}

// PATCH /api/help/complaints - Update Complaint Status / Note
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, note, priority, category } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Complaint ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "Resolved") {
        updateData.resolvedAt = new Date();
      }
    }
    if (note) updateData.note = note;
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;

    const updated = await prisma.complaintNote.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    console.error("Update complaint API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update complaint" },
      { status: 500 }
    );
  }
}
