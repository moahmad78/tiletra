import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const conversation = await prisma.connectConversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages: conversation.messages,
      customer: conversation.customer,
      tickets: conversation.tickets,
    });
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return NextResponse.json({ success: false, error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      body: messageText,
      sender = "Amit (Support Lead)",
      channel,
      translatedBody,
      detectedLanguage,
    } = body;

    if (!messageText?.trim()) {
      return NextResponse.json({ success: false, error: "Message body is required" }, { status: 400 });
    }

    const conversation = await prisma.connectConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Create outbound message
    const message = await prisma.connectMessage.create({
      data: {
        conversationId: id,
        channel: channel || conversation.channel,
        sender,
        direction: "OUTBOUND",
        body: messageText,
        translatedBody,
        detectedLanguage: detectedLanguage || "English",
        status: "SENT",
      },
    });

    // Update conversation timestamp and set status to WAITING_CUSTOMER
    await prisma.connectConversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: "WAITING_CUSTOMER",
      },
    });

    // Log in Audit Log
    await prisma.connectAuditLog.create({
      data: {
        agentName: sender,
        action: "SENT_MESSAGE",
        details: `Sent ${conversation.channel} message to conversation #${id}`,
        entityType: "Conversation",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Failed to send message:", err);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
