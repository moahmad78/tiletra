import { useEffect, useState, useLayoutEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../src/store/authStore";
import { useCartStore } from "../src/store/cartStore";
import { useNotificationStore } from "../src/store/notificationStore";
import { socketService } from "../src/store/socketStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import AnimatedSplashScreen from "../src/components/AnimatedSplashScreen";
import { COLORS } from "../src/constants/theme";

// Keep native splash screen visible while app JS bundle loads
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { user, initAuth } = useAuthStore();
  const { loadCart } = useCartStore();
  const [isAppReady, setIsAppReady] = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);

  usePushNotifications();

  // Hide the native OS splash screen immediately on React Native mount so Layer 2 AnimatedSplashScreen takes over
  useLayoutEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    async function prepareApp() {
      try {
        await Promise.all([
          initAuth(),
          loadCart(),
          useNotificationStore.getState().fetchUnreadCount().catch(() => {}),
          // Minimum natural sequence duration so user experiences the active running road and intro
          new Promise((resolve) => setTimeout(resolve, 2200)),
        ]);
      } catch (e) {
        console.warn("Error during app initialization:", e);
      } finally {
        // Signal animated splash to perform its smooth 300ms exit transition
        setIsAppReady(true);
      }
    }

    prepareApp();
  }, []);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);

      const unsubOrder = socketService.subscribe("order-status-updated", () => {
        useNotificationStore.getState().fetchUnreadCount();
        useNotificationStore.getState().fetchNotifications();
      });

      const unsubNotif = socketService.subscribe("notification", (data: any) => {
        useNotificationStore.getState().incrementUnreadCount();
        if (data?.notification) {
          useNotificationStore.getState().addNewNotification(data.notification);
        } else {
          useNotificationStore.getState().fetchNotifications();
        }
      });

      return () => {
        unsubOrder();
        unsubNotif();
        socketService.disconnect();
      };
    }
  }, [user?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.rootContainer}>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: "modal" }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="wishlist" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        </Stack>

        {/* Animated Quick-Commerce Splash Screen Layer */}
        {splashMounted && (
          <AnimatedSplashScreen
            isAppReady={isAppReady}
            onAnimationFinish={() => setSplashMounted(false)}
          />
        )}
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
