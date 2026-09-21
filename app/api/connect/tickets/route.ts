import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tickets = await prisma.connectTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      conversationId,
      subject,
      description,
      priority = "NORMAL",
      category = "General",
      assignedAgent = "Amit",
      slaFirstResponseMinutes = 15,
      slaResolutionHours = 24,
    } = body;

    const count = await prisma.connectTicket.count();
    const ticketNumber = `TICK-${10290 + count + 1}`;

    const dueAt = new Date(Date.now() + slaResolutionHours * 60 * 60 * 1000);

    const ticket = await prisma.connectTicket.create({
      data: {
        ticketNumber,
        customerId,
        conversationId,
        subject,
        description,
        priority,
        category,
        assignedAgent,
        slaFirstResponseMinutes,
        slaResolutionHours,
        dueAt,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (err) {
    console.error("Failed to create ticket:", err);
    return NextResponse.json({ success: false, error: "Ticket creation failed" }, { status: 500 });
  }
}
