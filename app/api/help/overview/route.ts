import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReturnsCount,
      openComplaintsCount,
      totalOrdersToday,
      recentReturns,
      recentComplaints,
      recentOrders,
    ] = await Promise.all([
      prisma.returnRequest.count({
        where: {
          status: { in: ["Requested", "Approved", "Pickup Scheduled", "Pending"] },
        },
      }),
      prisma.complaintNote.count({
        where: {
          status: { in: ["Open", "In Progress"] },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.returnRequest.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
              total: true,
              paymentMethod: true,
            },
          },
        },
      }),
      prisma.complaintNote.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          returnRequests: true,
          complaints: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        pendingReturnsCount,
        openComplaintsCount,
        totalOrdersToday,
      },
      recentReturns,
      recentComplaints,
      recentOrders,
    });
  } catch (error: any) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch overview stats" },
      { status: 500 }
    );
  }
}
