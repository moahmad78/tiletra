import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { useRouter } from "expo-router";
import { apiClient } from "../api/client";
import { useAuthStore } from "../store/authStore";

const isExpoGo =
  isRunningInExpoGo() ||
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// expo-notifications Android push notifications were removed from Expo Go in SDK 53+.
// Statically importing expo-notifications crashes Expo Go on Android at runtime.
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

export function usePushNotifications() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Skip entirely in Expo Go (remote push notifications require a custom dev build)
    if (isExpoGo || !Notifications) return;
    if (!isAuthenticated || !user) return;

    registerForPushNotificationsAsync().then((pushToken) => {
      if (pushToken) {
        apiClient
          .post("/api/mobile/push-token", {
            token: pushToken,
            platform: Platform.OS,
          })
          .catch((err) => console.log("Failed to register push token with backend:", err));
      }
    });

    // 1. Notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Push notification received in foreground:", notification);
      }
    );

    // 2. Notification response received (user tapped notification from Lock Screen / Tray)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Push notification tapped by user:", response);
        const data = response.notification.request.content.data;
        if (data?.storeUrl || data?.type === "app_update") {
          const targetUrl = data.storeUrl || data.webUrl || "market://details?id=com.intrihub.business";
          require("react-native").Linking.openURL(targetUrl).catch(() => {
            if (data?.webUrl) {
              require("react-native").Linking.openURL(data.webUrl).catch(() => {});
            }
          });
          return;
        }
        if (data && data.screen) {
          try {
            if (data.id) {
              router.push({ pathname: data.screen, params: { id: data.id } } as any);
            } else {
              router.push(data.screen as any);
            }
          } catch (e) {
            console.error("Error deep-linking from push notification:", e);
          }
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user?.id]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Notifications || Platform.OS === "web") {
    return null;
  }
  let pushToken: string | null = null;

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: (Notifications as any).AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F26522",
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
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenObj = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    pushToken = tokenObj.data;
  } catch {
    // In development or when offline
  }

  return pushToken;
}
