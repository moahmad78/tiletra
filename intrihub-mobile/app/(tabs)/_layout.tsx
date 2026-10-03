import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Grid, ShoppingBag, User, Package } from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";
import { useCartStore } from "../../src/store/cartStore";
import { useTranslation } from "../../src/store/i18nStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const { t } = useTranslation();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tabs
      backBehavior="firstRoute"
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
          title: t("nav.home") || "Home",
          tabBarIcon: ({ color, size }: { color: any; size?: number }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("nav.categories") || "Shop",
          tabBarIcon: ({ color, size }: { color: any; size?: number }) => <Grid size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("nav.orders") || "Orders",
          tabBarIcon: ({ color, size }: { color: any; size?: number }) => <Package size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("nav.cart") || "Cart",
          tabBarBadge: cartItemCount > 0 ? (cartItemCount > 99 ? "99+" : cartItemCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.accentOrange,
            color: COLORS.textWhite,
            fontSize: 10,
            fontWeight: "800",
          },
          tabBarIcon: ({ color, size }: { color: any; size?: number }) => <ShoppingBag size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.account") || "Account",
          tabBarIcon: ({ color, size }: { color: any; size?: number }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
