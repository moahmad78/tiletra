import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateVendorProduct, deleteVendorProduct } from "@/lib/actions/vendor";
import { formatProduct } from "@/lib/formatters";
import { getAuthenticatedVendor } from "@/lib/mobile-auth";

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
      product: {
        ...formatProduct(product),
        colorImages: (() => {
          try {
            const raw = (product.specs as any)?.colorImages;
            if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
            const attr = product.attributes?.find(a => a.key === 'colorImages');
            if (attr?.value) return JSON.parse(attr.value);
          } catch {}
          return undefined;
        })(),
      },
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
    if (body.brand !== undefined) updateData.brand = body.brand?.trim() || null;
    if (body.modelNumber !== undefined) updateData.modelNumber = body.modelNumber?.trim() || null;
    if (body.sku !== undefined) updateData.sku = body.sku?.trim() || null;
    if (body.mrp !== undefined) updateData.mrp = body.mrp !== null && body.mrp !== "" ? Number(body.mrp) : null;
    if (body.unitOfSale !== undefined) updateData.unitOfSale = body.unitOfSale;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.categoryName !== undefined) updateData.categoryName = body.categoryName;
    if (body.categorySlug !== undefined) updateData.categorySlug = body.categorySlug;
    if (body.material !== undefined) updateData.material = body.material;
    if (body.finish !== undefined) updateData.finish = body.finish;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.thickness !== undefined) updateData.thickness = body.thickness;
    if (body.weightKg !== undefined) updateData.weightKg = body.weightKg !== null && body.weightKg !== "" ? Number(body.weightKg) : null;
    if (body.isBulky !== undefined) updateData.isBulky = Boolean(body.isBulky);
    if (body.hsnCode !== undefined) updateData.hsnCode = body.hsnCode?.trim() || null;
    if (body.gstRate !== undefined) updateData.gstRate = body.gstRate !== null && body.gstRate !== "" ? Number(body.gstRate) : undefined;
    if (body.gstPercent !== undefined) updateData.gstPercent = body.gstPercent !== null && body.gstPercent !== "" ? Number(body.gstPercent) : 18;
    if (body.coverageRate !== undefined) updateData.coverageRate = body.coverageRate !== null && body.coverageRate !== "" ? Number(body.coverageRate) : null;
    if (body.piecesPerBox !== undefined) updateData.piecesPerBox = body.piecesPerBox !== null && body.piecesPerBox !== "" ? Number(body.piecesPerBox) : null;
    if (body.wastageFactor !== undefined) updateData.wastageFactor = body.wastageFactor !== null && body.wastageFactor !== "" ? Number(body.wastageFactor) : 1.1;
    if (body.lowStockAlert !== undefined) updateData.lowStockAlert = body.lowStockAlert !== null && body.lowStockAlert !== "" ? Number(body.lowStockAlert) : 10;
    if (body.warrantyDuration !== undefined) updateData.warrantyDuration = body.warrantyDuration?.trim() || null;
    if (body.returnPolicyDays !== undefined) updateData.returnPolicyDays = body.returnPolicyDays !== null && body.returnPolicyDays !== "" ? Number(body.returnPolicyDays) : 7;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.hasVariants !== undefined) updateData.hasVariants = Boolean(body.hasVariants);
    if (body.highlights !== undefined) updateData.highlights = Array.isArray(body.highlights) ? body.highlights.filter(Boolean) : [];
    if (body.keywords !== undefined) updateData.keywords = Array.isArray(body.keywords) ? body.keywords.filter(Boolean) : [];
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer?.trim() || null;
    if (body.condition !== undefined) updateData.condition = body.condition || "New";
    if (body.minOrderQuantity !== undefined) updateData.minOrderQuantity = Number(body.minOrderQuantity) || 1;
    if (body.maxOrderQuantity !== undefined) updateData.maxOrderQuantity = body.maxOrderQuantity ? Number(body.maxOrderQuantity) : null;
    if (body.isBestseller !== undefined) updateData.isBestseller = Boolean(body.isBestseller);
    if (body.isTrending !== undefined) updateData.isTrending = Boolean(body.isTrending);
    if (body.isNewArrival !== undefined) updateData.isNewArrival = Boolean(body.isNewArrival);

    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? body.images : [body.images];
    }

    // Dynamic Attributes / Specifications (Key-Value)
    if (Array.isArray(body.attributes)) {
      updateData.attributes = body.attributes
        .filter((a: any) => a && typeof a.key === "string" && a.key.trim() && typeof a.value === "string" && a.value.trim())
        .map((a: any) => ({
          key: a.key.trim(),
          value: a.value.trim(),
        }));
    }

    // Dynamic Multi-Variants
    if (Array.isArray(body.variants) && body.variants.length > 0) {
      updateData.variants = body.variants.map((v: any, vIdx: number) => {
        const vPricePerBox = Number(v.pricePerBox || v.price || 0);
        const vPricePerSqft = Number(v.pricePerSqft || 0);
        const vStock = Number(v.stockBoxes !== undefined && v.stockBoxes !== null ? v.stockBoxes : 50);
        const vSqftPerBox = Number(v.sqftPerBox || body.coverageRate || 1);
        return {
          id: v.id && !v.id.startsWith("new-") ? v.id : undefined,
          sku: v.sku || null,
          variantName: v.variantName || v.color || "Standard",
          size: v.size || body.size || "Standard",
          finish: v.finish || body.finish || "Glossy",
          color: v.color || "Standard",
          colorHex: v.colorHex || null,
          swatchImage: v.swatchImage || null,
          image: v.image || (v.color && body.colorImages && body.colorImages[v.color]) || (Array.isArray(v.images) && v.images[0] ? v.images[0] : null),
          images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
          unit: v.unit || body.unitOfSale || "box",
          price: vPricePerBox,
          pricePerBox: vPricePerBox,
          pricePerSqft: vPricePerSqft,
          sqftPerBox: vSqftPerBox,
          piecesPerBox: v.piecesPerBox ? Number(v.piecesPerBox) : (body.piecesPerBox ? Number(body.piecesPerBox) : 4),
          stockBoxes: vStock,
          active: v.active !== undefined ? Boolean(v.active) : true,
          lowStockAlert: v.lowStockAlert ? Number(v.lowStockAlert) : 10,
          isDefault: v.isDefault !== undefined ? Boolean(v.isDefault) : vIdx === 0,
          mrp: v.mrp ? Number(v.mrp) : (body.mrp ? Number(body.mrp) : null),
          weightKg: v.weightKg ? Number(v.weightKg) : (body.weightKg ? Number(body.weightKg) : 2.5),
        };
      });
      updateData.hasVariants = body.hasVariants ?? (body.variants.length > 1);
    } else if (body.pricePerBox !== undefined || body.pricePerSqft !== undefined || body.stockBoxes !== undefined) {
      // Single-item fallback: update default variant
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      });
      if (existingProduct && existingProduct.variants.length > 0) {
        const v0 = existingProduct.variants[0];
        const newPricePerBox = body.pricePerBox !== undefined ? Number(body.pricePerBox) : Number(v0.pricePerBox || v0.price || 0);
        const newPricePerSqft = body.pricePerSqft !== undefined ? Number(body.pricePerSqft) : Number(v0.pricePerSqft || 0);
        const newStock = body.stockBoxes !== undefined ? Number(body.stockBoxes) : Number(v0.stockBoxes);
        updateData.variants = [
          {
            ...v0,
            price: newPricePerBox,
            pricePerBox: newPricePerBox,
            pricePerSqft: newPricePerSqft,
            stockBoxes: newStock,
            mrp: body.mrp !== undefined ? Number(body.mrp) : v0.mrp,
          },
        ];
      }
    }

    if (body.costPrice || body.buyRate || body.dispatchLeadTime || body.warrantyType || body.isFragile !== undefined || body.colorImages) {
      const current = await prisma.product.findUnique({ where: { id }, select: { specs: true } });
      const currentSpecs = (current?.specs as Record<string, any>) || {};
      updateData.specs = {
        ...currentSpecs,
        ...(body.costPrice || body.buyRate ? { costPrice: Number(body.costPrice || body.buyRate), buyRate: Number(body.costPrice || body.buyRate) } : {}),
        ...(body.dispatchLeadTime ? { dispatchLeadTime: body.dispatchLeadTime } : {}),
        ...(body.warrantyType ? { warrantyType: body.warrantyType } : {}),
        ...(body.isFragile !== undefined ? { isFragile: Boolean(body.isFragile) } : {}),
        ...(body.colorImages && typeof body.colorImages === 'object' ? { colorImages: JSON.stringify(body.colorImages) } : {}),
      };
    }

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
