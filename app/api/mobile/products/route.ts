import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const categorySlug = searchParams.get("category") || searchParams.get("categorySlug");
    const subcategory = searchParams.get("subcategory");
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const finish = searchParams.get("finish");
    const material = searchParams.get("material");
    const vendorId = searchParams.get("vendorId");
    const isTrending = searchParams.get("trending") === "true";
    const isBestseller = searchParams.get("bestseller") === "true";
    const isNewArrival = searchParams.get("newArrival") === "true";
    const sortBy = searchParams.get("sort") || "popular"; // popular, price_asc, price_desc, rating, newest
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "active",
      approvalStatus: "approved",
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { categoryName: { contains: q, mode: "insensitive" } },
        { material: { contains: q, mode: "insensitive" } },
        { finish: { contains: q, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.categorySlug = categorySlug;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerSqft = {};
      if (minPrice !== undefined) where.pricePerSqft.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerSqft.lte = maxPrice;
    }

    if (finish) where.finish = { equals: finish, mode: "insensitive" };
    if (material) where.material = { equals: material, mode: "insensitive" };
    if (vendorId) where.vendorId = vendorId;
    if (isTrending) where.isTrending = true;
    if (isBestseller) where.isBestseller = true;
    if (isNewArrival) where.isNewArrival = true;

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { pricePerSqft: "asc" };
    else if (sortBy === "price_desc") orderBy = { pricePerSqft: "desc" };
    else if (sortBy === "rating") orderBy = { rating: "desc" };
    else if (sortBy === "popular") orderBy = [{ isTrending: "desc" }, { isBestseller: "desc" }, { rating: "desc" }];

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              logo: true,
            },
          },
          variants: {
            take: 10,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return mobileApiResponse({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + products.length < totalCount,
      },
    });
  } catch (err: any) {
    console.error("Mobile products list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch products" },
      500
    );
  }
}
