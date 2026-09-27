import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { sendWhatsAppMessage } from "@/lib/autobot/whatsapp";

export async function POST(request: Request) {
  try {
    const { chatId, customerPhone, messageText } = await request.json();

    if (!chatId || !customerPhone || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save message to Supabase database first so agent never loses history
    const { data: savedMsg, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        chat_id: chatId,
        sender: "human_agent",
        body: messageText,
        message_type: "text",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting sent message:", insertError);
    }

    // 2. Update chat timestamp
    await supabaseAdmin
      .from("chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", chatId);

    // 3. Dispatch to Meta WhatsApp Cloud API
    const metaResult = await sendWhatsAppMessage(customerPhone, messageText);

    if (!metaResult.success) {
      console.warn("WhatsApp message saved in DB, but Meta API reported error:", metaResult.error);
      return NextResponse.json({
        success: false,
        error: metaResult.error || "Meta WhatsApp Cloud API rejected message delivery.",
        message: savedMsg,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: savedMsg,
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
