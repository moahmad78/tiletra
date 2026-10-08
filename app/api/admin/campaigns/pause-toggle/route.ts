import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, paused } = body;

    if (!["offers", "cart_reminders"].includes(target)) {
      return NextResponse.json({ success: false, error: "Invalid target" }, { status: 400 });
    }

    const updateData: any = {};
    if (target === "offers") updateData.offersPaused = Boolean(paused);
    if (target === "cart_reminders") updateData.cartRemindersPaused = Boolean(paused);

    const updated = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        offersPaused: target === "offers" ? Boolean(paused) : false,
        cartRemindersPaused: target === "cart_reminders" ? Boolean(paused) : false,
      },
    });

    return NextResponse.json({
      success: true,
      offersPaused: updated.offersPaused,
      cartRemindersPaused: updated.cartRemindersPaused,
    });
  } catch (error: any) {
    console.error("[Pause Toggle] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update pause switch" },
      { status: 500 }
    );
  }
}
