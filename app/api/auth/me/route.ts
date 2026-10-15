import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. No valid session." },
        { status: 401 }
      );
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: "User record not found." },
        { status: 404 }
      );
    }

    const safeUser = {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      phone: fullUser.phone,
      role: fullUser.role,
      avatar: fullUser.avatar,
      phoneVerified: fullUser.phoneVerified,
      emailVerified: fullUser.emailVerified,
      addresses: fullUser.addresses,
      createdAt: fullUser.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error("[Auth API] Session error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resolve session." },
      { status: 500 }
    );
  }
}
