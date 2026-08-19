import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase().trim();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const cleanPhone = query.replace(/\D/g, "");

    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: query, mode: "insensitive" } },
          cleanPhone.length === 10 ? { contactPhone: cleanPhone } : {},
          { slug: query },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("Vendor login API error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
