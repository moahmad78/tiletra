import { NextRequest, NextResponse } from "next/server";
import { generateIntriHubAiReply } from "@/lib/connect/ai-orchestrator";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerMessage,
      conversationId,
      customerId,
      customerName,
      orderId,
      tone = "Professional",
    } = body;

    if (!customerMessage) {
      return NextResponse.json({ success: false, error: "customerMessage is required" }, { status: 400 });
    }

    const suggestion = await generateIntriHubAiReply({
      customerMessage,
      customerName,
      customerId,
      orderId,
      tone,
    });

    // Optionally record AI run in DB if conversationId is provided
    if (conversationId) {
      try {
        await prisma.connectAiRun.create({
          data: {
            conversationId,
            intent: suggestion.intent,
            detectedLanguage: suggestion.detectedLanguage,
            confidence: suggestion.confidence,
            suggestedReply: suggestion.suggestedReply,
            sourcesUsed: suggestion.sources as unknown as Prisma.InputJsonValue,
            status: "PENDING",
          },
        });
      } catch (logErr) {
        console.error("Failed to log AI run:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (err) {
    console.error("AI suggestion error:", err);
    return NextResponse.json({ success: false, error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}
