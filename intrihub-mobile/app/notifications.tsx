import React, { useEffect } from "react";
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
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Package,
  Tag,
  Info,
  CheckCheck,
  ChevronRight,
} from "lucide-react-native";
import { useNotificationStore } from "../src/store/notificationStore";
import { AppNotification } from "../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";

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

    // If order link or order type
    if (item.link) {
      if (item.link.includes("/order/")) {
        const orderId = item.link.split("/order/")[1];
        if (orderId) {
          router.push({
            pathname: "/order/[id]",
            params: { id: orderId },
          });
          return;
        }
      }
      if (item.link.startsWith("/")) {
        router.push(item.link as any);
        return;
      }
    }

    // Check if title has order ID (e.g. Order #ORD-686411 or #cmt4...)
    const orderMatch = item.title.match(/#([a-zA-Z0-9_-]+)/i);
    if (orderMatch && orderMatch[1]) {
      router.push({
        pathname: "/order/[id]",
        params: { id: orderMatch[1] },
      });
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "order_status":
      case "order":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(5, 42, 81, 0.08)" }]}>
            <Package size={18} color={COLORS.primary} />
          </View>
        );
      case "offer":
      case "promo":
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(242, 101, 34, 0.1)" }]}>
            <Tag size={18} color={COLORS.accentOrange} />
          </View>
        );
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: "rgba(5, 150, 105, 0.1)" }]}>
            <Info size={18} color="#059669" />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
              activeOpacity={0.85}
            >
              {renderIcon(item.type)}

              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.cardTitle, !item.isRead && styles.unreadTitle]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.cardMessage} numberOfLines={3}>
                  {item.message}
                </Text>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                  {item.link ? (
                    <View style={styles.viewLinkRow}>
                      <Text style={styles.viewLinkText}>View details</Text>
                      <ChevronRight size={12} color={COLORS.primary} />
                    </View>
                  ) : null}
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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "rgba(5, 42, 81, 0.15)",
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    fontSize: 11,
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
