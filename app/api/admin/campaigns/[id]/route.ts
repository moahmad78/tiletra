import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        logs: {
          take: 100,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            platform: true,
            status: true,
            skipReason: true,
            createdAt: true,
            openedAt: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error("[Campaign ID] GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "sent") {
      return NextResponse.json(
        { success: false, error: "A sent campaign cannot be edited. You can duplicate it." },
        { status: 400 }
      );
    }

    const { title, body: messageBody, imageUrl, target, audience, platforms, scheduledAt, status } = body;

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim().slice(0, 40) } : {}),
        ...(messageBody ? { body: messageBody.trim().slice(0, 90) } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(target ? { target } : {}),
        ...(audience ? { audience } : {}),
        ...(platforms ? { platforms } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    console.error("[Campaign ID] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "scheduled") {
      // Cancel scheduled campaign
      const cancelled = await prisma.campaign.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ success: true, message: "Campaign cancelled", campaign: cancelled });
    }

    if (existing.status === "draft" || existing.status === "cancelled") {
      await prisma.campaign.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Campaign deleted" });
    }

    return NextResponse.json(
      { success: false, error: "Cannot delete a sent campaign." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Campaign ID] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to remove campaign" },
      { status: 500 }
    );
  }
}
