import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../src/store/authStore";
import { useCartStore } from "../src/store/cartStore";
import { useNotificationStore } from "../src/store/notificationStore";
import { socketService } from "../src/store/socketStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { COLORS } from "../src/constants/theme";

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

  usePushNotifications();

  useEffect(() => {
    initAuth();
    loadCart();
  }, []);

  useEffect(() => {
    socketService.connect(user?.id);

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
  }, [user?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
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
    </QueryClientProvider>
  );
}
