import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { apiClient } from "../api/client";
import { useAuthStore } from "../store/authStore";

// Configure in-app notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
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
  let pushToken: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F26522",
    });
  }

  if (Platform.OS !== "web") {
    // Expo Go (SDK 53+) removed remote push notifications for Android. Skip in Expo Go to avoid LogBox warning.
    if (Constants.appOwnership === "expo") {
      return null;
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
  }

  return pushToken;
}
