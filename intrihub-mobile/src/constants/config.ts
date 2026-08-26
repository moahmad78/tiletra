import Constants from "expo-constants";

// In production / preview, points to live Intrihub server.
// In local dev, can be overridden via EXPO_PUBLIC_API_URL in .env
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://intrihub.com";

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  Constants.expoConfig?.extra?.socketUrl ||
  API_BASE_URL;

export const RAZORPAY_KEY_ID =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
  "rzp_live_default";

export const APP_VERSION = "1.0.0";
