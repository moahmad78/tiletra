import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES, renderTemplateText } from "@/lib/connect/template-engine";

export async function GET() {
  try {
    let dbTemplates = await prisma.connectTemplate.findMany({
      orderBy: { updatedAt: "desc" },
    });

    if (dbTemplates.length === 0) {
      dbTemplates = DEFAULT_TEMPLATES as unknown as typeof dbTemplates;
    }

    return NextResponse.json({ success: true, templates: dbTemplates });
  } catch {
    return NextResponse.json({ success: true, templates: DEFAULT_TEMPLATES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateText, context } = body;

    const rendered = renderTemplateText(templateText, context || {});
    return NextResponse.json({ success: true, rendered });
  } catch (err) {
    console.error("Template rendering error:", err);
    return NextResponse.json({ success: false, error: "Rendering failed" }, { status: 500 });
  }
}
