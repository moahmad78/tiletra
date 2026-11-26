import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/mobile-auth";
import { validateCampaignDeepLink } from "@/lib/deep-link-validator";
import { toAbsoluteHttpsUrl } from "@/lib/push-notifications";

const prisma = rawPrisma as any;

/**
 * Admin API: Festival Calendar CRUD
 * GET  - List all festival events
 * POST - Create a new festival event
 * PUT  - Update a festival event
 * DELETE - Remove a festival event
 */
export async function GET(req: NextRequest) {
  try {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.festivalEvent.findMany({
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error("[Festival Calendar GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch festival events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, date, template, autoSend = true } = body;

    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: "Festival name and date are required" },
        { status: 400 }
      );
    }

    const deepLink = template?.deepLink || "offers";
    const linkValidation = validateCampaignDeepLink(deepLink);

    const sanitizedTemplate = {
      title: template?.title || `Happy ${name} from IntriHub! ✨`,
      body: template?.body || `Celebrate ${name} with exclusive discounts & fast delivery across all materials.`,
      imageUrl: toAbsoluteHttpsUrl(template?.imageUrl) || null,
      accentColor: template?.accentColor || "#F97316",
      deepLink: linkValidation.valid ? linkValidation.sanitizedTarget : "offers",
      ctaLabel: template?.ctaLabel || "View Festival Deals",
    };

    const newEvent = await prisma.festivalEvent.create({
      data: {
        name: name.trim(),
        date: new Date(date),
        template: sanitizedTemplate,
        autoSend: Boolean(autoSend),
      },
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    console.error("[Festival Calendar POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create festival event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, date, template, autoSend } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Festival ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (date) updateData.date = new Date(date);
    if (autoSend !== undefined) updateData.autoSend = Boolean(autoSend);
    if (template) {
      const linkValidation = validateCampaignDeepLink(template.deepLink || "offers");
      updateData.template = {
        title: template.title,
        body: template.body,
        imageUrl: toAbsoluteHttpsUrl(template.imageUrl) || null,
        accentColor: template.accentColor || "#F97316",
        deepLink: linkValidation.valid ? linkValidation.sanitizedTarget : "offers",
        ctaLabel: template.ctaLabel || "View Festival Deals",
      };
    }

    const updated = await prisma.festivalEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error("[Festival Calendar PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update festival event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminCheck = await getAuthenticatedAdmin(req);
    if ("error" in adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Festival ID is required" }, { status: 400 });
    }

    await prisma.festivalEvent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Festival event deleted" });
  } catch (error: any) {
    console.error("[Festival Calendar DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete festival event" },
      { status: 500 }
    );
  }
}
