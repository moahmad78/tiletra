import React, { useEffect, Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
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
          <StatusBar style="light" backgroundColor={COLORS.primary} />
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const { user, initAuth } = useAuthStore();
  usePushNotifications();

  useEffect(() => {
    async function prepare() {
      try {
        await initAuth();
      } catch (err) {
        console.warn("Auth init error:", err);
      } finally {
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    }
    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  return (
    <RootErrorBoundary>
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
    </RootErrorBoundary>
  );
}

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
