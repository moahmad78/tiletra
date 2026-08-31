import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "../src/store/authStore";
import { socketService } from "../src/store/socketStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { COLORS } from "../src/constants/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 3, // 3 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const { user, initAuth } = useAuthStore();
  usePushNotifications();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    }
    return () => {
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/apply-vendor" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/support" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/blocked" options={{ headerShown: false }} />
        <Stack.Screen name="(vendor)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
