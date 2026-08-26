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
    const sortBy = searchParams.get("sort") || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      status: "active",
      approvalStatus: "approved",
    };

    if (categorySlug) {
      baseWhere.categorySlug = categorySlug;
    }

    if (subcategory) {
      baseWhere.subcategory = subcategory;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      baseWhere.pricePerSqft = {};
      if (minPrice !== undefined) baseWhere.pricePerSqft.gte = minPrice;
      if (maxPrice !== undefined) baseWhere.pricePerSqft.lte = maxPrice;
    }

    if (finish) baseWhere.finish = { equals: finish, mode: "insensitive" };
    if (material) baseWhere.material = { equals: material, mode: "insensitive" };
    if (vendorId) baseWhere.vendorId = vendorId;
    if (isTrending) baseWhere.isTrending = true;
    if (isBestseller) baseWhere.isBestseller = true;
    if (isNewArrival) baseWhere.isNewArrival = true;

    let where = { ...baseWhere };

    if (q) {
      const words = q.split(/\s+/).filter((w) => w.length > 0);
      
      const buildWordOr = (term: string) => [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { categoryName: { contains: term, mode: "insensitive" } },
        { categorySlug: { contains: term, mode: "insensitive" } },
        { subcategory: { contains: term, mode: "insensitive" } },
        { material: { contains: term, mode: "insensitive" } },
        { finish: { contains: term, mode: "insensitive" } },
        { look: { contains: term, mode: "insensitive" } },
        { usage: { contains: term, mode: "insensitive" } },
        {
          variants: {
            some: {
              name: { contains: term, mode: "insensitive" },
            },
          },
        },
      ];

      if (words.length > 1) {
        // Match full phrase OR any individual word
        where.AND = [
          {
            OR: [
              ...buildWordOr(q),
              ...words.map((w) => ({ OR: buildWordOr(w) })),
            ],
          },
        ];
      } else {
        where.OR = buildWordOr(q);
      }
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { pricePerSqft: "asc" };
    else if (sortBy === "price_desc") orderBy = { pricePerSqft: "desc" };
    else if (sortBy === "rating") orderBy = { rating: "desc" };
    else if (sortBy === "popular") orderBy = [{ isTrending: "desc" }, { isBestseller: "desc" }, { rating: "desc" }];

    let [products, totalCount] = await Promise.all([
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

    // If query returned 0 products, provide smart fallback (popular / active items)
    let isFallback = false;
    if (products.length === 0 && q) {
      isFallback = true;
      const fallbackProducts = await prisma.product.findMany({
        where: {
          status: "active",
          approvalStatus: "approved",
        },
        orderBy: [{ isBestseller: "desc" }, { isTrending: "desc" }, { rating: "desc" }],
        take: 20,
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
      });
      products = fallbackProducts;
      totalCount = fallbackProducts.length;
    }

    return mobileApiResponse({
      success: true,
      products,
      isFallback,
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
