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
    const role = searchParams.get("role") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 100);

    const where: any = {};
    if (role !== "all") {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return mobileApiResponse({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        ordersCount: u._count.orders,
        createdAt: u.createdAt,
      })),
      count: users.length,
    });
  } catch (err: any) {
    console.error("Mobile admin users list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch users" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return mobileApiResponse({ success: false, error: "userId and role are required" }, 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return mobileApiResponse({
      success: true,
      message: `User role updated to ${role}`,
      user: updated,
    });
  } catch (err: any) {
    console.error("Mobile admin user update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update user" },
      500
    );
  }
}
