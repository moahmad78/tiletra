import { Linking } from "react-native";
import { router } from "expo-router";

/**
 * Whitelist patterns permitted for deep links and campaign redirects.
 */
export const ALLOWED_DEEP_LINK_PATTERNS = [
  /^offers$/i,
  /^cart$/i,
  /^shop$/i,
  /^categories$/i,
  /^wishlist$/i,
  /^notifications$/i,
  /^category:([a-zA-Z0-9_-]+)$/i,
  /^item:([a-zA-Z0-9_-]+)$/i,
  /^product:([a-zA-Z0-9_-]+)$/i,
  /^order:([a-zA-Z0-9_-]+)$/i,
  /^market:\/\/.+/i,
  /^https?:\/\/.+/i,
];

/**
 * Normalizes input URL/target into a clean route or action.
 */
export function normalizeDeepLink(rawInput: string | null | undefined): string {
  if (!rawInput) return "/";

  let target = String(rawInput).trim();

  // Strip custom app schemes if present: intrihub:// or intrihub-biz://
  target = target.replace(/^(intrihub|intrihub-biz):\/\//i, "");

  // Remove leading slash if any
  target = target.replace(/^\/+/, "");

  return target;
}

/**
 * Validates whether the target matches the security whitelist.
 */
export function isWhitelistedTarget(target: string): boolean {
  if (!target) return false;
  return ALLOWED_DEEP_LINK_PATTERNS.some((pattern) => pattern.test(target));
}

/**
 * Single whitelist-based deep link handler used across:
 * 1. Push notification tap responses
 * 2. In-app popup/banner CTA clicks
 * 3. Cold launch initial deep links
 */
export function handleWhitelistedDeepLink(rawTarget: string | null | undefined): void {
  try {
    if (!rawTarget) {
      router.push("/" as any);
      return;
    }

    const raw = String(rawTarget).trim();

    // Check for Google Play Market or Web URLs
    if (/^market:\/\//i.test(raw) || /^https?:\/\/(play\.google\.com|www\.intrihub\.com)/i.test(raw)) {
      Linking.openURL(raw).catch((err) => {
        console.warn("[DeepLinkRouter] Failed to open external URL:", err);
      });
      return;
    }

    const clean = normalizeDeepLink(raw);

    if (clean === "cart" || clean === "(tabs)/cart") {
      router.push("/(tabs)/cart" as any);
      return;
    }

    if (clean === "shop" || clean === "categories" || clean === "(tabs)/categories") {
      router.push("/(tabs)/categories" as any);
      return;
    }

    if (clean === "wishlist") {
      router.push("/wishlist" as any);
      return;
    }

    if (clean === "notifications") {
      router.push("/notifications" as any);
      return;
    }

    if (clean === "offers" || clean === "(tabs)/home" || clean === "") {
      router.push("/(tabs)/home" as any);
      return;
    }

    // Pattern: category:slug or category/slug
    const catMatch = clean.match(/^category[:/]([a-zA-Z0-9_-]+)$/i);
    if (catMatch && catMatch[1]) {
      router.push(`/category/${catMatch[1]}` as any);
      return;
    }

    // Pattern: product:id or item:id or product/id
    const prodMatch = clean.match(/^(?:product|item)[:/]([a-zA-Z0-9_-]+)$/i);
    if (prodMatch && prodMatch[1]) {
      router.push(`/product/${prodMatch[1]}` as any);
      return;
    }

    // Pattern: order:id or order/id
    const orderMatch = clean.match(/^order[:/]([a-zA-Z0-9_-]+)$/i);
    if (orderMatch && orderMatch[1]) {
      const cleanOrderId = orderMatch[1].replace(/^[#\s]+/, "");
      router.push(`/order/${cleanOrderId}` as any);
      return;
    }

    // If it's a known internal route
    if (clean.startsWith("/")) {
      router.push(clean as any);
      return;
    }

    // Fallback safely to home
    console.warn(`[DeepLinkRouter] Unrecognized target "${raw}", navigating to home`);
    router.push("/" as any);
  } catch (err) {
    console.warn("[DeepLinkRouter] Navigation error:", err);
    try {
      router.push("/" as any);
    } catch (_) {}
  }
}
