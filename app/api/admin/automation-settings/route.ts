import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const storeSettings = await prisma.storeSettings.findFirst({
      select: {
        id: true,
        backInStockEnabled: true,
        priceDropEnabled: true,
        automationTemplates: true,
        maxPushPerDay: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    const defaultTemplates = {
      BACK_IN_STOCK: {
        enabled: storeSettings?.backInStockEnabled ?? true,
        title: "Back in Stock: {{productName}}! 📦",
        body: "{{productName}} is back in stock. Order now before stock runs out!",
      },
      WISHLIST_PRICE_DROP: {
        enabled: storeSettings?.priceDropEnabled ?? true,
        title: "Price Drop on {{productName}}! 📉",
        body: "Good news! Price dropped from ₹{{oldPrice}} to ₹{{newPrice}}. Grab it today!",
      },
    };

    const currentTemplates = {
      ...defaultTemplates,
      ...((storeSettings?.automationTemplates as any) || {}),
    };

    return NextResponse.json({
      success: true,
      settings: {
        backInStockEnabled: storeSettings?.backInStockEnabled ?? true,
        priceDropEnabled: storeSettings?.priceDropEnabled ?? true,
        automationTemplates: currentTemplates,
        maxPushPerDay: storeSettings?.maxPushPerDay ?? 2,
        quietHoursStart: storeSettings?.quietHoursStart ?? "21:00",
        quietHoursEnd: storeSettings?.quietHoursEnd ?? "08:00",
      },
    });
  } catch (error: any) {
    console.error("Error fetching automation settings:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { backInStockEnabled, priceDropEnabled, automationTemplates } = body;

    const dataToUpdate: any = {};
    if (backInStockEnabled !== undefined) {
      dataToUpdate.backInStockEnabled = Boolean(backInStockEnabled);
    }
    if (priceDropEnabled !== undefined) {
      dataToUpdate.priceDropEnabled = Boolean(priceDropEnabled);
    }
    if (automationTemplates !== undefined) {
      dataToUpdate.automationTemplates = automationTemplates;
    }

    let existing = await prisma.storeSettings.findFirst({ select: { id: true } });
    let updated;
    if (existing) {
      updated = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });
    } else {
      updated = await prisma.storeSettings.create({
        data: dataToUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        backInStockEnabled: updated.backInStockEnabled,
        priceDropEnabled: updated.priceDropEnabled,
        automationTemplates: updated.automationTemplates,
      },
    });
  } catch (error: any) {
    console.error("Error saving automation settings:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
