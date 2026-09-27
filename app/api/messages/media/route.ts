import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { sendWhatsAppMediaMessage } from "@/lib/autobot/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const chatId = formData.get("chatId") as string | null;
    const customerPhone = formData.get("customerPhone") as string | null;
    const caption = (formData.get("caption") as string) || "";
    const directUrl = formData.get("mediaUrl") as string | null;
    const directType = formData.get("mediaType") as "image" | "document" | null;

    if (!chatId || !customerPhone) {
      return NextResponse.json({ error: "chatId and customerPhone are required." }, { status: 400 });
    }

    let publicUrl = directUrl || "";
    let mediaType: "image" | "document" = directType || "document";
    let fileName = file?.name || "IntriHub_Catalog.pdf";

    if (file) {
      const mime = file.type || "";
      fileName = file.name;
      if (mime.startsWith("image/")) {
        mediaType = "image";
      } else {
        mediaType = "document";
      }

      const fileExt = fileName.split(".").pop() || (mediaType === "image" ? "png" : "pdf");
      const storagePath = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Attempt upload to Supabase Storage bucket 'whatsapp-media'
      const { error: uploadError } = await supabaseAdmin.storage
        .from("whatsapp-media")
        .upload(storagePath, buffer, {
          contentType: file.type || (mediaType === "image" ? "image/jpeg" : "application/pdf"),
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("whatsapp-media")
          .getPublicUrl(storagePath);
        publicUrl = urlData.publicUrl;
      } else {
        console.warn("Supabase Storage upload warning (trying direct bucket create or data URI):", uploadError.message);
        // Fallback: create bucket if not existing and re-upload
        await supabaseAdmin.storage.createBucket("whatsapp-media", { public: true });
        const { error: retryError } = await supabaseAdmin.storage
          .from("whatsapp-media")
          .upload(storagePath, buffer, {
            contentType: file.type || (mediaType === "image" ? "image/jpeg" : "application/pdf"),
            upsert: true,
          });

        if (!retryError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("whatsapp-media")
            .getPublicUrl(storagePath);
          publicUrl = urlData.publicUrl;
        } else {
          console.error("Storage upload failed completely:", retryError);
          return NextResponse.json({ error: `Upload failed: ${retryError.message}` }, { status: 500 });
        }
      }
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "Media file or valid mediaUrl is required." }, { status: 400 });
    }

    // 1. Save message to Supabase database
    const { data: savedMsg, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        chat_id: chatId,
        sender: "human_agent",
        body: publicUrl,
        message_type: mediaType,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting media message to DB:", insertError);
    }

    // 2. Update chat timestamp
    await supabaseAdmin
      .from("chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", chatId);

    // 3. Dispatch to WhatsApp via Meta Cloud API
    const metaResult = await sendWhatsAppMediaMessage(
      customerPhone,
      mediaType,
      publicUrl,
      caption || fileName,
      fileName
    );

    if (!metaResult.success) {
      console.warn("WhatsApp media message saved to DB, but Meta reported:", metaResult.error);
      return NextResponse.json({
        success: true,
        warning: metaResult.error,
        message: savedMsg,
        mediaUrl: publicUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: savedMsg,
      mediaUrl: publicUrl,
    });
  } catch (error: any) {
    console.error("POST /api/messages/media error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
