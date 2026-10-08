import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { haversineDistanceKm } from "@/lib/delivery/geo";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("query") ||
      ""
    ).trim();

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

    // F1: Parse and validate customer coordinates
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");
    const lat = rawLat !== null && !isNaN(parseFloat(rawLat)) && parseFloat(rawLat) >= -90 && parseFloat(rawLat) <= 90 ? parseFloat(rawLat) : undefined;
    const lng = rawLng !== null && !isNaN(parseFloat(rawLng)) && parseFloat(rawLng) >= -180 && parseFloat(rawLng) <= 180 ? parseFloat(rawLng) : undefined;
    const hasCoordinates = lat !== undefined && lng !== undefined;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(250, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "active",
      approvalStatus: "approved",
    };

    if (categorySlug && !q) {
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
      ];

      // Combine full phrase and individual word search terms into a clean flat OR
      const orList: any[] = [...buildWordOr(q)];
      if (words.length > 1) {
        for (const w of words) {
          orList.push(...buildWordOr(w));
        }
      }
      where.OR = orList;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { pricePerSqft: "asc" };
    else if (sortBy === "price_desc") orderBy = { pricePerSqft: "desc" };
    else if (sortBy === "rating") orderBy = { rating: "desc" };
    else if (sortBy === "popular") orderBy = [{ isTrending: "desc" }, { isBestseller: "desc" }, { rating: "desc" }];

    // Nearest-first distance ordering activates when coordinates are provided and no explicit price/rating sort is chosen
    const shouldSortNearest = hasCoordinates && sortBy === "popular";

    let products: any[] = [];
    let totalCount = 0;

    if (shouldSortNearest) {
      // Fetch all candidate products matching filter to sort nearest-first with deterministic pagination
      const [allMatchedProducts, count] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          take: 1000, // safe ceiling for current catalog
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                logo: true,
                latitude: true,
                longitude: true,
              },
            },
            variants: {
              take: 10,
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      totalCount = count;

      // Calculate distance for each item
      const getDist = (p: any): number => {
        if (p.vendor?.latitude != null && p.vendor?.longitude != null) {
          return haversineDistanceKm(lat!, lng!, p.vendor.latitude, p.vendor.longitude);
        }
        return Infinity;
      };

      // Sort nearest to farthest with 100m tie-break rule (F1-11)
      allMatchedProducts.sort((a, b) => {
        const distA = getDist(a);
        const distB = getDist(b);

        if (distA === Infinity && distB === Infinity) return 0;
        if (distA === Infinity) return 1;
        if (distB === Infinity) return -1;

        // F1-11: Vendors within 100m (0.1 km) of each other preserve secondary ranking
        if (Math.abs(distA - distB) < 0.1) {
          return 0; // retain database orderBy ranking
        }
        return distA - distB;
      });

      products = allMatchedProducts.slice(skip, skip + limit);
    } else {
      // Default path without coordinates or with explicit non-popular sort
      const [dbProducts, count] = await Promise.all([
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
                latitude: true,
                longitude: true,
              },
            },
            variants: {
              take: 10,
            },
          },
        }),
        prisma.product.count({ where }),
      ]);
      products = dbProducts;
      totalCount = count;
    }

    // If a search query yielded 0 exact results, fallback to active items
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
