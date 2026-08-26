import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Bell, MapPin, ChevronDown } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { AnimatedSearchPlaceholder } from "./AnimatedSearchPlaceholder";

interface HeaderProps {
  showSearch?: boolean;
  onSearchPress?: () => void;
  onAddressPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showSearch = true,
  onSearchPress,
  onAddressPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedAddress, isAuthenticated } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Periodic Shake / Ring animation when unreadCount > 0
  useEffect(() => {
    if (unreadCount <= 0) {
      shakeAnim.setValue(0);
      return;
    }

    const runShakeBurst = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -16, duration: 75, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 16, duration: 75, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    };

    // Trigger initial burst
    runShakeBurst();

    // Repeat every 3.5 seconds
    const interval = setInterval(runShakeBurst, 3500);
    return () => {
      clearInterval(interval);
      shakeAnim.setValue(0);
    };
  }, [unreadCount]);

  const addressLabel = selectedAddress
    ? `${selectedAddress.city} - ${selectedAddress.pincode}`
    : "Select Delivery Location";

  const topPadding = Math.max(
    insets.top + (Platform.OS === "android" ? 6 : 4),
    Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 14
  );

  const bellColor = unreadCount > 0 ? COLORS.accentOrange : COLORS.primary;

  return (
    <View style={styles.outerContainer}>
      {/* Ensure dark status bar icons on top white canvas */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF", "#F0F5FA", "#0C3C6E", "#052A51"]}
        locations={[0, 0.46, 0.58, 0.86, 1.0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradientContainer, { paddingTop: topPadding }]}
      >
        {/* Top Solid White Zone: Logo + Location + Notification Bell */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => router.push("/(tabs)/home")}
            activeOpacity={0.85}
          >
            <Image
              source={require("../../assets/intri-web-logo.png")}
              style={styles.brandLogo}
              contentFit="contain"
              transition={150}
            />
          </TouchableOpacity>

          {/* Location Selector Pill */}
          <TouchableOpacity
            style={styles.locationPill}
            onPress={onAddressPress || (() => router.push("/(tabs)/profile"))}
            activeOpacity={0.8}
          >
            <MapPin size={13} color={COLORS.accentOrange} />
            <Text style={styles.locationText} numberOfLines={1}>
              {addressLabel}
            </Text>
            <ChevronDown size={13} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Notification Bell Icon with unread count badge + Shake Animation */}
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/notifications" as any)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.notifIconWrapper,
                unreadCount > 0 && styles.notifIconWrapperActive,
              ]}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: shakeAnim.interpolate({
                        inputRange: [-16, 16],
                        outputRange: ["-16deg", "16deg"],
                      }),
                    },
                  ],
                }}
              >
                <Bell size={21} color={bellColor} />
              </Animated.View>

              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Trigger Bar (Sitting in Navy Zone) */}
        {showSearch && (
          <TouchableOpacity
            style={[styles.searchBar, SHADOWS.sm]}
            activeOpacity={0.9}
            onPress={
              onSearchPress ||
              (() =>
                router.push({
                  pathname: "/(tabs)/categories",
                  params: { autoFocus: "true" },
                } as any))
            }
          >
            <Search size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <AnimatedSearchPlaceholder />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: "#FFFFFF",
  },
  gradientContainer: {
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  brandContainer: {
    marginRight: 6,
    justifyContent: "center",
  },
  brandLogo: {
    width: 114,
    height: 32,
  },
  locationPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.07)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.12)",
  },
  locationText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    marginHorizontal: 4,
    flexShrink: 1,
  },
  notifButton: {
    padding: 4,
  },
  notifIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifIconWrapperActive: {
    backgroundColor: "rgba(242, 101, 34, 0.08)",
    borderColor: "rgba(242, 101, 34, 0.2)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 9.5,
    fontWeight: "900",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
});
