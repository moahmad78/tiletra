import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Store } from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";

export default function VendorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accentOrange,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => <Wallet size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Store Profile",
          tabBarIcon: ({ color, size }) => <Store size={size - 2} color={color} />,
        }}
      />

      {/* Hidden Screens inside the Vendor Group */}
      <Tabs.Screen
        name="product-form"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vendor-order/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
