import Constants from "expo-constants";

// In production / preview, points to live Intrihub server (www domain to avoid 301 redirects).
// In local dev, can be overridden via EXPO_PUBLIC_API_URL in .env
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://www.intrihub.com";

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  Constants.expoConfig?.extra?.socketUrl ||
  API_BASE_URL;

export const RAZORPAY_KEY_ID =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
  "rzp_live_default";

export const APP_VERSION = "1.0.0";
export const SUPPORT_PHONE = "9264920211";
export const SUPPORT_CALL_URL = "tel:9264920211";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/919264920211?text=Hello%20Intrihub%20Support";

export function getImageUrl(
  imagePath?: string | null,
  fallback = "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600"
): string {
  if (!imagePath) return fallback;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}
