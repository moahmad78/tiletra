import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Package,
  Tag,
  Info,
  CheckCheck,
  ChevronRight,
  Truck,
  Check,
  Sparkles,
} from "lucide-react-native";
import { useNotificationStore } from "../src/store/notificationStore";
import { AppNotification } from "../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { getImageUrl } from "../src/constants/config";

// Helper for relative timestamps
function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

// ── Flipkart-Style Thumbnail with Corner Indicator Badge ──
function NotificationThumbnail({ item }: { item: AppNotification }) {
  const [hasError, setHasError] = useState(false);

  const isOrder =
    item.type === "order" ||
    item.type === "order_status" ||
    item.type === "order_placed" ||
    Boolean(item.orderId);

  const isPromo =
    item.type === "offer" ||
    item.type === "promo" ||
    item.type === "discount";

  const renderFallbackIcon = () => {
    if (isOrder) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "rgba(5, 42, 81, 0.08)" }]}>
          <Package size={22} color={COLORS.primary} />
        </View>
      );
    }
    if (isPromo) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: "rgba(242, 101, 34, 0.1)" }]}>
          <Tag size={22} color={COLORS.accentOrange} />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { backgroundColor: "rgba(5, 150, 105, 0.1)" }]}>
        <Info size={22} color="#059669" />
      </View>
    );
  };

  const renderMiniBadge = () => {
    if (isOrder) {
      const lowerText = `${item.title || ""} ${item.message || ""}`.toLowerCase();
      const isDelivered = lowerText.includes("delivered");
      const isDispatched = lowerText.includes("dispatched") || lowerText.includes("out for delivery");

      if (isDelivered) {
        return (
          <View style={[styles.miniBadge, { backgroundColor: "#10B981" }]}>
            <Check size={9} color="#FFFFFF" strokeWidth={3} />
          </View>
        );
      }
      if (isDispatched) {
        return (
          <View style={[styles.miniBadge, { backgroundColor: "#3B82F6" }]}>
            <Truck size={9} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        );
      }
      return (
        <View style={[styles.miniBadge, { backgroundColor: COLORS.primary }]}>
          <Package size={9} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      );
    }

    if (isPromo) {
      return (
        <View style={[styles.miniBadge, { backgroundColor: COLORS.accentOrange }]}>
          <Tag size={9} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      );
    }

    return (
      <View style={[styles.miniBadge, { backgroundColor: "#059669" }]}>
        <Info size={9} color="#FFFFFF" strokeWidth={2.5} />
      </View>
    );
  };

  if (item.image && !hasError) {
    return (
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{ uri: getImageUrl(item.image) }}
          style={styles.thumbnailImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          onError={() => setHasError(true)}
        />
        {renderMiniBadge()}
      </View>
    );
  }

  return (
    <View style={styles.thumbnailWrapper}>
      {renderFallbackIcon()}
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);

    const link = (item.link || "").trim();
    const textToScan = `${item.title || ""} ${item.message || ""} ${link}`;

    // ── 1. SPECIFIC ORDER PRIORITY (Flipkart: Order clicks go straight to Order Details) ──
    // A) If orderId was directly resolved by the backend
    if (item.orderId && item.orderId !== "null" && item.orderId !== "undefined") {
      const cleanOrderId = item.orderId.replace(/^[#\s]+/, "").trim();
      if (cleanOrderId) {
        router.push({
          pathname: "/order/[id]",
          params: { id: cleanOrderId },
        });
        return;
      }
    }

    // B) If link points to a specific order (e.g. /order/IH-138885 or /orders/ORD-123456)
    const orderLinkMatch = link.match(/\/orders?\/([a-zA-Z0-9_-]+)/i);
    if (orderLinkMatch && orderLinkMatch[1]) {
      const cleanId = orderLinkMatch[1].replace(/^[#\s]+/, "").trim();
      const nonIds = ["all", "account", "history", "null", "undefined", "list"];
      if (cleanId && !nonIds.includes(cleanId.toLowerCase())) {
        router.push({
          pathname: "/order/[id]",
          params: { id: cleanId },
        });
        return;
      }
    }

    // C) Scan title and message for order ID (e.g. Order #IH-138885, Order #ORD-387512, #IH-123456)
    const textOrderMatch = textToScan.match(/(?:Order\s*#?|#)([A-Za-z0-9_-]+)/i);
    if (textOrderMatch && textOrderMatch[1]) {
      const cleanId = textOrderMatch[1].replace(/^[#\s]+/, "").trim();
      const nonIds = [
        "updated", "confirmed", "placed", "delivered", "cancelled",
        "canceled", "processing", "dispatched", "refunded", "order", "status"
      ];
      if (cleanId && !nonIds.includes(cleanId.toLowerCase()) && cleanId.length >= 3) {
        router.push({
          pathname: "/order/[id]",
          params: { id: cleanId },
        });
        return;
      }
    }

    // ── 2. PRODUCT PRIORITY (Flipkart: Product deal clicks go straight to PDP) ──
    if (item.productId && item.productId !== "null" && item.productId !== "undefined") {
      router.push({
        pathname: "/product/[id]",
        params: { id: item.productId },
      });
      return;
    }

    const productLinkMatch = link.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
    if (productLinkMatch && productLinkMatch[1]) {
      const cleanProd = productLinkMatch[1].trim();
      if (cleanProd && !["all", "null", "undefined"].includes(cleanProd.toLowerCase())) {
        router.push({
          pathname: "/product/[id]",
          params: { id: cleanProd },
        });
        return;
      }
    }

    // ── 3. CATEGORY / COLLECTION PRIORITY ──
    const catLinkMatch =
      link.match(/\/categor(?:y|ies)\/([a-zA-Z0-9_-]+)/i) ||
      link.match(/[?&]category=([a-zA-Z0-9_-]+)/i);
    if (catLinkMatch && catLinkMatch[1]) {
      router.push({
        pathname: "/category/[slug]",
        params: { slug: catLinkMatch[1] },
      });
      return;
    }

    // ── 4. APP TAB & SECTION ROUTES ──
    if (link.includes("/cart") || link.includes("/checkout")) {
      router.push("/(tabs)/cart" as any);
      return;
    }
    if ((link.includes("/profile") || link.includes("/account")) && !link.includes("/orders")) {
      router.push("/(tabs)/profile" as any);
      return;
    }
    if (link.includes("/support") || link.includes("/help")) {
      router.push("/support" as any);
      return;
    }
    if (link.includes("/wishlist")) {
      router.push("/wishlist" as any);
      return;
    }
    if (
      link.includes("/orders") ||
      item.type === "order_status" ||
      item.type === "order" ||
      item.type === "order_placed"
    ) {
      router.push("/(tabs)/orders" as any);
      return;
    }
    if (
      link.includes("/shop") ||
      link.includes("/categories") ||
      link.includes("/deals") ||
      link.includes("/offers") ||
      item.type === "offer" ||
      item.type === "promo" ||
      item.type === "discount"
    ) {
      router.push("/(tabs)/categories" as any);
      return;
    }
    if (item.type === "support") {
      router.push("/support" as any);
      return;
    }

    // Default safe fallback
    router.push("/(tabs)/home" as any);
  };

  const getActionLabel = (item: AppNotification) => {
    const isOrder =
      item.type === "order" ||
      item.type === "order_status" ||
      item.type === "order_placed" ||
      Boolean(item.orderId);
    if (isOrder) return "Track order";
    if (item.productId || item.type === "offer" || item.type === "promo") return "View deal";
    return "View details";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: AppNotification) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchNotifications}
          refreshing={isLoading}
          renderItem={({ item }: { item: AppNotification }) => (
            <TouchableOpacity
              style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              {/* Left Flipkart-Style Thumbnail or Icon */}
              <NotificationThumbnail item={item} />

              {/* Right Content */}
              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                    <Text
                      style={[styles.cardTitle, !item.isRead && styles.unreadTitle]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {(item.title?.toLowerCase().includes("scheduled") ||
                      item.message?.toLowerCase().includes("scheduled")) && (
                      <View style={styles.scheduledBadge}>
                        <Text style={styles.scheduledBadgeText}>SCHEDULED</Text>
                      </View>
                    )}
                  </View>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.cardMessage} numberOfLines={3}>
                  {item.message}
                </Text>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                  <View style={styles.viewLinkRow}>
                    <Text style={styles.viewLinkText}>{getActionLabel(item)}</Text>
                    <ChevronRight size={13} color={COLORS.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Bell size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySub}>
                You're all caught up! Order status changes, delivery updates, and exclusive offers will appear here.
              </Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: COLORS.accentOrange,
    fontWeight: "700",
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  markAllText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "flex-start",
  },
  unreadCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "rgba(5, 42, 81, 0.16)",
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    marginRight: 12,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  miniBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentOrange,
    marginLeft: 6,
  },
  scheduledBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  scheduledBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardMessage: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  viewLinkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
