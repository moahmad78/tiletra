import { NextRequest } from "next/server";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorProducts, createVendorProduct } from "@/lib/actions/vendor";
import { getAuthenticatedVendor } from "../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || "all";
    const approvalStatus = searchParams.get("approvalStatus") || "all";

    const products = await getVendorProducts(auth.vendor.id, {
      search,
      status,
      approvalStatus,
    });

    return mobileApiResponse({
      success: true,
      products,
      count: products.length,
    });
  } catch (err: any) {
    console.error("Mobile vendor get products error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor products" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const body = await req.json().catch(() => ({}));
    const {
      name,
      categoryId,
      categorySlug,
      categoryName,
      pricePerSqft,
      pricePerBox,
      mrp,
      unitOfSale,
      description,
      images,
      stockBoxes,
      material,
      finish,
      size,
      thickness,
      usage,
      look,
      status,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return mobileApiResponse({ success: false, error: "Please enter a valid product name" }, 400);
    }

    const numPrice = Number(pricePerSqft || pricePerBox || 100);
    const numMrp = mrp ? Number(mrp) : numPrice * 1.25;
    const numStock = stockBoxes ? Number(stockBoxes) : 50;
    const imgList = Array.isArray(images) ? images : images ? [images] : [];

    const res = await createVendorProduct(auth.vendor.id, {
      name: name.trim(),
      categoryId: categoryId || undefined,
      categorySlug: categorySlug || "general",
      categoryName: categoryName || "General",
      mrp: numMrp,
      unitOfSale: unitOfSale || "box",
      material: material || "Standard",
      description: description?.trim() || "",
      images: imgList,
      status: status || "active",
      variants: [
        {
          size: size || "600x600mm",
          finish: finish || "Glossy",
          color: look || "Standard",
          pricePerSqft: numPrice,
          pricePerBox: numPrice * 16,
          sqftPerBox: 16,
          stockBoxes: numStock,
          mrp: numMrp,
        },
      ],
      specs: {
        thickness: thickness || "9mm",
        usage: usage || "Indoor / Commercial",
        look: look || "Modern",
      },
    });

    if (!res.success || !res.product) {
      return mobileApiResponse({ success: false, error: res.error || "Failed to create product" }, 400);
    }

    return mobileApiResponse({
      success: true,
      product: res.product,
      message: "Product created successfully!",
    }, 201);
  } catch (err: any) {
    console.error("Mobile vendor create product error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to create product" },
      500
    );
  }
}
