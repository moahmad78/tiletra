import { useEffect, useState, useLayoutEffect } from "react";
import { View, StyleSheet, LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "../src/store/authStore";
import { useCartStore } from "../src/store/cartStore";
import { useNotificationStore } from "../src/store/notificationStore";
import { useLocationStore } from "../src/store/locationStore";
import { socketService } from "../src/store/socketStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import AnimatedSplashScreen from "../src/components/AnimatedSplashScreen";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import AppUpdateModal from "../src/components/AppUpdateModal";
import { COLORS } from "../src/constants/theme";

// Suppress non-fatal dev CLI connection warning from popping up on screen
LogBox.ignoreLogs([
  "Cannot connect to Expo CLI",
]);

// ─── Global JS Error Handler ──────────────────────────────────────────────────
declare const ErrorUtils: {
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
} | undefined;

if (typeof ErrorUtils !== "undefined" && ErrorUtils?.getGlobalHandler) {
  try {
    const defaultHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error("GLOBAL", error?.message, error?.stack);
      defaultHandler?.(error, isFatal);
    });
  } catch {
    // Ignore error handler initialization failure
  }
}

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
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

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
      const results = await Promise.allSettled([
        initAuth(),
        loadCart(),
        useNotificationStore.getState().fetchUnreadCount().catch(() => {}),
        useLocationStore.getState().prefetchLocation().catch(() => {}),
        // Minimum natural sequence duration so user experiences the active running road and intro
        new Promise((resolve) => setTimeout(resolve, 2200)),
      ]);
      // Log any unexpected failures for debugging
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.warn(`[prepareApp] task[${i}] failed:`, r.reason);
        }
      });
      // Signal animated splash to perform its smooth 300ms exit transition
      setIsAppReady(true);
    }

    prepareApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initAuth/loadCart are stable zustand actions; this runs once on mount

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);

      const unsubOrder = socketService.subscribe("order-status-updated", () => {
        useNotificationStore.getState().fetchUnreadCount();
        useNotificationStore.getState().fetchNotifications();
      });

      const unsubNotif = socketService.subscribe("notification", (data: Record<string, unknown>) => {
        useNotificationStore.getState().incrementUnreadCount();
        if (data?.notification) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useNotificationStore.getState().addNewNotification(data.notification as any);
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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <View style={styles.rootContainer}>
            <StatusBar style="dark" />
            <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="oauth" options={{ headerShown: false, animation: "none" }} />
            <Stack.Screen name="+not-found" options={{ headerShown: false, animation: "none" }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="wishlist" options={{ headerShown: false }} />
            <Stack.Screen name="support" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
          </Stack>

          {/* In-App Update Popup & Notification Dispatcher */}
          <AppUpdateModal />

          {/* Animated Quick-Commerce Splash Screen Layer */}
          {splashMounted && (
            <AnimatedSplashScreen
              isAppReady={isAppReady}
              onAnimationFinish={() => setSplashMounted(false)}
            />
          )}
        </View>
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
