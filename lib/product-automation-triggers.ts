import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications/service";

export interface ProductChangeSnapshot {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  vendorId?: string | null;
  previousInStock: boolean;
  previousPrice: number;
  newInStock: boolean;
  newPrice: number;
}

export interface AutomationTemplatesConfig {
  BACK_IN_STOCK?: {
    enabled?: boolean;
    title?: string;
    body?: string;
  };
  WISHLIST_PRICE_DROP?: {
    enabled?: boolean;
    title?: string;
    body?: string;
  };
}

const DEFAULT_TEMPLATES: Record<"BACK_IN_STOCK" | "WISHLIST_PRICE_DROP", { title: string; body: string }> = {
  BACK_IN_STOCK: {
    title: "Back in Stock: {{productName}}! 📦",
    body: "{{productName}} is back in stock. Order now before stock runs out!",
  },
  WISHLIST_PRICE_DROP: {
    title: "Price Drop on {{productName}}! 📉",
    body: "Good news! Price dropped from ₹{{oldPrice}} to ₹{{newPrice}}. Grab it today!",
  },
};

/**
 * Replace placeholders in template strings:
 * {{productName}}, {{oldPrice}}, {{newPrice}}, {{discountPercent}}
 */
function renderTemplate(
  template: string,
  vars: { productName: string; oldPrice: number; newPrice: number }
): string {
  const discountPercent =
    vars.oldPrice > vars.newPrice && vars.oldPrice > 0
      ? Math.round(((vars.oldPrice - vars.newPrice) / vars.oldPrice) * 100)
      : 0;

  return template
    .replace(/\{\{productName\}\}/g, vars.productName)
    .replace(/\{\{oldPrice\}\}/g, Math.round(vars.oldPrice).toLocaleString("en-IN"))
    .replace(/\{\{newPrice\}\}/g, Math.round(vars.newPrice).toLocaleString("en-IN"))
    .replace(/\{\{discountPercent\}\}/g, String(discountPercent));
}

/**
 * Central automation engine for Back in Stock and Price Drop notifications.
 * Triggered automatically by vendor and admin product updates.
 * - Targets users with the product in their Wishlist or active Cart
 * - Debounces per product per user (at most once every 24 hours)
 * - Enforces quiet hours, user preferences, and daily frequency caps via notify()
 */
export async function checkAndDispatchProductAutomations(
  snapshot: ProductChangeSnapshot
): Promise<{
  backInStockTriggered: boolean;
  priceDropTriggered: boolean;
  backInStockSent: number;
  priceDropSent: number;
  skippedCount: number;
}> {
  const result = {
    backInStockTriggered: false,
    priceDropTriggered: false,
    backInStockSent: 0,
    priceDropSent: 0,
    skippedCount: 0,
  };

  const {
    productId,
    productName,
    productSlug,
    productImage,
    previousInStock,
    previousPrice,
    newInStock,
    newPrice,
  } = snapshot;

  // 1. Determine trigger conditions
  const isBackInStock = !previousInStock && newInStock;
  const isPriceDrop = previousPrice > 0 && newPrice > 0 && newPrice < previousPrice;

  if (!isBackInStock && !isPriceDrop) {
    return result;
  }

  // 2. Fetch Store Automation Settings
  let backInStockEnabled = true;
  let priceDropEnabled = true;
  let customTemplates: AutomationTemplatesConfig = {};

  try {
    const settings = await prisma.storeSettings.findFirst({
      select: {
        backInStockEnabled: true,
        priceDropEnabled: true,
        automationTemplates: true,
      },
    });
    if (settings) {
      if (settings.backInStockEnabled !== undefined && settings.backInStockEnabled !== null) {
        backInStockEnabled = Boolean(settings.backInStockEnabled);
      }
      if (settings.priceDropEnabled !== undefined && settings.priceDropEnabled !== null) {
        priceDropEnabled = Boolean(settings.priceDropEnabled);
      }
      if (settings.automationTemplates) {
        customTemplates = settings.automationTemplates as AutomationTemplatesConfig;
      }
    }
  } catch (err) {
    console.warn("[ProductAutomations] Error reading store settings, using defaults:", err);
  }

  // Check template-specific enabled overrides
  if (customTemplates.BACK_IN_STOCK?.enabled !== undefined) {
    backInStockEnabled = backInStockEnabled && Boolean(customTemplates.BACK_IN_STOCK.enabled);
  }
  if (customTemplates.WISHLIST_PRICE_DROP?.enabled !== undefined) {
    priceDropEnabled = priceDropEnabled && Boolean(customTemplates.WISHLIST_PRICE_DROP.enabled);
  }

  // If neither rule is enabled or satisfied, exit early
  const shouldRunBackInStock = isBackInStock && backInStockEnabled;
  const shouldRunPriceDrop = isPriceDrop && priceDropEnabled && !shouldRunBackInStock; // Prioritize back in stock to avoid double ping

  if (!shouldRunBackInStock && !shouldRunPriceDrop) {
    return result;
  }

  result.backInStockTriggered = shouldRunBackInStock;
  result.priceDropTriggered = shouldRunPriceDrop;

  // 3. Find candidate user IDs (Wishlist + active Cart)
  const candidateUserIds = new Set<string>();

  try {
    // A. Users who saved this product to Wishlist
    const wishlistEntries = await prisma.wishlistItem.findMany({
      where: { productId },
      select: { userId: true },
    });
    wishlistEntries.forEach((w) => {
      if (w.userId) candidateUserIds.add(w.userId);
    });

    // B. Users who have this product in their active Cart
    const cartItems = await prisma.cartItem.findMany({
      where: { productId },
      select: {
        cart: {
          select: { userId: true },
        },
      },
    });
    cartItems.forEach((ci) => {
      if (ci.cart?.userId) candidateUserIds.add(ci.cart.userId);
    });
  } catch (err) {
    console.error("[ProductAutomations] Error querying wishlist/cart users:", err);
    return result;
  }

  if (candidateUserIds.size === 0) {
    return result;
  }

  // 4. Resolve templates & strings
  const targetType = shouldRunBackInStock ? "BACK_IN_STOCK" : "WISHLIST_PRICE_DROP";
  const rawTitleTemplate =
    customTemplates[targetType]?.title || DEFAULT_TEMPLATES[targetType].title;
  const rawBodyTemplate =
    customTemplates[targetType]?.body || DEFAULT_TEMPLATES[targetType].body;

  const title = renderTemplate(rawTitleTemplate, { productName, oldPrice: previousPrice, newPrice });
  const body = renderTemplate(rawBodyTemplate, { productName, oldPrice: previousPrice, newPrice });

  // 5. 24-Hour Debounce Check & Dispatch
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const userId of candidateUserIds) {
    try {
      const dedupeKey = `auto_${targetType}_${userId}_${productId}_${new Date().toISOString().slice(0, 10)}`;

      // Check if user was already notified about this product for this trigger in the past 24 hours
      const recentLog = await prisma.notificationLog.findFirst({
        where: {
          userId,
          type: targetType,
          createdAt: { gte: twentyFourHoursAgo },
          OR: [
            { id: dedupeKey },
            {
              payload: {
                path: ["productId"],
                equals: productId,
              },
            },
            {
              payload: {
                path: ["data", "productId"],
                equals: productId,
              },
            },
          ],
        },
      });

      if (recentLog) {
        result.skippedCount++;
        continue;
      }

      // Dispatch through central notification service
      // notify() automatically handles quiet hours, daily frequency caps, user preferences, and token delivery
      const dispatch = await notify({
        type: targetType,
        userId,
        title,
        body,
        deepLink: `intrihub://product/${productSlug || productId}`,
        imageUrl: productImage || null,
        dedupeKey,
        data: {
          productId,
          slug: productSlug,
          oldPrice: previousPrice,
          newPrice,
          productName,
        },
      });

      if (dispatch.status === "sent") {
        if (shouldRunBackInStock) result.backInStockSent++;
        if (shouldRunPriceDrop) result.priceDropSent++;
      } else {
        result.skippedCount++;
      }
    } catch (sendErr) {
      console.warn(`[ProductAutomations] Error dispatching to user ${userId}:`, sendErr);
      result.skippedCount++;
    }
  }

  return result;
}
