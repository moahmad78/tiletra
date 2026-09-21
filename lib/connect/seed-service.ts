import { prisma } from "@/lib/prisma";
import { APPROVED_INTRIHUB_KNOWLEDGE } from "./knowledge-data";
import { DEFAULT_TEMPLATES } from "./template-engine";

export async function ensureConnectSeedData() {
  try {
    const existingCount = await prisma.connectConversation.count();
    if (existingCount > 0) return;

    // 1. Create Knowledge Sources
    for (const doc of APPROVED_INTRIHUB_KNOWLEDGE) {
      await prisma.connectKnowledgeSource.create({
        data: {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          version: doc.version,
          status: "APPROVED",
          approvedBy: doc.approvedBy,
          content: doc.content,
          chunks: {
            create: doc.highlights.map((h, i) => ({
              title: `${doc.title} - Section ${i + 1}`,
              content: h,
              tags: doc.tags,
            })),
          },
        },
      });
    }

    // 2. Create Templates
    for (const tmpl of DEFAULT_TEMPLATES) {
      await prisma.connectTemplate.create({
        data: {
          id: tmpl.id,
          name: tmpl.name,
          category: tmpl.category,
          channel: tmpl.channel,
          subject: tmpl.subject,
          textContent: tmpl.textContent,
          variables: tmpl.variables,
          language: tmpl.language,
          status: "APPROVED",
          createdBy: "Admin",
        },
      });
    }

    // 3. Create Demo Customers
    const rahul = await prisma.connectCustomer.create({
      data: {
        name: "Rahul Sharma",
        phone: "+91 98450 12345",
        email: "rahul.sharma@example.com",
        company: "Sharma Electrical Works",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560068",
        tags: ["Contractor", "High Value", "Repeat Customer"],
        notes: "Prefers heavy duty PVC conduit pipes. Usually pays via UPI on delivery confirmation.",
        totalOrders: 8,
        totalSpend: 148500,
      },
    });

    const abcInteriors = await prisma.connectCustomer.create({
      data: {
        name: "ABC Interiors (Vikram)",
        email: "procurement@abcinteriors.in",
        phone: "+91 99001 88220",
        company: "ABC Interiors & Architects Pvt Ltd",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560034",
        tags: ["Interior Designer", "B2B", "VIP"],
        notes: "Major commercial interior designer. Needs GST Input Tax Credit invoice for every order.",
        totalOrders: 14,
        totalSpend: 485000,
      },
    });

    const mohit = await prisma.connectCustomer.create({
      data: {
        name: "Mohit Verma",
        phone: "+91 97110 55432",
        email: "mohit.v@gmail.com",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560100",
        tags: ["Home Owner", "Pending Delivery"],
        notes: "Order placed yesterday for sanitary fittings and 20mm pipes.",
        totalOrders: 2,
        totalSpend: 24200,
      },
    });

    const suresh = await prisma.connectCustomer.create({
      data: {
        name: "Suresh Gowda",
        phone: "+91 98860 33411",
        email: "suresh.gowda@contractors.in",
        company: "Gowda Infrastructure",
        city: "Mysore",
        state: "Karnataka",
        tags: ["Contractor", "New Customer"],
        notes: "Comparing pricing for bulk regional construction sites.",
        totalOrders: 1,
        totalSpend: 54000,
      },
    });

    // 4. Create Conversations & Messages

    // Conversation 1: Rahul Sharma (WhatsApp)
    const conv1 = await prisma.connectConversation.create({
      data: {
        customerId: rahul.id,
        channel: "WHATSAPP",
        status: "OPEN",
        priority: "HIGH",
        assignedTo: "Amit (Support Lead)",
        isStarred: true,
        lastMessageAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
      },
    });

    await prisma.connectMessage.createMany({
      data: [
        {
          conversationId: conv1.id,
          channel: "WHATSAPP",
          sender: "Rahul Sharma",
          direction: "INBOUND",
          body: "20mm PVC pipe chahiye 100 piece",
          originalBody: "20mm PVC pipe chahiye 100 piece",
          translatedBody: "I need 100 pieces of 20mm PVC pipe.",
          detectedLanguage: "Hindi",
          sentiment: "Neutral",
          status: "DELIVERED",
          createdAt: new Date(Date.now() - 2 * 60 * 1000),
        },
      ],
    });

    // Conversation 2: ABC Interiors (Email)
    const conv2 = await prisma.connectConversation.create({
      data: {
        customerId: abcInteriors.id,
        channel: "EMAIL",
        accountEmail: "support@intrihub.com",
        subject: "Quotation required for 50 commercial LED panel lights",
        status: "PENDING",
        priority: "NORMAL",
        assignedTo: "Priya (Sales)",
        isStarred: true,
        lastMessageAt: new Date(Date.now() - 8 * 60 * 1000), // 8 mins ago
      },
    });

    await prisma.connectMessage.createMany({
      data: [
        {
          conversationId: conv2.id,
          channel: "EMAIL",
          sender: "ABC Interiors (Vikram)",
          recipient: "support@intrihub.com",
          direction: "INBOUND",
          body: "Hello Team,\n\nWe require a formal commercial quotation for 50 units of 2x2 36W Commercial LED Panel Lights with GST ITC invoice for our Indiranagar commercial project.\n\nPlease share availability and delivery schedule.",
          originalBody: "Quotation required for 50 commercial LED panel lights",
          translatedBody: "Quotation required for 50 commercial LED panel lights",
          detectedLanguage: "English",
          sentiment: "Neutral",
          status: "DELIVERED",
          createdAt: new Date(Date.now() - 8 * 60 * 1000),
        },
      ],
    });

    // Conversation 3: Mohit Verma (WhatsApp)
    const conv3 = await prisma.connectConversation.create({
      data: {
        customerId: mohit.id,
        channel: "WHATSAPP",
        status: "OPEN",
        priority: "URGENT",
        assignedTo: "Amit (Support Lead)",
        isStarred: false,
        lastMessageAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      },
    });

    await prisma.connectMessage.createMany({
      data: [
        {
          conversationId: conv3.id,
          channel: "WHATSAPP",
          sender: "Mohit Verma",
          direction: "INBOUND",
          body: "Delivery kab hogi?",
          originalBody: "Delivery kab hogi?",
          translatedBody: "When will delivery happen?",
          detectedLanguage: "Hinglish",
          sentiment: "Neutral",
          status: "DELIVERED",
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
      ],
    });

    // Conversation 4: Suresh Gowda (WhatsApp) - Competitor comparison test
    const conv4 = await prisma.connectConversation.create({
      data: {
        customerId: suresh.id,
        channel: "WHATSAPP",
        status: "OPEN",
        priority: "NORMAL",
        assignedTo: "Amit (Support Lead)",
        isStarred: false,
        lastMessageAt: new Date(Date.now() - 25 * 60 * 1000),
      },
    });

    await prisma.connectMessage.createMany({
      data: [
        {
          conversationId: conv4.id,
          channel: "WHATSAPP",
          sender: "Suresh Gowda",
          direction: "INBOUND",
          body: "Which is better, IntriHub or Amazon?",
          originalBody: "Which is better, IntriHub or Amazon?",
          translatedBody: "Which is better, IntriHub or Amazon?",
          detectedLanguage: "English",
          sentiment: "Neutral",
          status: "DELIVERED",
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
        },
      ],
    });

    // 5. Create Sample Tickets with SLA
    await prisma.connectTicket.create({
      data: {
        ticketNumber: "TICK-10291",
        customerId: mohit.id,
        conversationId: conv3.id,
        subject: "Order Dispatch Status Inquiry - Mohit",
        category: "Delivery",
        priority: "HIGH",
        status: "OPEN",
        assignedAgent: "Amit",
        slaFirstResponseMinutes: 15,
        slaResolutionHours: 24,
        dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours remaining
      },
    });

    await prisma.connectTicket.create({
      data: {
        ticketNumber: "TICK-10292",
        customerId: abcInteriors.id,
        conversationId: conv2.id,
        subject: "Bulk Commercial Quotation - 50 LED Panels",
        category: "Product",
        priority: "NORMAL",
        status: "IN_PROGRESS",
        assignedAgent: "Priya",
        slaFirstResponseMinutes: 15,
        slaResolutionHours: 12,
        dueAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error("Connect seed error:", err);
  }
}
