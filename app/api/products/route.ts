import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/actions/products";
import { parseBoundedInt, sanitizeSearchTerm, sanitizeString } from "@/lib/sanitization";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Bounded and strictly validated query parameters
    const page = parseBoundedInt(searchParams.get("page"), 1, 1000, 1);
    const limit = parseBoundedInt(searchParams.get("limit"), 1, 50, 12);

    const rawCategory = searchParams.get("category") || searchParams.get("categorySlug");
    const categorySlug = rawCategory ? sanitizeString(rawCategory, 80).toLowerCase() : undefined;

    const rawSearch = searchParams.get("search") || searchParams.get("q");
    const search = rawSearch ? sanitizeSearchTerm(rawSearch, 80, 8) : undefined;

    const excludeParam = searchParams.get("exclude") || "";
    // Bound excluded IDs to prevent memory bloat (max 50 IDs, sanitized)
    const excludeIds = new Set(
      excludeParam
        .split(",")
        .slice(0, 50)
        .map((id) => sanitizeString(id, 64))
        .filter(Boolean)
    );

    const skip = (page - 1) * limit;

    // Fetch batch + 1 extra to determine hasMore accurately
    const rawProducts = await getProducts({
      categorySlug: categorySlug === "all" ? undefined : categorySlug,
      search,
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
