import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile } from "@/lib/autobot/profile";
import { sendWhatsAppMessage } from "@/lib/autobot/whatsapp";

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const { phone, name, initialMessage, mode } = await request.json();

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = formatPhoneNumber(phone.trim());
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    console.error("POST /api/chats/new error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
