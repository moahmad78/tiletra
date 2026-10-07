import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    // ── Enrich Notifications with Flipkart-Style Images & Direct Links ──
    const orderIdCandidates = new Set<string>();
    const productCandidates = new Set<string>();
    const categoryCandidates = new Set<string>();

    const EXCLUDED_WORDS = new Set([
      "updated",
      "confirmed",
      "placed",
      "delivered",
      "cancelled",
      "canceled",
      "processing",
      "dispatched",
      "refunded",
      "orders",
      "all",
      "null",
      "undefined",
    ]);

    for (const n of notifications) {
      const text = `${n.title || ""} ${n.message || ""} ${n.link || ""}`;

      // 1. Order Candidates
      const linkOrderMatch = (n.link || "").match(/\/orders?\/([a-zA-Z0-9_-]+)/i);
      if (linkOrderMatch && linkOrderMatch[1]) {
        const clean = linkOrderMatch[1].replace(/^[#\s]+/, "");
        if (!EXCLUDED_WORDS.has(clean.toLowerCase()) && clean.length >= 3) {
          orderIdCandidates.add(clean);
        }
      }

      const textOrderMatch = text.match(/(?:Order\s*#?|#)([A-Za-z0-9_-]+)/i);
      if (textOrderMatch && textOrderMatch[1]) {
        const clean = textOrderMatch[1].replace(/^[#\s]+/, "");
        if (!EXCLUDED_WORDS.has(clean.toLowerCase()) && clean.length >= 3) {
          orderIdCandidates.add(clean);
        }
      }

      // 2. Product Candidates
      if (n.link) {
        const pMatch = n.link.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
        if (pMatch && pMatch[1]) {
          productCandidates.add(pMatch[1]);
        }

        // 3. Category Candidates
        const catMatch =
          n.link.match(/\/categor(?:y|ies)\/([a-zA-Z0-9_-]+)/i) ||
          n.link.match(/[?&]category=([a-zA-Z0-9_-]+)/i);
        if (catMatch && catMatch[1]) {
          categoryCandidates.add(catMatch[1]);
        }
      }
    }

    const [matchedOrders, matchedProducts, matchedCategories] = await Promise.all([
      orderIdCandidates.size > 0
        ? prisma.order.findMany({
            where: {
              OR: [
                { id: { in: Array.from(orderIdCandidates) } },
                { id: { in: Array.from(orderIdCandidates).map((id) => `#${id}`) } },
              ],
            },
            select: {
              id: true,
              items: {
                take: 1,
                select: {
                  image: true,
                  product: {
                    select: {
                      images: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      productCandidates.size > 0
        ? prisma.product.findMany({
            where: {
              OR: [
                { id: { in: Array.from(productCandidates) } },
                { slug: { in: Array.from(productCandidates) } },
              ],
            },
            select: {
              id: true,
              slug: true,
              images: true,
            },
          })
        : Promise.resolve([]),
      categoryCandidates.size > 0
        ? prisma.category.findMany({
            where: {
              slug: { in: Array.from(categoryCandidates) },
            },
            select: {
              slug: true,
              image: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Build fast lookup maps
    const orderMap = new Map<string, { id: string; image: string | null }>();
    for (const o of matchedOrders) {
      const img = o.items[0]?.image || o.items[0]?.product?.images?.[0] || null;
      orderMap.set(o.id, { id: o.id, image: img });
      orderMap.set(o.id.toLowerCase(), { id: o.id, image: img });
    }

    const productMap = new Map<string, { id: string; slug: string; image: string | null }>();
    for (const p of matchedProducts) {
      const img = p.images?.[0] || null;
      productMap.set(p.id, { id: p.id, slug: p.slug, image: img });
      productMap.set(p.slug, { id: p.id, slug: p.slug, image: img });
      productMap.set(p.slug.toLowerCase(), { id: p.id, slug: p.slug, image: img });
    }

    const categoryMap = new Map<string, { slug: string; image: string | null }>();
    for (const c of matchedCategories) {
      categoryMap.set(c.slug, { slug: c.slug, image: c.image || null });
      categoryMap.set(c.slug.toLowerCase(), { slug: c.slug, image: c.image || null });
    }

    // Enrich each notification
    const enrichedNotifications = notifications.map((n) => {
      let image: string | null = null;
      let orderId: string | null = null;
      let productId: string | null = null;
      let targetLink = n.link;

      const text = `${n.title || ""} ${n.message || ""} ${n.link || ""}`;

      // Check Order match
      const linkOrderMatch = (n.link || "").match(/\/orders?\/([a-zA-Z0-9_-]+)/i);
      const textOrderMatch = text.match(/(?:Order\s*#?|#)([A-Za-z0-9_-]+)/i);
      const candidateId =
        linkOrderMatch?.[1]?.replace(/^[#\s]+/, "") ||
        textOrderMatch?.[1]?.replace(/^[#\s]+/, "");

      if (candidateId && !EXCLUDED_WORDS.has(candidateId.toLowerCase())) {
        const foundOrder = orderMap.get(candidateId) || orderMap.get(candidateId.toLowerCase());
        if (foundOrder) {
          image = foundOrder.image;
          orderId = foundOrder.id;
          targetLink = `/order/${foundOrder.id}`;
        } else if (candidateId.startsWith("IH-") || candidateId.startsWith("ORD-")) {
          orderId = candidateId;
          targetLink = `/order/${candidateId}`;
        }
      }

      // Check Product match if no order image
      if (!image && n.link) {
        const pMatch = n.link.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
        if (pMatch && pMatch[1]) {
          const foundProd = productMap.get(pMatch[1]) || productMap.get(pMatch[1].toLowerCase());
          if (foundProd) {
            image = foundProd.image;
            productId = foundProd.id || foundProd.slug;
            targetLink = `/product/${foundProd.slug || foundProd.id}`;
          }
        }
      }

      // Check Category match if still no image
      if (!image && n.link) {
        const catMatch =
          n.link.match(/\/categor(?:y|ies)\/([a-zA-Z0-9_-]+)/i) ||
          n.link.match(/[?&]category=([a-zA-Z0-9_-]+)/i);
        if (catMatch && catMatch[1]) {
          const foundCat = categoryMap.get(catMatch[1]) || categoryMap.get(catMatch[1].toLowerCase());
          if (foundCat && foundCat.image) {
            image = foundCat.image;
          }
        }
      }

      return {
        ...n,
        image,
        orderId,
        productId,
        link: targetLink,
      };
    });

    return mobileApiResponse({
      success: true,
      notifications: enrichedNotifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (err: any) {
    console.error("Mobile notifications fetch error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch notifications" },
      500
    );
  }
}
