import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!product) {
      return mobileApiResponse({ success: false, error: "Product not found" }, 404);
    }

    return mobileApiResponse({ success: true, product });
  } catch (err: any) {
    console.error("Mobile admin product detail error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch product" },
      500
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      status,
      featured,
      pricePerBox,
      pricePerSqft,
      mrp,
      stockBoxes,
      unitOfSale,
      categorySlug,
      categoryId,
      images,
      material,
      finish,
      size,
      thickness,
      specifications,
    } = body;

    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = String(description).trim();
    if (status !== undefined) data.status = status;
    if (featured !== undefined) data.featured = Boolean(featured);
    if (pricePerBox !== undefined) data.pricePerBox = Number(pricePerBox);
    if (pricePerSqft !== undefined) data.pricePerSqft = Number(pricePerSqft);
    if (mrp !== undefined) data.mrp = Number(mrp);
    if (stockBoxes !== undefined) data.stockBoxes = Number(stockBoxes);
    if (unitOfSale !== undefined) data.unitOfSale = String(unitOfSale).trim();
    if (categorySlug !== undefined) data.categorySlug = String(categorySlug).trim();
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (images !== undefined) data.images = Array.isArray(images) ? images : [images];
    if (material !== undefined) data.material = material;
    if (finish !== undefined) data.finish = finish;
    if (size !== undefined) data.size = size;
    if (thickness !== undefined) data.thickness = thickness;
    if (specifications !== undefined) data.specifications = specifications;

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return mobileApiResponse({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err: any) {
    console.error("Mobile admin product update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update product" },
      500
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) {
      return mobileApiResponse({ success: false, error: "Product not found" }, 404);
    }

    // Soft-delete to Trash
    await prisma.product.update({
      where: { id },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });

    // Create Audit Log for Trash retention & auto 3-day countdown
    await prisma.auditLog.create({
      data: {
        action: "TRASH_DELETE",
        entity: "Product",
        entityId: id,
        userId: auth.user.id,
        details: {
          deletedByName: auth.user.name || "Admin",
          deletedByRole: auth.user.role || "ADMIN",
          deletedByEmail: auth.user.email || "",
          deletedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          productSnapshot: {
            name: product.name,
            vendorName: product.vendor?.businessName || "Direct / Admin",
            vendorId: product.vendorId,
            pricePerSqft: product.pricePerSqft,
          },
        },
      },
    });

    return mobileApiResponse({
      success: true,
      message: `Product "${product.name}" moved to Trash. You can restore it within 3 days.`,
    });
  } catch (err: any) {
    console.error("Mobile admin product delete error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to move product to trash" },
      500
    );
  }
}
