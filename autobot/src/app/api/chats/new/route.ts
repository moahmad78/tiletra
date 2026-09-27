import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrCreateDefaultProfile } from "@/lib/profile";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  // If 10 digits (standard Indian number), prefix with 91
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
      return NextResponse.json({ error: "Invalid phone number format. Please enter a valid 10-12 digit number." }, { status: 400 });
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
      // Create new chat
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
        return NextResponse.json({ error: "Failed to create conversation in database." }, { status: 500 });
      }
      chat = newChat;
    } else if (name && name.trim()) {
      // Update customer name if provided
      const { data: updatedChat } = await supabaseAdmin
        .from("chats")
        .update({ customer_name: name.trim() })
        .eq("id", chat.id)
        .select()
        .single();
      if (updatedChat) chat = updatedChat;
    }

    // If an initial message was provided, send it via WhatsApp and save to messages
    if (initialMessage && initialMessage.trim() !== "") {
      const msgText = initialMessage.trim();

      // Try sending via WhatsApp Cloud API
      const sent = await sendWhatsAppMessage(cleanPhone, msgText);
      if (!sent) {
        console.warn("WhatsApp API dispatch warning: message not sent to Meta, saving to DB only");
      }

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
