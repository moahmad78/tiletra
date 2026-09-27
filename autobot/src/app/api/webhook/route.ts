import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrCreateDefaultProfile, INTRIHUB_DEFAULT_PROMPT } from "@/lib/profile";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: Request) {
  console.log("\n--- Inbound Webhook Hit (GET Handshake) ---");
  const url = new URL(request.url);
  console.log("Query Params:", Object.fromEntries(url.searchParams.entries()));

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified successfully.");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("❌ Webhook verification failed.");
  return new NextResponse("Forbidden", { status: 403 });
}

async function handleAutomatedAIResponse(
  chatId: string,
  userId: string,
  customerPhone: string,
  messageText: string,
  messageType: string,
  mediaUrl: string | null
) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("gemini_api_key, global_system_prompt")
      .eq("id", userId)
      .maybeSingle();

    const apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log("No Gemini API key found for this profile. Skipping AI response.");
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let contextText = "";

    // 1. RAG Vector Search
    if (messageText && messageText.trim() !== "") {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(messageText);
        const queryEmbedding = embeddingResult.embedding.values;

        const { data: documents, error: matchError } = await supabaseAdmin.rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_threshold: 0.4,
          match_count: 3,
          p_user_id: userId,
        });

        if (!matchError && documents && documents.length > 0) {
          contextText = "Relevant Business Information:\n" + documents.map((d: any) => d.content).join("\n\n");
        }
      } catch (embErr) {
        console.warn("RAG Embedding match skipped/failed:", embErr);
      }
    }

    // 2. Image Part (if media)
    let imagePart = null;
    if (messageType === "image" && mediaUrl) {
      try {
        const imgRes = await fetch(mediaUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          imagePart = {
            inlineData: {
              data: Buffer.from(arrayBuffer).toString("base64"),
              mimeType: imgRes.headers.get("content-type") || "image/jpeg",
            },
          };
        }
      } catch (imgErr) {
        console.warn("Could not load image part for Gemini:", imgErr);
      }
    }

    // 3. Generate Gemini Completion with Multi-Model Fallback
    const promptParts = [
      profile?.global_system_prompt || INTRIHUB_DEFAULT_PROMPT,
      contextText ? `--- \n${contextText}\n---` : "",
      `Customer Message: ${messageText || "[Image attached]"}`,
    ].filter(Boolean);

    const apiContent = imagePart ? [promptParts.join("\n\n"), imagePart] : [promptParts.join("\n\n")];

    let aiText = "";
    const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];
    
    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: mName });
        const response = await model.generateContent(apiContent as any);
        aiText = response.response.text();
        if (aiText) break;
      } catch (genErr) {
        console.warn(`Model ${mName} skipped, trying next fallback:`, genErr);
      }
    }

    if (!aiText) {
      aiText = "Namaste! Intrihub support desk me aapka swagat hai. Mai aapki tiles, sanitaryware ya site delivery me kya help kar sakta hoon?";
    }

    if (aiText) {
      console.log(`Sending AI reply to ${customerPhone}: ${aiText.slice(0, 80)}...`);
      const sent = await sendWhatsAppMessage(customerPhone, aiText);
      if (sent) {
        await supabaseAdmin.from("messages").insert({
          chat_id: chatId,
          sender: "ai",
          body: aiText,
          message_type: "text",
        });
        await supabaseAdmin.from("chats").update({ last_message_at: new Date().toISOString() }).eq("id", chatId);
      }
    }
  } catch (error) {
    console.error("AI Automation Pipeline Error:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("\n--- Inbound Webhook Hit (POST Message) ---");
    console.log(JSON.stringify(body, null, 2));

    if (body.object !== "whatsapp_business_account") {
      console.log("Ignored: Not a whatsapp_business_account object");
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const customerPhone = message.from;
      const messageType = message.type;
      const metaMessageId = message.id;
      const customerName = value.contacts?.[0]?.profile?.name || "WhatsApp User";

      console.log(`Processing message from ${customerPhone} (ID: ${metaMessageId})`);

      let messageText = "";
      let mediaUrl = null;

      if (messageType === "text") {
        messageText = message.text?.body || "";
      } else if (messageType === "image" || messageType === "document") {
        const media = message[messageType];
        messageText = media.caption || "";
        const mediaId = media.id;

        const metaToken = process.env.WHATSAPP_TOKEN;
        if (metaToken) {
          try {
            const mediaRes = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${metaToken}` },
            });

            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              const downloadUrl = mediaData.url;

              const fileRes = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${metaToken}` },
              });

              if (fileRes.ok) {
                const buffer = await fileRes.arrayBuffer();
                const fileName = `${customerPhone}_${Date.now()}_${mediaId}`;

                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                  .from("media")
                  .upload(fileName, buffer, {
                    contentType: mediaData.mime_type || "application/octet-stream",
                    upsert: true,
                  });

                if (!uploadError && uploadData) {
                  const { data: publicUrlData } = supabaseAdmin.storage.from("media").getPublicUrl(fileName);
                  mediaUrl = publicUrlData.publicUrl;
                }
              }
            }
          } catch (mediaErr) {
            console.error("Error downloading WhatsApp media:", mediaErr);
          }
        }
      }

      // Deduplication Check
      const { data: existingMessage } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("meta_message_id", metaMessageId)
        .maybeSingle();

      if (existingMessage) {
        console.log(`Duplicate message ${metaMessageId} received. Ignoring.`);
        return NextResponse.json({ status: "success" }, { status: 200 });
      }

      // Profile Resolution
      const profile = await getOrCreateDefaultProfile();
      if (!profile) {
        console.error("Critical: Could not resolve or create business profile.");
        return NextResponse.json({ status: "error", message: "No profile available" }, { status: 200 });
      }

      // Lookup or create chat
      let { data: chat } = await supabaseAdmin
        .from("chats")
        .select("id, user_id, chat_mode")
        .eq("customer_phone", customerPhone)
        .maybeSingle();

      if (!chat) {
        console.log(`Creating new chat for customer: ${customerPhone}`);
        const { data: newChat } = await supabaseAdmin
          .from("chats")
          .insert({
            user_id: profile.id,
            customer_phone: customerPhone,
            customer_name: customerName,
            chat_mode: profile.default_mode || "ai",
          })
          .select()
          .maybeSingle();

        chat = newChat;
      }

      if (chat) {
        console.log("Inserting incoming message to DB...");
        const finalBody = mediaUrl ? mediaUrl : messageText;

        await supabaseAdmin.from("messages").insert({
          chat_id: chat.id,
          sender: "customer",
          body: finalBody,
          message_type: messageType,
          meta_message_id: metaMessageId,
        });

        await supabaseAdmin
          .from("chats")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", chat.id);

        if (chat.chat_mode === "ai") {
          console.log("Chat is in AI mode. Triggering async Gemini RAG pipeline...");
          handleAutomatedAIResponse(chat.id, chat.user_id, customerPhone, messageText, messageType, mediaUrl).catch(
            console.error
          );
        } else {
          console.log("Chat is in Human mode. Waiting for human agent.");
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
