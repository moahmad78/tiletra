import React, { useEffect, Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
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
import { socketService } from "../src/store/socketStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import AnimatedSplashScreen from "../src/components/AnimatedSplashScreen";
import AppUpdateModal from "../src/components/AppUpdateModal";
import * as Sentry from "@sentry/react-native";
import { COLORS } from "../src/constants/theme";

// Initialize Sentry crash reporting at the earliest point in the lifecycle
Sentry.init({
  dsn: "https://1cbe738f4586b8e9bb9d55840396ee51@o4512085765521408.ingest.us.sentry.io/4512085786558464",
  tracesSampleRate: 1.0,
  debug: false,
});

// Keep native splash screen visible while app JS bundle loads
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 3, // 3 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Intrihub Business uncaught error:", error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar style="light" />
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            An unexpected error occurred. You can restart the app or retry now.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRestart}
            activeOpacity={0.85}
          >
            <Text style={styles.retryButtonText}>Reload Portal</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const { user, initAuth } = useAuthStore();
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [splashMounted, setSplashMounted] = React.useState(true);
  usePushNotifications();

  React.useLayoutEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function prepare() {
      try {
        await Promise.all([
          initAuth().catch((err) => console.warn("Auth init error:", err)),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch (err) {
        console.warn("Prepare error:", err);
      } finally {
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    }

    prepare();
    return () => {
      isMounted = false;
    };
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
    <RootErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
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

          {/* In-App Update Popup & Notification Dispatcher */}
          <AppUpdateModal />

          {/* Animated Quick-Commerce Splash Screen Layer (Option B) */}
          {splashMounted && (
            <AnimatedSplashScreen
              isAppReady={isAppReady}
              onAnimationFinish={() => setSplashMounted(false)}
            />
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
