import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token, platform, deviceId } = body;

    if (!userId || !token) {
      return NextResponse.json({ success: false, error: "userId and token are required" }, { status: 400 });
    }

    const saved = await prisma.mobilePushToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform || "android",
        deviceId: deviceId || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: platform || "android",
        deviceId: deviceId || null,
      },
    });

    return NextResponse.json({ success: true, token: saved.token });
  } catch (error: any) {
    console.error("Mobile push token registration error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to register push token" },
      { status: 500 }
    );
  }
}
