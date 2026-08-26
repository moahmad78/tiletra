import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, ShoppingBag, MapPin, ChevronDown } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

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
  const { selectedAddress } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  const addressLabel = selectedAddress
    ? `${selectedAddress.city} - ${selectedAddress.pincode}`
    : "Select Delivery Location";

  const topPadding = Math.max(
    insets.top + (Platform.OS === "android" ? 6 : 4),
    Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 14
  );

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F1F6FB", "#0A3B6F", "#052A51"]}
      locations={[0, 0.32, 0.72, 1.0]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, { paddingTop: topPadding }]}
    >
      {/* Top Row: Logo + Delivery Location + Cart */}
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

        {/* Cart Icon with badge */}
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push("/(tabs)/cart")}
          activeOpacity={0.8}
        >
          <View style={styles.cartIconWrapper}>
            <ShoppingBag size={21} color={COLORS.primary} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Trigger Bar */}
      {showSearch && (
        <TouchableOpacity
          style={[styles.searchBar, SHADOWS.sm]}
          activeOpacity={0.9}
          onPress={onSearchPress || (() => router.push("/(tabs)/categories"))}
        >
          <Search size={18} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search tiles, sanitaries, paints, adhesives...
          </Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
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
  cartButton: {
    padding: 4,
  },
  cartIconWrapper: {
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
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginLeft: 9,
    flex: 1,
    fontWeight: "500",
  },
});
