import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateVendorProduct, deleteVendorProduct } from "@/lib/actions/vendor";
import { formatProduct } from "@/lib/formatters";
import { getAuthenticatedVendor } from "../../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        attributes: true,
      },
    });

    if (!product || product.vendorId !== auth.vendor.id) {
      return mobileApiResponse({ success: false, error: "Product not found or unauthorized" }, 404);
    }

    return mobileApiResponse({
      success: true,
      product: formatProduct(product),
    });
  } catch (err: any) {
    console.error("Mobile get vendor product error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch product" },
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.mrp !== undefined) updateData.mrp = body.mrp ? Number(body.mrp) : null;
    if (body.unitOfSale !== undefined) updateData.unitOfSale = body.unitOfSale;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.categoryName !== undefined) updateData.categoryName = body.categoryName;
    if (body.categorySlug !== undefined) updateData.categorySlug = body.categorySlug;
    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? body.images : [body.images];
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.material !== undefined) updateData.material = body.material;

    const res = await updateVendorProduct(auth.vendor.id, id, updateData);

    if (!res.success || !res.product) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to update product" }, 400);
    }

    return mobileApiResponse({
      success: true,
      product: res.product,
      message: "Product updated successfully!",
    });
  } catch (err: any) {
    console.error("Mobile patch vendor product error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update product" },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { id } = await params;
    const res = await deleteVendorProduct(auth.vendor.id, id);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to delete product" }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Product removed successfully!",
    });
  } catch (err: any) {
    console.error("Mobile delete vendor product error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to delete product" },
      500
    );
  }
}
