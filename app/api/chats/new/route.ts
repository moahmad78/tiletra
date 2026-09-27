import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile } from "@/lib/autobot/profile";
import { sendWhatsAppMessage } from "@/lib/autobot/whatsapp";
import { prisma } from "@/lib/prisma";

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const { phone, name, initialMessage, mode, contactRole } = await request.json();

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = formatPhoneNumber(phone.trim());
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

    const role: "vendor" | "customer" | "team" = contactRole === "vendor" || contactRole === "team" ? contactRole : "customer";
    const profile = await getOrCreateDefaultProfile();
    const userId = profile?.id;

    // Check if chat already exists for this phone
    const { data: existingChat } = await supabaseAdmin
      .from("chats")
      .select("*")
      .eq("customer_phone", cleanPhone)
      .maybeSingle();

    let chat = existingChat;

    if (!chat) {
      const { data: newChat, error: createError } = await supabaseAdmin
        .from("chats")
        .insert({
          user_id: userId,
          customer_phone: cleanPhone,
          customer_name: name?.trim() || null,
          chat_mode: mode === "ai" ? "ai" : "human",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create new chat:", createError);
        return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
      }
      chat = newChat;
    } else if (name && name.trim()) {
      const { data: updatedChat } = await supabaseAdmin
        .from("chats")
        .update({ customer_name: name.trim() })
        .eq("id", chat.id)
        .select()
        .single();
      if (updatedChat) chat = updatedChat;
    }

    // Upsert Customer in Prisma with role tag
    const customerName = name?.trim() || "WhatsApp Contact";
    const existingCustomer = await prisma.customer.findFirst({
      where: { OR: [{ phone: cleanPhone }, { phone: cleanPhone.slice(-10) }] },
    });

    if (existingCustomer) {
      let notes = existingCustomer.notes || "";
      notes = notes.replace(/\[ROLE:(vendor|customer|team)\]/g, "").trim();
      notes = `[ROLE:${role}] ${notes}`.trim();
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: name?.trim() || existingCustomer.name,
          notes,
        },
      });
    } else {
      await prisma.customer.create({
        data: {
          phone: cleanPhone,
          name: customerName,
          notes: `[ROLE:${role}]`,
        },
      });
    }

    // Auto-sync into Default Broadcast Group for this Role
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

    if (initialMessage && initialMessage.trim() !== "") {
      const msgText = initialMessage.trim();
      await sendWhatsAppMessage(cleanPhone, msgText);

      await supabaseAdmin.from("messages").insert({
        chat_id: chat.id,
        sender: "human_agent",
        body: msgText,
        message_type: "text",
      });

      await supabaseAdmin
        .from("chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", chat.id);
    }

    return NextResponse.json({
      success: true,
      chat: {
        ...chat,
        contact_role: role,
      },
    });
  } catch (error: any) {
    console.error("POST /api/chats/new error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
