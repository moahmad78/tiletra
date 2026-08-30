import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Grid, ShoppingBag, User, ScanLine } from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";
import { useCartStore } from "../../src/store/cartStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <Grid size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={[styles.fabButton, focused && styles.fabButtonActive]}>
              <ScanLine size={24} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: cartItemCount > 0 ? (cartItemCount > 99 ? "99+" : cartItemCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.accentOrange,
            color: COLORS.textWhite,
            fontSize: 10,
            fontWeight: "800",
          },
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <ShoppingBag size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: COLORS.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonActive: {
    backgroundColor: COLORS.accentOrange,
  },
});
