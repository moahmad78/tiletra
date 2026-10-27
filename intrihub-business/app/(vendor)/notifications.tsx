import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  CheckCheck,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { fetchVendorOrders } from "../../src/api/vendor";
import RotatingOrderItemImage from "../../src/components/RotatingOrderItemImage";
import {
  useNotificationStore,
  NotificationItem,
} from "../../src/store/notificationStore";

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: ordersData } = useQuery({
    queryKey: ["vendor-orders", "all"],
    queryFn: () => fetchVendorOrders("all"),
  });
  const orders = ordersData?.orders || [];
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    initNotifications,
  } = useNotificationStore();

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  const handleAccept = (item: NotificationItem) => {
    markAsRead(item.id);
    Alert.alert(
      "Order Accepted",
      `Order #${item.orderId || "item"} accepted successfully! Inventory allocated.`
    );
    removeNotification(item.id);
  };

  const handleReject = (item: NotificationItem) => {
    markAsRead(item.id);
    Alert.alert(
      "Order Rejected",
      `Order #${item.orderId || "item"} marked as out of stock.`
    );
    removeNotification(item.id);
  };

  const handleOpenOrder = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.orderId) {
      router.push({
        pathname: "/(vendor)/orders",
        params: { orderId: item.orderId },
      } as any);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to remove all alerts?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => clearAll() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread · ${notifications.length} alerts`
              : `${notifications.length} alerts · all caught up`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadBtn}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <CheckCheck size={16} color="#0284C7" />
              <Text style={styles.markAllReadText}>Read All</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No pending notifications or alerts right now.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.92}
              onPress={() => handleOpenOrder(item)}
              style={[
                styles.notifCard,
                { borderLeftColor: item.accentColor },
                item.isRead && styles.notifCardRead,
              ]}
            >
              {/* Card Top Row: App Icon + App Name + Badge + Unread Indicator + Timestamp */}
              <View style={styles.cardTopRow}>
                <View style={styles.iconWrapper}>
                  <Image
                    source={require("../../assets/intri-icon.png")}
                    style={styles.appIcon}
                    resizeMode="contain"
                  />
                  {/* Small icon overlay at bottom-right of app icon */}
                  {item.iconOverlay === "bell" && (
                    <View
                      style={[
                        styles.iconOverlayBadge,
                        { backgroundColor: "#F97316" },
                      ]}
                    >
                      <Bell size={8} color="#FFFFFF" />
                    </View>
                  )}
                  {item.iconOverlay === "clock" && (
                    <View
                      style={[
                        styles.iconOverlayBadge,
                        { backgroundColor: "#EAB308" },
                      ]}
                    >
                      <Clock size={8} color="#FFFFFF" />
                    </View>
                  )}
                  {item.iconOverlay === "user" && (
                    <View
                      style={[
                        styles.iconOverlayBadge,
                        { backgroundColor: "#10B981" },
                      ]}
                    >
                      <User size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.appNameContainer}>
                  <Text style={styles.appName}>IntriHub Business</Text>
                  {item.badge && (
                    <View style={styles.urgentBadge}>
                      <Text
                        style={[
                          styles.urgentBadgeText,
                          { color: item.badge.color },
                        ]}
                      >
                        {item.badge.icon} {item.badge.text}
                      </Text>
                    </View>
                  )}
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* Card Content Row: Title + Body + Rotating Item Thumbnail */}
              {(() => {
                const matchedOrder = orders.find(
                  (o: any) => o.orderId === item.orderId || o.splitId === item.orderId
                );
                const itemImages =
                  item.images && item.images.length > 0
                    ? item.images
                    : matchedOrder?.images ||
                      (matchedOrder?.items
                        ? matchedOrder.items.flatMap((it: any) => it.images || (it.image ? [it.image] : []))
                        : item.image
                        ? [item.image]
                        : []);

                return (
                  <View style={styles.cardBodyContainer}>
                    {(item.orderId || (itemImages && itemImages.length > 0)) ? (
                      <View style={{ marginRight: 10, alignSelf: "flex-start", marginTop: 2 }}>
                        <RotatingOrderItemImage
                          images={itemImages}
                          fallbackImage={item.image}
                          size={52}
                          borderRadius={10}
                        />
                      </View>
                    ) : null}

                    <View
                      style={{
                        flex: 1,
                        paddingRight: item.actions?.type === "chevron" ? 8 : 0,
                      }}
                    >
                      <Text
                        style={[
                          styles.cardTitle,
                          item.isRead && styles.cardTitleRead,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.cardBody}>{item.body}</Text>
                    </View>

                    {item.actions?.type === "chevron" && (
                      <View style={styles.chevronWrapper}>
                        <ChevronRight size={18} color="#94A3B8" />
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Action Buttons: 2 Buttons (Reject / Accept) */}
              {item.actions?.type === "two_buttons" && (
                <View style={styles.twoButtonsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rejectBtnText}>
                      {item.actions.secondaryText || "Reject"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.acceptBtnText}>
                      {item.actions.primaryText || "Accept"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button: Single Button (View Order & Pack) */}
              {item.actions?.type === "single_button" && (
                <TouchableOpacity
                  style={styles.singleBtn}
                  onPress={() => handleOpenOrder(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.singleBtnText}>
                    {item.actions.primaryText}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: "PlusJakartaSans_400Regular",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollList: {
    padding: 16,
    gap: 14,
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4.5,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  notifCardRead: {
    backgroundColor: "#F8FAFC",
    opacity: 0.85,
    borderLeftWidth: 3,
    shadowOpacity: 0.02,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconWrapper: {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  appIcon: {
    width: 34,
    height: 34,
  },
  iconOverlayBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  appNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 6,
  },
  appName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  urgentBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  timestamp: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: "PlusJakartaSans_400Regular",
  },
  cardBodyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cardTitleRead: {
    color: "#475569",
    fontWeight: "600",
  },
  cardBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  chevronWrapper: {
    paddingLeft: 4,
  },
  twoButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#052A51",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  singleBtn: {
    width: "100%",
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  singleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "PlusJakartaSans_400Regular",
  },
});
