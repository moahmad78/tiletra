import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Search, ShoppingBag, MapPin, ChevronDown } from "lucide-react-native";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
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
  const { selectedAddress } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  const addressLabel = selectedAddress
    ? `${selectedAddress.city} - ${selectedAddress.pincode}`
    : "Select Delivery Location";

  return (
    <View style={styles.container}>
      {/* Top Bar: Brand + Location + Cart */}
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
          <MapPin size={13} color={COLORS.accent} />
          <Text style={styles.locationText} numberOfLines={1}>
            {addressLabel}
          </Text>
          <ChevronDown size={13} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Cart Icon with badge */}
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push("/(tabs)/cart")}
          activeOpacity={0.8}
        >
          <ShoppingBag size={22} color={COLORS.textWhite} />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Trigger Bar */}
      {showSearch && (
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={onSearchPress || (() => router.push("/(tabs)/categories"))}
        >
          <Search size={18} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search tiles, sanitaries, paints, adhesives...
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  brandContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  brandLogo: {
    width: 110,
    height: 28,
  },
  locationPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    marginRight: 10,
  },
  locationText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: "600",
    marginHorizontal: 4,
    flexShrink: 1,
  },
  cartButton: {
    position: "relative",
    padding: 6,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});
