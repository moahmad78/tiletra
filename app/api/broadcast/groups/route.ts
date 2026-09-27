import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await prisma.broadcastGroup.findMany({
      include: {
        _count: {
          select: { members: true, logs: true },
        },
        logs: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: {
            id: true,
            sentAt: true,
            totalRecipients: true,
            successCount: true,
            failedCount: true,
            skippedCount: true,
            messageContent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      createdBy: g.createdBy,
      createdAt: g.createdAt,
      memberCount: g._count.members,
      broadcastCount: g._count.logs,
      lastBroadcast: g.logs[0] || null,
    }));

    return NextResponse.json({ success: true, groups: formatted });
  } catch (error: any) {
    console.error("GET /api/broadcast/groups error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch broadcast groups." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, createdBy, members } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Group name is required." }, { status: 400 });
    }

    // Process initial members if provided
    const validMembers: { phoneNumber: string; customerName?: string }[] = [];
    const seenPhones = new Set<string>();

    if (Array.isArray(members)) {
      for (const m of members) {
        let phone = typeof m === "string" ? m : m?.phone || m?.phoneNumber;
        if (!phone) continue;
        let clean = phone.replace(/\D/g, "");
        if (clean.length === 10) clean = `91${clean}`;
        if (clean.length >= 10 && !seenPhones.has(clean)) {
          seenPhones.add(clean);
          const name = typeof m === "object" ? m.name || m.customerName : null;
          validMembers.push({
            phoneNumber: clean,
            customerName: name || null,
          });
        }
      }
    }

    const group = await prisma.broadcastGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: createdBy?.trim() || "Support Agent",
        members: {
          create: validMembers.map((m) => ({
            phoneNumber: m.phoneNumber,
            customerName: m.customerName,
          })),
        },
      },
      include: {
        _count: { select: { members: true, logs: true } },
      },
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
        memberCount: group._count.members,
        broadcastCount: group._count.logs,
      },
    });
  } catch (error: any) {
    console.error("POST /api/broadcast/groups error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create broadcast group." }, { status: 500 });
  }
}
