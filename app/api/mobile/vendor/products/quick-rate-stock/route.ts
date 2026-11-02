import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "@/lib/mobile-auth";
import { quickUpdateProductRatesAndStock } from "@/lib/actions/products";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const body = await req.json().catch(() => ({}));
    const { productId, mrp, saleRate, buyRate, stock, variants } = body;

    if (!productId) {
      return mobileApiResponse({ success: false, error: "Product ID is required" }, 400);
    }

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { vendorId: true },
    });

    if (!product || product.vendorId !== auth.vendor.id) {
      return mobileApiResponse({ success: false, error: "Unauthorized or product not found" }, 403);
    }

    const res = await quickUpdateProductRatesAndStock({
      productId,
      mrp: mrp !== undefined && mrp !== "" ? Number(mrp) : undefined,
      saleRate: saleRate !== undefined && saleRate !== "" ? Number(saleRate) : undefined,
      buyRate: buyRate !== undefined && buyRate !== "" ? Number(buyRate) : undefined,
      stock: stock !== undefined && stock !== "" ? Number(stock) : undefined,
      variants: Array.isArray(variants) ? variants : undefined,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to update rates and stock" }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: res.message || "Rates and stock updated successfully!",
    });
  } catch (err: any) {
    console.error("Mobile quick rate & stock update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update rates and stock" },
      500
    );
  }
}

