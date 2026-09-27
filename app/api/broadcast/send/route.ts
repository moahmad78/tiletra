import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  sendWhatsAppMediaMessage,
  sendWhatsAppTemplateMessage,
  checkCustomerSessionWindow,
} from "@/lib/autobot/whatsapp";
import { supabaseAdmin } from "@/lib/autobot/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      groupId,
      messageText,
      mediaUrl,
      mediaType,
      mediaCaption,
      mediaFileName,
      templateName,
      templateLanguage = "en_US",
      sentBy = "Support Agent",
      forceTemplateAll = false,
    } = body;

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required." }, { status: 400 });
    }

    if (!messageText?.trim() && !mediaUrl && !templateName) {
      return NextResponse.json(
        { error: "At least one message content type (text, media, or template) must be provided." },
        { status: 400 }
      );
    }

    const group = await prisma.broadcastGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Broadcast group not found." }, { status: 404 });
    }

    if (group.members.length === 0) {
      return NextResponse.json(
        { error: "This group has no members. Add phone numbers before sending a broadcast." },
        { status: 400 }
      );
    }

    const totalRecipients = group.members.length;
    const broadcastLog = await prisma.broadcastLog.create({
      data: {
        groupId,
        messageContent: messageText?.trim() || (templateName ? `[Template: ${templateName}]` : `[Media: ${mediaType}]`),
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        templateName: templateName || null,
        totalRecipients,
        sentBy,
      },
    });

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const entriesToCreate: {
      broadcastLogId: string;
      phoneNumber: string;
      customerName: string | null;
      status: "sent" | "failed" | "skipped";
      errorMessage: string | null;
    }[] = [];

    // Sequential throttled dispatch (respects Meta rate limits)
    for (const member of group.members) {
      const cleanPhone = member.phoneNumber;
      let status: "sent" | "failed" | "skipped" = "failed";
      let errorMessage: string | null = null;

      try {
        const { inside24h } = await checkCustomerSessionWindow(cleanPhone);

        if (forceTemplateAll && templateName) {
          // Force template to all
          const tRes = await sendWhatsAppTemplateMessage(cleanPhone, templateName, templateLanguage);
          if (tRes.success) {
            status = "sent";
            successCount++;
          } else {
            status = "failed";
            errorMessage = tRes.error || "Meta Template API delivery rejected.";
            failedCount++;
          }
        } else if (inside24h) {
          // Customer messaged within 24h: free-form text or media allowed
          if (mediaUrl) {
            const mRes = await sendWhatsAppMediaMessage(
              cleanPhone,
              mediaType === "document" ? "document" : "image",
              mediaUrl,
              mediaCaption || messageText,
              mediaFileName
            );
            if (mRes.success) {
              status = "sent";
              successCount++;
            } else {
              status = "failed";
              errorMessage = mRes.error || "Meta Media API delivery rejected.";
              failedCount++;
            }
          } else if (messageText?.trim()) {
            const txtRes = await sendWhatsAppMessage(cleanPhone, messageText.trim());
            if (txtRes.success) {
              status = "sent";
              successCount++;
            } else {
              status = "failed";
              errorMessage = txtRes.error || "Meta API text delivery rejected.";
              failedCount++;
            }
          } else if (templateName) {
            const tplRes = await sendWhatsAppTemplateMessage(cleanPhone, templateName, templateLanguage);
            if (tplRes.success) {
              status = "sent";
              successCount++;
            } else {
              status = "failed";
              errorMessage = tplRes.error || "Meta Template delivery rejected.";
              failedCount++;
            }
          }
        } else {
          // Outside 24h window: fallback to template if provided, otherwise skip
          if (templateName) {
            const tplFallbackRes = await sendWhatsAppTemplateMessage(cleanPhone, templateName, templateLanguage);
            if (tplFallbackRes.success) {
              status = "sent";
              successCount++;
            } else {
              status = "failed";
              errorMessage = tplFallbackRes.error || "Fallback Meta Template delivery failed.";
              failedCount++;
            }
          } else {
            status = "skipped";
            errorMessage = "Skipped: Outside 24h customer window (Meta Template required).";
            skippedCount++;
          }
        }

        // Mirror successful message into customer chat timeline in Supabase
        if (status === "sent") {
          try {
            const { data: chat } = await supabaseAdmin
              .from("chats")
              .select("id")
              .eq("customer_phone", cleanPhone)
              .maybeSingle();

            if (chat) {
              await supabaseAdmin.from("messages").insert({
                chat_id: chat.id,
                sender: "human_agent",
                message_type: mediaUrl ? (mediaType === "document" ? "document" : "image") : "text",
                body: messageText || (templateName ? `📢 [Broadcast Template: ${templateName}]` : "[Broadcast Media]"),
              });
              await supabaseAdmin
                .from("chats")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", chat.id);
            }
          } catch (mErr) {
            // Ignore chat history mirror error
          }
        }
      } catch (sendErr: any) {
        status = "failed";
        errorMessage = sendErr?.message || "Unexpected dispatch error.";
        failedCount++;
      }

      entriesToCreate.push({
        broadcastLogId: broadcastLog.id,
        phoneNumber: cleanPhone,
        customerName: member.customerName,
        status,
        errorMessage,
      });

      // Throttling: 80ms delay between recipient calls
      await new Promise((res) => setTimeout(res, 80));
    }

    // Save all entries
    await prisma.broadcastLogEntry.createMany({
      data: entriesToCreate,
    });

    // Update broadcast log summary
    const updatedLog = await prisma.broadcastLog.update({
      where: { id: broadcastLog.id },
      data: {
        successCount,
        failedCount,
        skippedCount,
      },
      include: {
        entries: {
          orderBy: { sentAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      log: updatedLog,
      summary: {
        totalRecipients,
        successCount,
        failedCount,
        skippedCount,
      },
    });
  } catch (error: any) {
    console.error("POST /api/broadcast/send error:", error);
    return NextResponse.json({ error: error?.message || "Failed to execute broadcast." }, { status: 500 });
  }
}
