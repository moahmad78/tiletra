import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react-native";
import { getOrders } from "../../src/api/orders";
import { useAuthStore } from "../../src/store/authStore";
import { socketService } from "../../src/store/socketStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { Order } from "../../src/types";

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["mobile-customer-orders", user?.id],
    queryFn: () => getOrders(),
    enabled: isAuthenticated,
  });

  // Listen to live Socket.IO events
  useEffect(() => {
    const unsubscribe = socketService.subscribe("order-status-updated", (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ["mobile-customer-orders"] });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("deliver")) return COLORS.accentGreen;
    if (s.includes("dispatch") || s.includes("ship")) return COLORS.accentBlue;
    if (s.includes("cancel")) return COLORS.accentRed;
    return COLORS.accentOrange; // processing / confirmed
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Package size={56} color={COLORS.primary} />
        <Text style={styles.authPromptTitle}>Sign In to View Orders</Text>
        <Text style={styles.authPromptSub}>
          Track your shipments, check order history, and download invoices
        </Text>
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.signInText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => {
            const firstItem = item.items?.[0];
            const statusColor = getStatusColor(item.orderStatus);

            return (
              <TouchableOpacity
                style={[styles.orderCard, SHADOWS.sm]}
                activeOpacity={0.85}
                onPress={() => router.push(`/order/${item.id}`)}
              >
                {/* Order Top Bar */}
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderIdText}>Order #{item.id}</Text>
                    <Text style={styles.orderDateText}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.orderStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Items Preview */}
                <View style={styles.itemRow}>
                  {firstItem?.image ? (
                    <Image
                      source={{ uri: firstItem.image }}
                      style={styles.thumbImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.placeholderThumb}>
                      <Package size={20} color={COLORS.textMuted} />
                    </View>
                  )}

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemTitleText} numberOfLines={1}>
                      {firstItem?.productName || "Order Items"}
                    </Text>
                    <Text style={styles.itemDetailsText}>
                      {item.items?.length || 1} Item(s) • Total: ₹{item.total.toLocaleString("en-IN")}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Package size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>When you place an order, it will appear here</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push("/(tabs)/home")}
              >
                <Text style={styles.browseText}>Browse Catalog</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  listContent: {
    padding: SPACING.lg,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  orderDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbImage: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  placeholderThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  itemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  itemDetailsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: 60,
  },
  authPromptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 16,
  },
  authPromptSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  signInText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  browseText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
