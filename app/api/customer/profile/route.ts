import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/autobot/supabase";

export const dynamic = "force-dynamic";

function extractCleanPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.length === 10) clean = `91${clean}`;
  return clean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone")?.trim() || "";

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = extractCleanPhone(phone);
    const last10 = cleanPhone.slice(-10);

    // 1. Fetch Chat record from Supabase
    const { data: chat } = await supabaseAdmin
      .from("chats")
      .select("*")
      .or(`customer_phone.eq.${cleanPhone},customer_phone.eq.${last10}`)
      .maybeSingle();

    // 2. Fetch Customer record from Prisma
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: last10 }, { phone: `+${cleanPhone}` }],
      },
    });

    // 3. Fetch Orders summary from Prisma
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerPhone: { contains: last10 } },
          { customerPhone: { contains: cleanPhone } },
        ],
      },
      select: {
        id: true,
        total: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            boxQuantity: true,
            pricePerBox: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalOrders = orders.length;
    const lifetimeSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // 4. Fetch Broadcast Groups this contact belongs to
    const memberRecords = await prisma.broadcastGroupMember.findMany({
      where: {
        OR: [{ phoneNumber: cleanPhone }, { phoneNumber: last10 }],
      },
      include: {
        group: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    const broadcastGroups = memberRecords.map((m) => ({
      groupId: m.groupId,
      groupName: m.group.name,
      description: m.group.description,
      addedAt: m.addedAt,
    }));

    // 5. Fetch all available Broadcast Groups for quick addition
    const allGroups = await prisma.broadcastGroup.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const assignedGroupIds = new Set(broadcastGroups.map((g) => g.groupId));
    const availableGroups = allGroups.filter((g) => !assignedGroupIds.has(g.id));

    let detectedRole: "vendor" | "customer" | "team" = "customer";
    if (customer?.notes?.includes("[ROLE:vendor]")) {
      detectedRole = "vendor";
    } else if (customer?.notes?.includes("[ROLE:team]")) {
      detectedRole = "team";
    } else if (broadcastGroups.some((g) => g.groupName.toLowerCase().includes("vendor"))) {
      detectedRole = "vendor";
    } else if (broadcastGroups.some((g) => g.groupName.toLowerCase().includes("team"))) {
      detectedRole = "team";
    }

    const cleanNotes = (customer?.notes || "").replace(/\[ROLE:(vendor|customer|team)\]/g, "").trim();

    return NextResponse.json({
      success: true,
      profile: {
        phone: cleanPhone,
        displayPhone: `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`,
        name: chat?.customer_name || customer?.name || "WhatsApp Customer",
        rawName: chat?.customer_name || customer?.name || null,
        city: customer?.city || "Bengaluru, Karnataka",
        notes: cleanNotes || null,
        role: detectedRole,
        firstContactedAt: chat?.created_at || (orders[orders.length - 1]?.createdAt) || null,
        lastActiveAt: chat?.last_message_at || (orders[0]?.createdAt) || null,
        chatMode: chat?.chat_mode || "ai",
        totalOrders,
        lifetimeSpend,
        orders,
        broadcastGroups,
        availableGroups,
      },
    });
  } catch (error: any) {
    console.error("GET /api/customer/profile error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, notes, role } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = extractCleanPhone(phone);
    const last10 = cleanPhone.slice(-10);

    // 1. Update name in Supabase chats
    if (name !== undefined) {
      await supabaseAdmin
        .from("chats")
        .update({ customer_name: name.trim() || null })
        .or(`customer_phone.eq.${cleanPhone},customer_phone.eq.${last10}`);
    }

    // 2. Upsert / update Customer in Prisma
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: last10 }],
      },
    });

    let currentNotes = existing?.notes || "";
    let currentRole = "customer";
    if (currentNotes.includes("[ROLE:vendor]")) currentRole = "vendor";
    if (currentNotes.includes("[ROLE:team]")) currentRole = "team";

    const targetRole = role || currentRole;
    let newNotes = (notes !== undefined ? notes : currentNotes).replace(/\[ROLE:(vendor|customer|team)\]/g, "").trim();
    newNotes = `[ROLE:${targetRole}] ${newNotes}`.trim();

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: name !== undefined ? name.trim() || existing.name : existing.name,
          notes: newNotes,
        },
      });
    } else {
      await prisma.customer.create({
        data: {
          name: name?.trim() || "WhatsApp Customer",
          phone: cleanPhone,
          notes: newNotes,
        },
      });
    }

    // If role changed, ensure enrolled in corresponding default Broadcast Group
    if (role) {
      const groupName = role === "vendor" ? "All Vendors" : role === "team" ? "IntriHub Team" : "All Customers";
      const groupDesc =
        role === "vendor"
          ? "Verified suppliers, tile & sanitaryware manufacturers"
          : role === "team"
          ? "Internal operations, sales & support team"
          : "Direct customer and buyer inquiries";

      let targetGroup = await prisma.broadcastGroup.findFirst({
        where: { name: { equals: groupName, mode: "insensitive" } },
      });

      if (!targetGroup) {
        targetGroup = await prisma.broadcastGroup.create({
          data: {
            name: groupName,
            description: groupDesc,
            createdBy: "Auto System",
          },
        });
      }

      if (targetGroup) {
        await prisma.broadcastGroupMember.upsert({
          where: {
            groupId_phoneNumber: {
              groupId: targetGroup.id,
              phoneNumber: cleanPhone,
            },
          },
          update: { customerName: name?.trim() || undefined },
          create: {
            groupId: targetGroup.id,
            phoneNumber: cleanPhone,
            customerName: name?.trim() || null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Customer profile updated successfully.",
      name: name?.trim() || null,
      notes: newNotes.replace(/\[ROLE:(vendor|customer|team)\]/g, "").trim() || null,
      role: targetRole,
    });
  } catch (error: any) {
    console.error("PATCH /api/customer/profile error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, groupId, customerName } = body;

    if (!phone || !groupId) {
      return NextResponse.json({ error: "phone and groupId are required." }, { status: 400 });
    }

    const cleanPhone = extractCleanPhone(phone);

    await prisma.broadcastGroupMember.upsert({
      where: {
        groupId_phoneNumber: {
          groupId,
          phoneNumber: cleanPhone,
        },
      },
      update: {
        customerName: customerName || undefined,
      },
      create: {
        groupId,
        phoneNumber: cleanPhone,
        customerName: customerName || null,
      },
    });

    return NextResponse.json({ success: true, message: "Added to broadcast group." });
  } catch (error: any) {
    console.error("POST /api/customer/profile error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
