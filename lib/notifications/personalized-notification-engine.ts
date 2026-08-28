/**
 * IntriHub Intelligent Personalized Push & Offer Notification Engine
 * Generates and delivers highly-targeted Flipkart-style notifications
 * based on user's Cart items, Wishlist, Viewed Categories, and Past Orders.
 */

import { prisma } from "@/lib/prisma";

export interface TargetedNotificationResult {
  userId: string;
  title: string;
  message: string;
  type: "offer" | "order" | "promo" | "info" | "new_arrival";
  link: string;
  productId?: string;
  categorySlug?: string;
  pushSent: boolean;
  dbSaved: boolean;
}

// Complementary Cross-Sell Mapping for Construction & Home Building
const CROSS_SELL_MAP: Record<string, { categorySlug: string; categoryName: string; pitch: string }> = {
  "tiles-stone": {
    categorySlug: "construction-chemicals",
    categoryName: "Tile Adhesive & Epoxy Grout",
    pitch: "Get heavy-duty polymer tile adhesive and waterproof epoxy grout for your tiles",
  },
  "plywood-boards": {
    categorySlug: "hardware-fasteners",
    categoryName: "Laminates & SS Screws",
    pitch: "Complete your woodwork with anti-rust screws and decorative laminates",
  },
  "electrical-appliances": {
    categorySlug: "hardware-fasteners",
    categoryName: "Modular Switches & PVC Conduits",
    pitch: "Pair your wiring with high-grade modular switches and flame-retardant conduits",
  },
  "paint-finishes": {
    categorySlug: "construction-chemicals",
    categoryName: "Wall Putty & Waterproof Primer",
    pitch: "Ensure long-lasting shine with premium acrylic wall putty and exterior primer",
  },
  "plumbing-sanitary": {
    categorySlug: "hardware-fasteners",
    categoryName: "CPVC Solvent & Brass Valves",
    pitch: "Get leak-proof fittings and heavy brass angle valves for your plumbing",
  },
};

export class PersonalizedNotificationEngine {
  /**
   * Generate & send personalized notifications for a specific user based on their active intent
   */
  static async generateAndSendForUser(userId: string): Promise<TargetedNotificationResult | null> {
    try {
      // 1. Fetch user core data, cart, recently viewed and orders
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          },
          recentlyViewed: {
            include: {
              product: true,
            },
            orderBy: { viewedAt: "desc" },
            take: 3,
          },
          orders: {
            include: {
              items: true,
            },
            orderBy: { createdAt: "desc" },
            take: 2,
          },
        },
      });

      if (!user) return null;

      // Optional wishlist items
      let userWishlist: any[] = [];
      try {
        userWishlist = await (prisma as any).wishlistItem?.findMany({
          where: { userId },
          include: { product: true },
          take: 3,
        }) || [];
      } catch {
        userWishlist = [];
      }

      // Optional push tokens
      let userPushTokens: any[] = [];
      try {
        userPushTokens = await (prisma as any).mobilePushToken?.findMany({
          where: { userId },
        }) || [];
      } catch {
        userPushTokens = [];
      }

      let targetTitle = "";
      let targetMessage = "";
      let targetLink = "/shop";
      let targetType: "offer" | "promo" | "new_arrival" | "info" = "offer";
      let targetProductId: string | undefined = undefined;

      // ── STRATEGY 1: Cart Items (Highest Conversion Intent) ──
      const cartItem = user.cart?.items?.[0];
      if (cartItem && cartItem.variant?.product) {
        const product = cartItem.variant.product;
        targetProductId = product.id;
        targetTitle = `⚡ Limited Offer on items in your Cart!`;
        targetMessage = `"${product.name}" in your cart is currently available at factory-direct pricing. Complete your order today before stock sells out!`;
        targetLink = `/product/${product.slug}`;
        targetType = "offer";
      }

      // ── STRATEGY 2: Wishlist Items (High Purchase Interest) ──
      else if (userWishlist && userWishlist.length > 0) {
        const wishItem = userWishlist[0].product;
        targetProductId = wishItem.id;
        targetTitle = `🎁 Special Deal on your Wishlist Item!`;
        targetMessage = `Exclusive contractor discount now active on "${wishItem.name}". Tap to view today's special offer!`;
        targetLink = `/product/${wishItem.slug}`;
        targetType = "offer";
      }

      // ── STRATEGY 3: Cross-Sell based on Recent Purchases ──
      else if (user.orders && user.orders.length > 0 && user.orders[0].items?.length > 0) {
        const lastOrderItem = user.orders[0].items[0];
        // Find product category
        const prod = lastOrderItem.productId
          ? await prisma.product.findUnique({ where: { id: lastOrderItem.productId } })
          : null;
        const catSlug = prod?.categorySlug || "tiles-stone";
        const complement = CROSS_SELL_MAP[catSlug] || CROSS_SELL_MAP["tiles-stone"];

        targetTitle = `🛠️ Complete your ${prod?.name ? prod.name.split(" ")[0] : "Project"}!`;
        targetMessage = `${complement.pitch} at wholesale contractor rates. Delivered directly to your site!`;
        targetLink = `/shop?category=${complement.categorySlug}`;
        targetType = "promo";
      }

      // ── STRATEGY 4: Recently Viewed Products / New Listing Alert ──
      else if (user.recentlyViewed && user.recentlyViewed.length > 0) {
        const viewedProduct = user.recentlyViewed[0].product;
        targetProductId = viewedProduct.id;
        targetTitle = `✨ Price Alert & New Stocks!`;
        targetMessage = `Fresh inventory and new sizes just arrived for "${viewedProduct.name}". Check it out now!`;
        targetLink = `/product/${viewedProduct.slug}`;
        targetType = "new_arrival";
      }

      // ── STRATEGY 5: Default Fallback New Listings / Deals ──
      else {
        const trendingProduct = await prisma.product.findFirst({
          where: { inStock: true, isTrending: true },
        });
        targetTitle = `🔥 Today's Top Builder Offer!`;
        targetMessage = trendingProduct
          ? `Special wholesale pricing on "${trendingProduct.name}". Direct factory delivery guaranteed!`
          : `Explore new construction arrivals and bulk contractor discounts on IntriHub today!`;
        targetLink = trendingProduct ? `/product/${trendingProduct.slug}` : `/shop`;
        targetType = "offer";
      }

      // 1. Save to Database Notification Table
      const dbNotification = await prisma.notification.create({
        data: {
          userId,
          title: targetTitle,
          message: targetMessage,
          type: targetType,
          link: targetLink,
          isRead: false,
        },
      });

      // 2. Dispatch Mobile Push Notifications to registered devices
      let pushSent = false;
      if (userPushTokens && userPushTokens.length > 0) {
        pushSent = await this.sendExpoPushNotifications(
          userPushTokens.map((t: any) => t.token),
          targetTitle,
          targetMessage,
          { link: targetLink, notificationId: dbNotification.id, productId: targetProductId }
        );
      }

      return {
        userId,
        title: targetTitle,
        message: targetMessage,
        type: targetType,
        link: targetLink,
        productId: targetProductId,
        pushSent,
        dbSaved: Boolean(dbNotification.id),
      };
    } catch (error) {
      console.error(`Personalized notification failed for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Run batch personalized campaign across all active customers
   */
  static async runBatchPersonalizedCampaign(limit = 50): Promise<TargetedNotificationResult[]> {
    try {
      const activeUsers = await prisma.user.findMany({
        where: { role: "customer" },
        select: { id: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      const results: TargetedNotificationResult[] = [];
      for (const u of activeUsers) {
        const res = await this.generateAndSendForUser(u.id);
        if (res) results.push(res);
      }

      return results;
    } catch (error) {
      console.error("Batch personalized campaign failed:", error);
      return [];
    }
  }

  /**
   * Send Native Push via Expo Push Notification API
   */
  private static async sendExpoPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    const validTokens = pushTokens.filter(
      (t) => t && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
    );

    if (validTokens.length === 0) return false;

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: data || {},
      badge: 1,
      channelId: "promotions",
    }));

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (res.ok) {
        const resultData = await res.json();
        return resultData?.data?.some((ticket: any) => ticket.status === "ok") || false;
      }
      return false;
    } catch (err) {
      console.warn("Expo push delivery error:", err);
      return false;
    }
  }
}
