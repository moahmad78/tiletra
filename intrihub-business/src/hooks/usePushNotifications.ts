import { useEffect, useRef } from "react";
import { Platform, AppState, AppStateStatus, Linking } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Application from "expo-application";
import { isRunningInExpoGo } from "expo";
import { useRouter } from "expo-router";
import { apiClient } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useOrderAlertStore, OrderAlertData } from "../store/orderAlertStore";
import { useNotificationStore } from "../store/notificationStore";

const isExpoGo =
  isRunningInExpoGo() ||
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import("expo-notifications") | null = null;
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
    console.warn("Could not set notification handler:", err);
  }
}

const EAS_PROJECT_ID = "107f8b28-48ac-4c6a-b065-8d24f2427724";

// In-memory cache of current token for logout cleanup
let cachedPushToken: string | null = null;

export function getStoredPushToken(): string | null {
  return cachedPushToken;
}

// Order alert deduplication cache (prevents duplicate alarms within 60s if socket also fired)
const recentlyAlertedOrders = new Map<string, number>();

export function triggerOrderAlertSafely(data: OrderAlertData) {
  if (!data?.orderId) return;
  const now = Date.now();
  const lastTime = recentlyAlertedOrders.get(data.orderId);
  if (lastTime && now - lastTime < 60000) {
    console.log(`[OrderAlert] Duplicate alert for order #${data.orderId} skipped (socket/push dedupe)`);
    return;
  }
  recentlyAlertedOrders.set(data.orderId, now);

  try {
    useOrderAlertStore.getState().triggerAlert(data);
  } catch (e) {
    console.error("Error triggering order alert modal:", e);
  }
}

/**
 * Registers device push token with backend with exponential backoff (3 attempts).
 */
export async function registerDevicePushToken(attempt = 1): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return null;

  cachedPushToken = token;

  try {
    const appVersion =
      Application.nativeApplicationVersion ||
      Constants.expoConfig?.version ||
      "1.0.36";

    const res = await apiClient.post("/api/mobile/push-token", {
      token,
      platform: Platform.OS,
      appVersion,
    });

    if (res.data?.success) {
      console.log("⚡ [Push Notifications] Push token successfully registered on server:", token.slice(-6));
      return token;
    } else {
      throw new Error(res.data?.error || "Registration returned non-success");
    }
  } catch (err: any) {
    console.warn(`⚠️ [Push Notifications] Attempt ${attempt}/3 failed to register push token:`, err?.message);
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
      await new Promise((r) => setTimeout(r, delay));
      return registerDevicePushToken(attempt + 1);
    }
  }

  return token;
}

/**
 * Unregisters device push token on logout.
 */
export async function unregisterDevicePushToken(): Promise<void> {
  const token = cachedPushToken;
  if (!token) return;

  try {
    await apiClient.delete("/api/mobile/push-token", {
      data: { token },
    });
    cachedPushToken = null;
    console.log("⚡ [Push Notifications] Push token unregistered successfully on logout");
  } catch (err: any) {
    console.warn("⚠️ [Push Notifications] Error unregistering push token on logout:", err?.message);
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isExpoGo || !Notifications) return;
    if (!isAuthenticated || !user) return;

    // 1. Initial registration on mount
    registerDevicePushToken().catch(() => {});

    // 2. Re-register when app returns to foreground from background/lock
    const appStateSub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active" && isAuthenticated && user) {
        registerDevicePushToken().catch(() => {});
      }
    });

    // 3. Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Push notification received in foreground:", notification);
      const data = (notification.request.content.data || {}) as Record<string, any>;
      const isAutoAccepted = data?.isAutoAccepted === true || data?.type === "ORDER_AUTO_ACCEPTED";
      const requiresManualApproval =
        data?.requiresManualApproval === true || data?.type === "PENDING_VENDOR_APPROVAL";

      if (data?.orderId || data?.id) {
        const targetOrderId = String(data.orderId || data.id);
        triggerOrderAlertSafely({
          orderId: targetOrderId,
          splitId: data.splitId ? String(data.splitId) : undefined,
          customerName: data.customerName ? String(data.customerName) : undefined,
          totalAmount: data.amount || data.totalAmount ? Number(data.amount || data.totalAmount) : undefined,
          isAutoAccepted,
          requiresManualApproval,
          warning: data.warning ? String(data.warning) : undefined,
        });

        try {
          if (data.id) {
            router.push({ pathname: (data.screen as any) || "/(vendor)/orders", params: { id: String(data.id) } } as any);
          } else if (data.screen) {
            router.push(data.screen as any);
          }
        } catch (e) {
          console.error("Error deep-linking foreground push notification:", e);
        }
      }

      // Add to notification store for unread badge count
      try {
        useNotificationStore.getState().addNotification({
          title:
            notification.request.content.title ||
            (requiresManualApproval ? "New Order Received! 🛍️" : "Store Notification"),
          body:
            notification.request.content.body ||
            (data?.orderId ? `Order #${data.orderId} update` : "You have a new update."),
          orderId: data?.orderId ? String(data.orderId) : data?.id ? String(data.id) : undefined,
          amount: data?.amount || data?.totalAmount ? `₹${data.amount || data.totalAmount}` : undefined,
          type: requiresManualApproval ? "approval_required" : isAutoAccepted ? "auto_accepted" : "general",
          accentColor: requiresManualApproval ? "#EF4444" : "#3B82F6",
        });
      } catch (e) {
        console.warn("Failed to add notification to notificationStore:", e);
      }
    });

    const handleNotificationResponse = (response: any) => {
      console.log("Push notification response handled:", response);
      const data = (response?.notification?.request?.content?.data || {}) as Record<string, any>;

      // Handle App Update link
      if (data?.storeUrl || data?.type === "app_update") {
        const targetUrl = String(data.storeUrl || data.webUrl || "market://details?id=com.intrihub.business");
        Linking.openURL(targetUrl).catch(() => {
          if (data?.webUrl) {
            Linking.openURL(String(data.webUrl)).catch(() => {});
          }
        });
        return;
      }

      // If it's an order notification, trigger the in-app alert modal & alarm upon entering
      if (data?.orderId || data?.id) {
        const targetOrderId = String(data.orderId || data.id);
        const isAutoAccepted = data?.isAutoAccepted === true || data?.type === "ORDER_AUTO_ACCEPTED";
        const requiresManualApproval =
          data?.requiresManualApproval === true || data?.type === "PENDING_VENDOR_APPROVAL";

        triggerOrderAlertSafely({
          orderId: targetOrderId,
          splitId: data.splitId ? String(data.splitId) : undefined,
          customerName: data.customerName ? String(data.customerName) : undefined,
          totalAmount: data.amount || data.totalAmount ? Number(data.amount || data.totalAmount) : undefined,
          isAutoAccepted,
          requiresManualApproval,
          warning: data.warning ? String(data.warning) : undefined,
        });

        try {
          if (data.id) {
            router.push({ pathname: (data.screen as any) || "/(vendor)/orders", params: { id: String(data.id) } } as any);
          } else if (data.screen) {
            router.push(data.screen as any);
          } else {
            router.push("/(vendor)/orders" as any);
          }
        } catch (e) {
          console.error("Error navigating from push response:", e);
        }
      } else if (data?.screen) {
        try {
          router.push(data.screen as any);
        } catch (e) {
          console.error("Error deep-linking from push notification:", e);
        }
      }
    };

    // 4. User tapped notification in system tray (from Lock Screen, Background, or Killed state)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // 5. Handle cold-start tap when app was killed
    Notifications.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (lastResponse) {
          console.log("⚡ [Push Notifications] Cold start notification tap detected:", lastResponse);
          handleNotificationResponse(lastResponse);
        }
      })
      .catch((err) => console.warn("Failed to check last notification response:", err));

    return () => {
      appStateSub.remove();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user?.id]);
}

/**
 * Sets up Android notification channels and acquires the Expo Push Token.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Notifications || Platform.OS === "web") {
    return null;
  }
  let pushToken: string | null = null;

  if (Platform.OS === "android") {
    try {
      const importanceMax = (Notifications as any).AndroidImportance?.MAX ?? 5;
      const importanceHigh = (Notifications as any).AndroidImportance?.HIGH ?? 4;
      const importanceDefault = (Notifications as any).AndroidImportance?.DEFAULT ?? 3;
      const visibilityPublic = (Notifications as any).AndroidNotificationVisibility?.PUBLIC ?? 1;

      // Dedicated App Update Channel with official company ringtone
      await Notifications.setNotificationChannelAsync("app_update_ring_v1", {
        name: "App Updates & Releases",
        description: "IntriHub Business app update reminders with official ringtone",
        importance: importanceMax,
        vibrationPattern: [0, 350, 200, 350],
        enableVibrate: true,
        sound: "ring.mp3",
        lockscreenVisibility: visibilityPublic,
        lightColor: "#003478",
        showBadge: true,
      });

      // PRD v1 Versioned Vendor Channels
      await Notifications.setNotificationChannelAsync("new_order_ring_v1", {
        name: "New Orders High Alert (Loud Ring)",
        description: "Plays loud ringing siren for incoming new orders requiring acceptance",
        importance: importanceMax,
        vibrationPattern: [0, 800, 400, 800, 400, 800],
        enableVibrate: true,
        sound: "ring.mp3",
        lockscreenVisibility: visibilityPublic,
        bypassDnd: true,
        lightColor: "#EF4444",
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("order_reminder_v1", {
        name: "Order Reminders & Deadlines",
        description: "Reminders for pending orders close to expiry or scheduled dispatch",
        importance: importanceMax,
        vibrationPattern: [0, 500, 250, 500],
        enableVibrate: true,
        sound: "default",
        lockscreenVisibility: visibilityPublic,
        lightColor: "#F59E0B",
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("order_warning_v1", {
        name: "Order Warnings & Cancellations",
        description: "Alerts for cancelled, expired, or delayed orders and return requests",
        importance: importanceHigh,
        vibrationPattern: [0, 400, 200, 400],
        enableVibrate: true,
        sound: "default",
        lockscreenVisibility: visibilityPublic,
        lightColor: "#EF4444",
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("money_success_v1", {
        name: "Payouts & Settlements",
        description: "Notifications when vendor payouts and settlements are processed",
        importance: importanceDefault,
        vibrationPattern: [0, 250, 250],
        enableVibrate: true,
        sound: "default",
        lightColor: "#10B981",
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("default_chime_v1", {
        name: "Store & System Updates",
        description: "Catalog approvals, reviews, promotions, and system announcements",
        importance: importanceDefault,
        sound: "default",
        lightColor: "#3B82F6",
        showBadge: true,
      });

      // Legacy fallback channels
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: importanceMax,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        sound: "default",
        lightColor: "#F26522",
      });

      await Notifications.setNotificationChannelAsync("orders_high_importance", {
        name: "Incoming Orders High Alert",
        importance: importanceMax,
        vibrationPattern: [0, 800, 400, 800, 400, 800],
        enableVibrate: true,
        sound: "ring.mp3",
        lockscreenVisibility: visibilityPublic,
        bypassDnd: true,
        lightColor: "#F26522",
        showBadge: true,
      });
    } catch (e) {
      console.warn("Could not create notification channel:", e);
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      EAS_PROJECT_ID;

    const tokenObj = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    pushToken = tokenObj.data;
    console.log("⚡ [Push Notifications] Successfully generated Expo Push Token:", pushToken.slice(-6));
  } catch (tokenErr) {
    console.warn("⚠️ [Push Notifications] Could not obtain Expo push token:", tokenErr);
  }

  return pushToken;
}
