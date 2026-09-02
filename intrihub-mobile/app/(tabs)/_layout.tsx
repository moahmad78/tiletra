import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Grid, ShoppingBag, User } from "lucide-react-native";
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
