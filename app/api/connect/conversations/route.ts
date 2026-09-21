import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureConnectSeedData } from "@/lib/connect/seed-service";

export async function GET(req: NextRequest) {
  try {
    await ensureConnectSeedData();

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel"); // "WHATSAPP" | "EMAIL"
    const status = searchParams.get("status"); // "OPEN" | "PENDING" | "RESOLVED"
    const search = searchParams.get("q");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};

    if (channel && channel !== "ALL") {
      where.channel = channel.toUpperCase();
    }
    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }
    if (priority && priority !== "ALL") {
      where.priority = priority.toUpperCase();
    }

    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
        { subject: { contains: search, mode: "insensitive" } },
        { messages: { some: { body: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const conversations = await prisma.connectConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        tickets: {
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      channel: conv.channel,
      accountEmail: conv.accountEmail,
      subject: conv.subject,
      status: conv.status,
      priority: conv.priority,
      assignedTo: conv.assignedTo,
      isStarred: conv.isStarred,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      customer: conv.customer,
      lastMessagePreview: conv.messages[0]?.body || "",
      lastMessageTime: conv.messages[0]?.createdAt.toISOString() || conv.lastMessageAt.toISOString(),
      openTicketsCount: conv.tickets.length,
    }));

    return NextResponse.json({ success: true, conversations: formatted });
  } catch (err: unknown) {
    console.error("Failed to fetch conversations:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, phone, email, channel = "WHATSAPP", initialMessage } = body;

    let customer = await prisma.connectCustomer.findFirst({
      where: {
        OR: [{ phone: phone || undefined }, { email: email || undefined }],
      },
    });

    if (!customer) {
      customer = await prisma.connectCustomer.create({
        data: {
          name: customerName || "New Customer",
          phone,
          email,
          tags: ["New Customer"],
        },
      });
    }

    const conversation = await prisma.connectConversation.create({
      data: {
        customerId: customer.id,
        channel,
        status: "OPEN",
        priority: "NORMAL",
        assignedTo: "Amit (Support Lead)",
      },
    });

    if (initialMessage) {
      await prisma.connectMessage.create({
        data: {
          conversationId: conversation.id,
          channel,
          sender: customer.name,
          direction: "INBOUND",
          body: initialMessage,
          originalBody: initialMessage,
          status: "DELIVERED",
        },
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (err) {
    console.error("Failed to create conversation:", err);
    return NextResponse.json({ success: false, error: "Creation failed" }, { status: 500 });
  }
}
