import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: chats, error } = await supabaseAdmin
      .from("chats")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("GET /api/chats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch customers, vendors and broadcast group members for role resolution
    const [customers, vendors, groupMembers] = await Promise.all([
      prisma.customer.findMany({ select: { phone: true, notes: true } }),
      prisma.vendor.findMany({ select: { contactPhone: true } }),
      prisma.broadcastGroupMember.findMany({
        select: { phoneNumber: true, group: { select: { name: true } } },
      }),
    ]);

    const vendorPhones = new Set<string>();
    const teamPhones = new Set<string>();
    const explicitCustomerPhones = new Set<string>();

    for (const v of vendors) {
      if (v.contactPhone) {
        const clean = v.contactPhone.replace(/\D/g, "");
        vendorPhones.add(clean);
        vendorPhones.add(clean.slice(-10));
      }
    }

    for (const c of customers) {
      const clean = c.phone.replace(/\D/g, "");
      if (c.notes?.includes("[ROLE:vendor]")) {
        vendorPhones.add(clean);
        vendorPhones.add(clean.slice(-10));
      } else if (c.notes?.includes("[ROLE:team]")) {
        teamPhones.add(clean);
        teamPhones.add(clean.slice(-10));
      } else if (c.notes?.includes("[ROLE:customer]")) {
        explicitCustomerPhones.add(clean);
        explicitCustomerPhones.add(clean.slice(-10));
      }
    }

    for (const gm of groupMembers) {
      const clean = gm.phoneNumber.replace(/\D/g, "");
      const gName = gm.group.name.toLowerCase();
      if (gName.includes("vendor") || gName.includes("supplier")) {
        vendorPhones.add(clean);
        vendorPhones.add(clean.slice(-10));
      } else if (gName.includes("team") || gName.includes("staff") || gName.includes("internal")) {
        teamPhones.add(clean);
        teamPhones.add(clean.slice(-10));
      }
    }

    const enrichedChats = (chats || []).map((chat) => {
      const cleanPhone = (chat.customer_phone || "").replace(/\D/g, "");
      const last10 = cleanPhone.slice(-10);

      let role: "vendor" | "team" | "customer" = "customer";
      if (teamPhones.has(cleanPhone) || teamPhones.has(last10)) {
        role = "team";
      } else if (vendorPhones.has(cleanPhone) || vendorPhones.has(last10)) {
        role = "vendor";
      } else {
        role = "customer";
      }

      return {
        ...chat,
        contact_role: role,
      };
    });

    return NextResponse.json({ success: true, chats: enrichedChats });
  } catch (error: any) {
    console.error("GET /api/chats exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { chatId, chat_mode, customer_name } = body;

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (chat_mode !== undefined) {
      updates.chat_mode = chat_mode === "ai" ? "ai" : "human";
    }
    if (customer_name !== undefined) {
      updates.customer_name = customer_name;
    }

    const { data: updatedChat, error } = await supabaseAdmin
      .from("chats")
      .update(updates)
      .eq("id", chatId)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/chats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    console.error("PATCH /api/chats exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
