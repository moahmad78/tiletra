import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  User,
} from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#052A51",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      }}
    >
      {/* 1. Overview */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={22} color={color} />,
        }}
      />

      {/* 2. Vendors Hub */}
      <Tabs.Screen
        name="vendors"
        options={{
          title: "Vendors",
          tabBarIcon: ({ color, size }) => <Store size={22} color={color} />,
        }}
      />

      {/* 3. Products Hub */}
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Package size={22} color={color} />,
        }}
      />

      {/* 4. Orders Hub */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <ShoppingCart size={22} color={color} />,
        }}
      />

      {/* 5. Account & Master Settings Hub */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />

      {/* Sub-screens registered in navigation tree but hidden from bottom tab bar */}
      <Tabs.Screen
        name="vendor/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vendor-applications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="product-approvals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="products-bulk"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
