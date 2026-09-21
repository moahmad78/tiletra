import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPROVED_INTRIHUB_KNOWLEDGE } from "@/lib/connect/knowledge-data";

export async function GET() {
  try {
    const sources = await prisma.connectKnowledgeSource.findMany({
      include: { chunks: true },
      orderBy: { updatedAt: "desc" },
    });

    if (sources.length === 0) {
      return NextResponse.json({ success: true, sources: APPROVED_INTRIHUB_KNOWLEDGE });
    }

    return NextResponse.json({ success: true, sources });
  } catch {
    return NextResponse.json({ success: true, sources: APPROVED_INTRIHUB_KNOWLEDGE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sourceId } = body;

    if (action === "approve" && sourceId) {
      await prisma.connectKnowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: "Admin",
        },
      });
      return NextResponse.json({ success: true, message: "Source approved" });
    }

    if (action === "scan_website") {
      // Simulate PRD Section 20 website scan & crawler approval workflow
      return NextResponse.json({
        success: true,
        scanSummary: {
          scannedUrl: "https://www.intrihub.com",
          pagesFound: 184,
          detectedCategories: ["Products (120)", "Categories (18)", "Delivery Policy", "Return Policy", "FAQ"],
          readyForApproval: true,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Knowledge API error:", err);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
