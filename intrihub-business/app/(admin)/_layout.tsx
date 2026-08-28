import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import { withLayoutContext, useRouter } from "expo-router";
import { TabNavigationState, ParamListBase } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  ShieldAlert,
  LayoutDashboard,
  Store,
  Clock,
  Package,
  CheckSquare,
  Layers,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  Users,
  MessageSquare,
  Tag,
  Layout,
  Settings,
  User,
} from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function AdminSwipeableTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      {/* Universal Top Admin Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/intri-icon.png")}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={{ marginLeft: 10 }}>
            <View style={styles.adminBadge}>
              <ShieldAlert size={11} color="#FFFFFF" />
              <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
            </View>
            <Text style={styles.headerTitle}>Intrihub Central Console</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/(admin)/profile" as any)}
          activeOpacity={0.85}
        >
          <User size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Swipeable Material Top Tabs */}
      <MaterialTopTabs
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: "auto",
            paddingHorizontal: 14,
            height: 44,
          },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "#F26522",
            height: 3,
            borderRadius: 2,
          },
          tabBarActiveTintColor: "#052A51",
          tabBarInactiveTintColor: "#64748B",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "800",
            textTransform: "none",
          },
          swipeEnabled: true,
          lazy: true,
        }}
      >
        <MaterialTopTabs.Screen
          name="dashboard"
          options={{
            title: "Overview",
          }}
        />
        <MaterialTopTabs.Screen
          name="vendors"
          options={{
            title: "Vendors",
          }}
        />
        <MaterialTopTabs.Screen
          name="vendor-applications"
          options={{
            title: "Applications",
          }}
        />
        <MaterialTopTabs.Screen
          name="products"
          options={{
            title: "Products",
          }}
        />
        <MaterialTopTabs.Screen
          name="product-approvals"
          options={{
            title: "Approvals",
          }}
        />
        <MaterialTopTabs.Screen
          name="categories"
          options={{
            title: "Categories",
          }}
        />
        <MaterialTopTabs.Screen
          name="products-bulk"
          options={{
            title: "Bulk Import",
          }}
        />
        <MaterialTopTabs.Screen
          name="orders"
          options={{
            title: "Orders",
          }}
        />
        <MaterialTopTabs.Screen
          name="deliveries"
          options={{
            title: "Logistics",
          }}
        />
        <MaterialTopTabs.Screen
          name="users"
          options={{
            title: "Users",
          }}
        />
        <MaterialTopTabs.Screen
          name="reviews"
          options={{
            title: "Reviews",
          }}
        />
        <MaterialTopTabs.Screen
          name="coupons"
          options={{
            title: "Coupons",
          }}
        />
        <MaterialTopTabs.Screen
          name="content"
          options={{
            title: "CMS / Banners",
          }}
        />
        <MaterialTopTabs.Screen
          name="settings"
          options={{
            title: "Settings",
          }}
        />
        <MaterialTopTabs.Screen
          name="profile"
          options={{
            title: "Profile",
          }}
        />

        {/* Hidden detail sub-routes */}
        <MaterialTopTabs.Screen
          name="vendor/[id]"
          options={{
            tabBarItemStyle: { display: "none" },
          }}
        />
        <MaterialTopTabs.Screen
          name="order/[id]"
          options={{
            tabBarItemStyle: { display: "none" },
          }}
        />
      </MaterialTopTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052A51",
  },
  topHeader: {
    backgroundColor: "#052A51",
    paddingTop: Platform.OS === "android" ? 44 : 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.35)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 2,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
