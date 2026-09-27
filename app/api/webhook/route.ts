import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile, INTRIHUB_DEFAULT_PROMPT } from "@/lib/autobot/profile";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || "my_secret_agent_123").trim();

  if (mode === "subscribe" && token && token.trim() === verifyToken) {
    console.log("WhatsApp Webhook Verified Successfully with challenge:", challenge);
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn(`[WEBHOOK_VERIFY_FAILED] mode=${mode} received_token=${token} expected=${verifyToken}`);
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Incoming WhatsApp Webhook Payload:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    const from = message.from;
    const messageId = message.id;
    const contact = value.contacts?.[0];
    const profileName = contact?.profile?.name || null;

    let messageType: "text" | "image" | "document" = "text";
    let messageText = "";
    let mediaUrl: string | null = null;

    if (message.type === "text") {
      messageText = message.text.body;
    } else if (message.type === "image") {
      messageType = "image";
      messageText = message.image.caption || "";
      const mediaId = message.image.id;
      if (process.env.WHATSAPP_TOKEN && mediaId) {
        try {
          const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
          });
          const mediaData = await mediaRes.json();
          mediaUrl = mediaData.url || null;
        } catch (mErr) {
          console.error("Error retrieving media URL:", mErr);
        }
      }
    } else if (message.type === "document") {
      messageType = "document";
      messageText = message.document.caption || message.document.filename || "";
    }

    const profile = await getOrCreateDefaultProfile();
    const userId = profile?.id;

    // 1. Get or create chat
    let { data: chat } = await supabaseAdmin
      .from("chats")
      .select("*")
      .eq("customer_phone", from)
      .maybeSingle();

    if (!chat) {
      const { data: newChat, error: chatErr } = await supabaseAdmin
        .from("chats")
        .insert({
          user_id: userId,
          customer_phone: from,
          customer_name: profileName,
          chat_mode: profile?.default_mode || "ai",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatErr) {
        console.error("Error creating chat:", chatErr);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
      }
      chat = newChat;
    } else {
      await supabaseAdmin
        .from("chats")
        .update({
          last_message_at: new Date().toISOString(),
          customer_name: profileName || chat.customer_name,
        })
        .eq("id", chat.id);
    }

    // 2. Insert incoming message
    await supabaseAdmin.from("messages").insert({
      chat_id: chat.id,
      sender: "customer",
      message_type: messageType,
      body: messageText,
      media_url: mediaUrl,
    });

    // 3. Automated Instant Response if chat_mode is 'ai'
    if (chat.chat_mode === "ai") {
      const apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("No Gemini API key available for automated response");
        return NextResponse.json({ status: "saved_no_gemini_key" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      let contextText = "";

      if (messageText && messageText.trim() !== "") {
        try {
          const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
          const embeddingResult = await embeddingModel.embedContent(messageText);
          const queryEmbedding = embeddingResult.embedding.values;

          const { data: matchedDocs } = await supabaseAdmin.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_count: 4,
            filter: { user_id: profile?.id },
          });

          if (matchedDocs && matchedDocs.length > 0) {
            contextText = matchedDocs.map((d: any) => d.content).join("\n\n");
          }
        } catch (embErr) {
          console.warn("RAG Embedding match skipped:", embErr);
        }
      }

      const promptParts = [
        profile?.global_system_prompt || INTRIHUB_DEFAULT_PROMPT,
        contextText ? `--- \nVerified Catalog Data:\n${contextText}\n---` : "",
        `Customer WhatsApp Message: ${messageText || "[Image attached]"}`,
      ].filter(Boolean);

      let aiText = "";
      const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];

      for (const mName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const response = await model.generateContent(promptParts.join("\n\n"));
          aiText = response.response.text();
          if (aiText) break;
        } catch (genErr) {
          console.warn(`Model ${mName} skipped:`, genErr);
        }
      }

      if (!aiText) {
        aiText = "Namaste! Intrihub customer desk me aapka swagat hai. Mai aapki tiles, sanitaryware ya site delivery me kya help kar sakta hoon?";
      }

      if (aiText) {
        const { sendWhatsAppMessage } = await import("@/lib/autobot/whatsapp");
        await sendWhatsAppMessage(from, aiText);

        await supabaseAdmin.from("messages").insert({
          chat_id: chat.id,
          sender: "ai",
          message_type: "text",
          body: aiText,
        });

        await supabaseAdmin
          .from("chats")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", chat.id);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
