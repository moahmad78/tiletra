import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.broadcastGroup.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { addedAt: "desc" },
        },
        logs: {
          orderBy: { sentAt: "desc" },
          take: 20,
          include: {
            entries: {
              orderBy: { sentAt: "asc" },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Broadcast group not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error("GET /api/broadcast/groups/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch group details." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.broadcastGroup.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error: any) {
    console.error("PATCH /api/broadcast/groups/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update group." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.broadcastGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Group deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/broadcast/groups/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete group." }, { status: 500 });
  }
}
