import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
            mustChangePassword: true,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const query = (username || "").toLowerCase().trim();
    if (!query) {
      return NextResponse.json({ error: "Please enter your email or phone number" }, { status: 400 });
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
        owner: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "No vendor account found with this email or phone number." }, { status: 404 });
    }

    // Check password if configured on owner
    if (vendor.owner?.passwordHash && password) {
      const hash = crypto.createHash("sha256").update(password.trim()).digest("hex");
      if (vendor.owner.passwordHash !== hash) {
        return NextResponse.json({ error: "Incorrect password. Please check your credentials." }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        category: vendor.category,
        status: vendor.status,
        commissionRate: vendor.commissionRate,
        rejectionReason: vendor.rejectionReason,
        ownerName: vendor.owner?.name || vendor.businessName,
        ownerId: vendor.ownerId,
        mustChangePassword: vendor.owner?.mustChangePassword ?? false,
      },
    });
  } catch (error: any) {
    console.error("Vendor login POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
