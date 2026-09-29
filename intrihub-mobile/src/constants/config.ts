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

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  "";

export const APP_VERSION: string =
  (Constants.expoConfig?.version as string | undefined) ??
  "1.1.9";

export const APP_VERSION_CODE: number =
  (Constants.expoConfig?.android?.versionCode as number | undefined) ??
  12;

export const PACKAGE_NAME = "com.intrihub.app";
export const SUPPORT_PHONE = "7090120211";
export const SUPPORT_CALL_URL = "tel:7090120211";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/917090120211?text=Hello%20Intrihub%20Support";

export function getImageUrl(
  imagePath?: string | null,
  fallback = `${API_BASE_URL}/images/placeholder-product.svg`
): string {
  if (!imagePath) return fallback;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}
