import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { registerPushToken } from "../api/push";
import { useAuthStore } from "../store/authStore";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function usePushNotifications() {
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Android remote push notifications were removed from Expo Go in SDK 53+.
    // They operate automatically in standalone development & production builds.
    if (Platform.OS === "web" || isExpoGo) {
      return;
    }

    async function setupNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });

        if (tokenData?.data) {
          await registerPushToken(tokenData.data, Platform.OS);
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("orders", {
            name: "Order Updates",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#052a51",
          });
        }
      } catch (err) {
        console.warn("Could not register push notifications:", err);
      }
    }

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Foreground notification handler
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Notification tapped handler (can route to order detail)
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        // Handled in router
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);
}
