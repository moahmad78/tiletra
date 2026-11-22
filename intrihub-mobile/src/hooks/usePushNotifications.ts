import { useEffect, useRef } from "react";
import { Platform, Linking, AppState, AppStateStatus } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useRouter } from "expo-router";
import { registerPushToken } from "../api/push";
import { useAuthStore } from "../store/authStore";

// Check if running inside Expo Go
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import("expo-notifications") | null = null;
let cachedCustomerPushToken: string | null = null;

if (!isExpoGo && Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn("[PushNotifications] Could not initialize notification handler:", err);
  }
}

/**
 * Unregister push token from backend upon user logout.
 */
export async function unregisterCustomerPushToken(): Promise<void> {
  const token = cachedCustomerPushToken;
  if (!token) return;

  try {
    const { unregisterPushToken } = await import("../api/push");
    await unregisterPushToken(token);
    cachedCustomerPushToken = null;
    console.log("⚡ [PushNotifications] Customer push token unregistered successfully on logout");
  } catch (err: any) {
    console.warn("⚠️ [PushNotifications] Error unregistering customer push token on logout:", err?.message);
  }
}

/**
 * Explicit token registration helper called after successful login and on app launch.
 * Enforces that user is authenticated before sending token to backend.
 */
export async function registerCustomerPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || isExpoGo || !Notifications) {
    return null;
  }

  const user = useAuthStore.getState().user;
  if (!user?.id) {
    // Never attempt remote registration while unauthenticated
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      "7c786f97-0217-4a68-b51f-14499a3311a2";

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    if (tokenData?.data) {
      cachedCustomerPushToken = tokenData.data;
      await registerPushToken(tokenData.data, Platform.OS);
      console.log("⚡ [PushNotifications] Customer push token registered:", tokenData.data.slice(-6));
      return tokenData.data;
    }
  } catch (err: any) {
    console.warn("[PushNotifications] Failed to register customer push token:", err?.message);
  }

  return null;
}

export function usePushNotifications() {
  const router = useRouter();
  const { user } = useAuthStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === "web" || isExpoGo || !Notifications) {
      return;
    }

    const notif = Notifications;

    async function initChannels() {
      if (Platform.OS === "android") {
        try {
          const importanceMax = notif.AndroidImportance.MAX;
          const importanceDefault = notif.AndroidImportance.DEFAULT;

          // PRD v1 Versioned User Channels
          await notif.setNotificationChannelAsync("user_success_v1", {
            name: "Order Confirmations & Deliveries",
            description: "Notifications for placed, accepted, and successfully delivered orders",
            importance: importanceMax,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#10B981",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("user_alert_v1", {
            name: "Order & Payment Alerts",
            description: "Alerts for payment failures, cancellations, delays, and refunds",
            importance: importanceMax,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: "#EF4444",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("user_arrival_v1", {
            name: "Delivery Partner Arriving",
            description: "Live tracking alerts when partner is out for delivery or arriving soon",
            importance: importanceMax,
            vibrationPattern: [0, 300, 150, 300],
            lightColor: "#F26522",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("user_promo_v1", {
            name: "Discounts & Exclusive Offers",
            description: "Personalized promotions, price drops, and cart reminders",
            importance: importanceDefault,
            lightColor: "#F26522",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("default_v1", {
            name: "General Updates & Support",
            description: "Support replies, review requests, and account updates",
            importance: importanceDefault,
            lightColor: "#6B7280",
            sound: "default",
          });

          // Legacy Channels for compatibility
          await notif.setNotificationChannelAsync("orders_high_importance", {
            name: "Order Updates",
            importance: importanceMax,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#F26522",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("reminders_default", {
            name: "Cart Reminders",
            importance: importanceDefault,
            vibrationPattern: [0, 250, 250],
            lightColor: "#F26522",
            sound: "default",
          });

          await notif.setNotificationChannelAsync("offers_default", {
            name: "Exclusive Offers & Discounts",
            importance: importanceDefault,
            vibrationPattern: [0, 250],
            lightColor: "#F26522",
            sound: "default",
          });
        } catch (e) {
          console.warn("[PushNotifications] Channel setup error:", e);
        }
      }
    }

    initChannels();

    // Register token if user is authenticated
    if (user?.id) {
      registerCustomerPushToken().catch(() => {});
    }

    // Re-register when app comes back to foreground
    const appStateSub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active" && useAuthStore.getState().user?.id) {
        registerCustomerPushToken().catch(() => {});
      }
    });

    const handleNotificationResponse = (response: any) => {
      try {
        const data = response?.notification?.request?.content?.data;

        // Report notification open to backend for audit & analytics
        if (data?.logId) {
          import("../api/client").then(({ apiClient }) => {
            apiClient.post("/api/mobile/notifications/open", { logId: data.logId }).catch(() => {});
          }).catch(() => {});
        }

        if (data?.storeUrl || data?.type === "app_update") {
          const targetUrl = data.storeUrl || data.webUrl || "market://details?id=com.intrihub.app";
          Linking.openURL(String(targetUrl)).catch(() => {
            if (data?.webUrl) {
              Linking.openURL(String(data.webUrl)).catch(() => {});
            }
          });
          return;
        }

        const target = data?.target || "";
        if (target === "cart") {
          router.push("/cart" as Parameters<typeof router.push>[0]);
        } else if (target.startsWith("item:")) {
          const itemId = target.replace(/^item:/, "").trim();
          router.push(`/product/${itemId}` as Parameters<typeof router.push>[0]);
        } else if (target.startsWith("category:")) {
          const catId = target.replace(/^category:/, "").trim();
          router.push(`/category/${catId}` as Parameters<typeof router.push>[0]);
        } else if (target.startsWith("order:")) {
          const ordId = target.replace(/^order:/, "").trim();
          router.push(`/order/${ordId}` as Parameters<typeof router.push>[0]);
        } else if (data?.orderId || data?.id) {
          const rawOrderId = data.orderId || data.id;
          const cleanOrderId = String(rawOrderId).replace(/^[#\s]+/, "").trim();
          router.push(`/order/${cleanOrderId}` as Parameters<typeof router.push>[0]);
        } else if (data?.productId) {
          router.push(`/product/${String(data.productId).trim()}` as Parameters<typeof router.push>[0]);
        } else if (data?.screen) {
          router.push(String(data.screen) as Parameters<typeof router.push>[0]);
        } else {
          router.push("/" as Parameters<typeof router.push>[0]);
        }
      } catch (e) {
        console.warn("[PushNotifications] Error handling notification response:", e);
      }
    };

    try {
      notificationListener.current = notif.addNotificationReceivedListener((notification: any) => {
        console.log("Customer foreground push notification received:", notification);
      });

      responseListener.current = notif.addNotificationResponseReceivedListener(handleNotificationResponse);

      // Handle cold-start tap when customer app was killed
      notif.getLastNotificationResponseAsync()
        .then((lastResponse: any) => {
          if (lastResponse) {
            console.log("⚡ [PushNotifications] Cold start tap detected:", lastResponse);
            handleNotificationResponse(lastResponse);
          }
        })
        .catch((err: any) => console.warn("Failed to check customer last notification response:", err));
    } catch (err) {
      console.warn("[PushNotifications] Could not attach notification listeners:", err);
    }

    return () => {
      appStateSub.remove();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id, router]);
}
