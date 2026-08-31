import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const categorySlug = searchParams.get("category") || searchParams.get("categorySlug") || undefined;
    const excludeParam = searchParams.get("exclude") || "";
    const excludeIds = new Set(excludeParam.split(",").filter(Boolean));

    const skip = (page - 1) * limit;

    // Fetch batch + 1 extra to determine hasMore accurately
    const rawProducts = await getProducts({
      categorySlug: categorySlug === "all" ? undefined : categorySlug,
      limit: limit + 1,
      skip,
    });

    const filtered = rawProducts.filter((p) => !excludeIds.has(p.id));
    const hasMore = rawProducts.length > limit;
    const products = filtered.slice(0, limit);

    return NextResponse.json({
      products,
      hasMore,
      page,
      count: products.length,
    });
  } catch (error: any) {
    console.error("Error in /api/products route:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", products: [], hasMore: false },
      { status: 500 }
    );
  }
}
