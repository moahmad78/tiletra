import { useEffect, useRef } from "react";
import { Platform, Linking } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useRouter } from "expo-router";
import { registerPushToken } from "../api/push";
import { useAuthStore } from "../store/authStore";

// Check if running inside Expo Go
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Dynamically reference expo-notifications to prevent Expo Go SDK 53+ crash on top-level import
let Notifications: typeof import("expo-notifications") | null = null;

// Only require expo-notifications when NOT running in Expo Go and not on web
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

export function usePushNotifications() {
  const router = useRouter();
  const { user } = useAuthStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Remote push notifications were removed from Expo Go in SDK 53+.
    // They also do not function on web, emulators/simulators, or when Notifications is unavailable.
    // Standalone development & production builds (EAS builds) work normally.
    if (Platform.OS === "web" || isExpoGo || !Notifications) {
      if (__DEV__ && isExpoGo) {
        console.log(
          "[PushNotifications] Expo Go detected: remote push notifications are disabled. Use an EAS development build for push notification testing."
        );
      }
      return;
    }

    const notif = Notifications;

    async function setupNotifications() {
      try {
        const { status: existingStatus } = await notif!.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await notif!.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;

        if (!projectId) {
          console.warn("[PushNotifications] EAS projectId not found — skipping push token registration.");
          return;
        }

        const tokenData = await notif!.getExpoPushTokenAsync({
          projectId,
        });

        if (tokenData?.data) {
          await registerPushToken(tokenData.data, Platform.OS);
        }

        if (Platform.OS === "android") {
          await notif!.setNotificationChannelAsync("orders", {
            name: "Order Updates",
            importance: notif!.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#052a51",
          });
        }
      } catch (err) {
        console.warn("[PushNotifications] Could not register push notifications:", err);
      }
    }

    setupNotifications();

    try {
      notificationListener.current = notif.addNotificationReceivedListener((notification: any) => {
        console.log("Customer foreground push notification received:", notification);
      });

      responseListener.current = notif.addNotificationResponseReceivedListener((response: any) => {
        try {
          const data = response?.notification?.request?.content?.data;
          if (data?.storeUrl || data?.type === "app_update") {
            const targetUrl = data.storeUrl || data.webUrl || "market://details?id=com.intrihub.app";
            Linking.openURL(String(targetUrl)).catch(() => {
              if (data?.webUrl) {
                Linking.openURL(String(data.webUrl)).catch(() => {});
              }
            });
          } else if (data?.orderId) {
            const cleanOrderId = String(data.orderId).replace(/^[#\s]+/, "").trim();
            router.push(`/order/${cleanOrderId}` as Parameters<typeof router.push>[0]);
          } else if (data?.productId) {
            router.push(`/product/${String(data.productId).trim()}` as Parameters<typeof router.push>[0]);
          } else if (data?.screen) {
            router.push(String(data.screen) as Parameters<typeof router.push>[0]);
          } else if (data?.link && typeof data.link === "string") {
            const cleanLink = data.link.trim();
            const orderMatch = cleanLink.match(/\/orders?\/([a-zA-Z0-9_-]+)/i);
            const prodMatch = cleanLink.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
            if (orderMatch && orderMatch[1]) {
              router.push(`/order/${orderMatch[1]}` as Parameters<typeof router.push>[0]);
            } else if (prodMatch && prodMatch[1]) {
              router.push(`/product/${prodMatch[1]}` as Parameters<typeof router.push>[0]);
            } else {
              router.push("/notifications" as Parameters<typeof router.push>[0]);
            }
          }
        } catch (e) {
          console.warn("[PushNotifications] Error handling notification response:", e);
        }
      });
    } catch (err) {
      console.warn("[PushNotifications] Could not attach notification listeners:", err);
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch {
        // safe cleanup
      }
    };
  }, [user?.id, router]);
}
