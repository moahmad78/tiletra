/**
 * IntriHub Deep-Link Whitelist Validator
 *
 * Enforces server-side validation and sanitization of campaign targets,
 * notification clicks, and in-app popup actions against strictly allowed patterns.
 *
 * Allowed Patterns:
 * 1. Simple routes: 'offers', 'cart', 'shop', 'home'
 * 2. Prefix routes:
 *    - 'category:<id_or_slug>'
 *    - 'item:<id_or_slug>'
 *    - 'product:<id_or_slug>'
 *    - 'order:<id_or_order_number>'
 * 3. Web relative routes:
 *    - '/offers', '/cart', '/category/*', '/product/*', '/order/*'
 * 4. App Schemes:
 *    - 'intrihub://*'
 *    - 'intrihub-biz://*'
 * 5. Official App Store URLs:
 *    - 'market://details?id=com.intrihub.*'
 *    - 'https://play.google.com/store/apps/details?id=com.intrihub.*'
 *    - 'https://apps.apple.com/*'
 */

export interface ValidationResult {
  valid: boolean;
  sanitizedTarget: string;
  normalizedDeepLink: string;
  error?: string;
}

const ALLOWED_EXACT_TARGETS = new Set([
  "offers",
  "cart",
  "shop",
  "home",
  "profile",
  "orders",
  "inventory",
  "earnings",
  "checkout",
]);

const ALLOWED_STORE_PATTERNS = [
  /^market:\/\/details\?id=com\.intrihub\.(app|business)$/i,
  /^https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.intrihub\.(app|business).*$/i,
  /^https:\/\/apps\.apple\.com\/.+$/i,
];

export function validateCampaignDeepLink(target: string | null | undefined): ValidationResult {
  if (!target || typeof target !== "string") {
    return {
      valid: false,
      sanitizedTarget: "",
      normalizedDeepLink: "intrihub://offers",
      error: "Target URL or route is required.",
    };
  }

  const trimmed = target.trim();

  // 1. Security Check: Block dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:")
  ) {
    return {
      valid: false,
      sanitizedTarget: "",
      normalizedDeepLink: "intrihub://offers",
      error: "Dangerous URL scheme detected.",
    };
  }

  // 2. Check exact permitted keywords
  if (ALLOWED_EXACT_TARGETS.has(lower)) {
    return {
      valid: true,
      sanitizedTarget: lower,
      normalizedDeepLink: `intrihub://${lower}`,
    };
  }

  // 3. Check colon prefixes (category:ID, product:ID, item:ID, order:ID)
  const colonMatch = trimmed.match(/^(category|product|item|order):([a-zA-Z0-9_-]+)$/i);
  if (colonMatch) {
    const [, prefix, id] = colonMatch;
    const cleanPrefix = prefix.toLowerCase() === "item" ? "product" : prefix.toLowerCase();
    return {
      valid: true,
      sanitizedTarget: `${cleanPrefix}:${id}`,
      normalizedDeepLink: `intrihub://${cleanPrefix}/${id}`,
    };
  }

  // 4. Check web relative paths (/category/..., /product/..., /order/...)
  if (trimmed.startsWith("/")) {
    const relativeClean = trimmed.replace(/\/+/g, "/");
    // Validate path segments
    const pathMatch = relativeClean.match(
      /^\/(offers|cart|shop|profile|orders?|categories?|products?|items?)(\/([a-zA-Z0-9_-]+))?$/i
    );
    if (pathMatch) {
      const route = pathMatch[1].toLowerCase();
      const id = pathMatch[3];
      const deepLink = id ? `intrihub://${route}/${id}` : `intrihub://${route}`;
      return {
        valid: true,
        sanitizedTarget: relativeClean,
        normalizedDeepLink: deepLink,
      };
    }
  }

  // 5. Check app custom schemes (intrihub://... or intrihub-biz://...)
  if (trimmed.startsWith("intrihub://") || trimmed.startsWith("intrihub-biz://")) {
    const scheme = trimmed.startsWith("intrihub-biz://") ? "intrihub-biz://" : "intrihub://";
    const pathPart = trimmed.slice(scheme.length);
    const subValidation = validateCampaignDeepLink(pathPart.startsWith("/") ? pathPart : `/${pathPart}`);
    if (subValidation.valid) {
      return {
        valid: true,
        sanitizedTarget: trimmed,
        normalizedDeepLink: `${scheme}${pathPart.replace(/^\//, "")}`,
      };
    }
  }

  // 6. Check official Play Store & App Store links
  for (const pattern of ALLOWED_STORE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: true,
        sanitizedTarget: trimmed,
        normalizedDeepLink: trimmed,
      };
    }
  }

  // Reject anything else
  return {
    valid: false,
    sanitizedTarget: "",
    normalizedDeepLink: "intrihub://offers",
    error: `Invalid deep-link target: "${trimmed}". Allowed patterns are: offers, cart, shop, category:<id>, product:<id>, order:<id>, or official store URLs.`,
  };
}
