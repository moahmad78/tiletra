import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/autobot/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { members, rawInput } = body;

    const group = await prisma.broadcastGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Broadcast group not found." }, { status: 404 });
    }

    const existingPhones = new Set(group.members.map((m) => m.phoneNumber));
    const toAdd: { phoneNumber: string; customerName?: string | null }[] = [];
    const seen = new Set<string>();

    // 1. Process structured members array if provided
    if (Array.isArray(members)) {
      for (const m of members) {
        let phone = typeof m === "string" ? m : m?.phone || m?.phoneNumber;
        if (!phone) continue;
        let clean = phone.replace(/\D/g, "");
        if (clean.length === 10) clean = `91${clean}`;
        if (clean.length >= 10 && !existingPhones.has(clean) && !seen.has(clean)) {
          seen.add(clean);
          toAdd.push({
            phoneNumber: clean,
            customerName: typeof m === "object" ? m.name || m.customerName : null,
          });
        }
      }
    }

    // 2. Process rawInput (e.g. pasted numbers: comma / space / newline separated)
    if (rawInput && typeof rawInput === "string") {
      const tokens = rawInput.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean);
      for (const token of tokens) {
        let clean = token.replace(/\D/g, "");
        if (clean.length === 10) clean = `91${clean}`;
        if (clean.length >= 10 && !existingPhones.has(clean) && !seen.has(clean)) {
          seen.add(clean);
          toAdd.push({
            phoneNumber: clean,
            customerName: null,
          });
        }
      }
    }

    if (toAdd.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new unique members to add (they may already be in the group).",
        addedCount: 0,
      });
    }

    // Auto-enrich names from Supabase chats or Prisma Customer table if missing
    for (const item of toAdd) {
      if (!item.customerName) {
        try {
          const { data: chat } = await supabaseAdmin
            .from("chats")
            .select("customer_name")
            .eq("customer_phone", item.phoneNumber)
            .maybeSingle();

          if (chat?.customer_name) {
            item.customerName = chat.customer_name;
          } else {
            const cust = await prisma.customer.findFirst({
              where: {
                OR: [
                  { phone: item.phoneNumber },
                  { phone: item.phoneNumber.slice(-10) },
                ],
              },
              select: { name: true },
            });
            if (cust?.name) item.customerName = cust.name;
          }
        } catch {
          // Ignore name enrichment errors
        }
      }
    }

    // Insert new members
    await prisma.broadcastGroupMember.createMany({
      data: toAdd.map((m) => ({
        groupId,
        phoneNumber: m.phoneNumber,
        customerName: m.customerName || null,
      })),
      skipDuplicates: true,
    });

    const updatedMembers = await prisma.broadcastGroupMember.findMany({
      where: { groupId },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      addedCount: toAdd.length,
      members: updatedMembers,
    });
  } catch (error: any) {
    console.error("POST /api/broadcast/groups/[id]/members error:", error);
    return NextResponse.json({ error: error?.message || "Failed to add group members." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const phoneNumber = searchParams.get("phone");

    if (!memberId && !phoneNumber) {
      return NextResponse.json({ error: "memberId or phone query param is required." }, { status: 400 });
    }

    if (memberId) {
      await prisma.broadcastGroupMember.delete({
        where: { id: memberId },
      });
    } else if (phoneNumber) {
      let clean = phoneNumber.replace(/\D/g, "");
      if (clean.length === 10) clean = `91${clean}`;
      await prisma.broadcastGroupMember.deleteMany({
        where: { groupId, phoneNumber: clean },
      });
    }

    return NextResponse.json({ success: true, message: "Member removed from group." });
  } catch (error: any) {
    console.error("DELETE /api/broadcast/groups/[id]/members error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove member." }, { status: 500 });
  }
}
