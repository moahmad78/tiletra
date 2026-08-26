import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return mobileApiResponse({ success: false, error: "Refresh token is required" }, 400);
    }

    const payload = verifyJwt(refreshToken);
    if (!payload || payload.type !== "refresh") {
      return mobileApiResponse({ success: false, error: "Invalid or expired refresh token" }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return mobileApiResponse({ success: false, error: "User not found" }, 404);
    }

    const tokens = generateMobileTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return mobileApiResponse({
      success: true,
      tokens,
    });
  } catch (err: any) {
    console.error("Mobile refresh error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to refresh token" },
      500
    );
  }
}
