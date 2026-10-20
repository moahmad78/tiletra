import React, { useState } from "react";
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
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotificationItem {
  id: string;
  type: "approval_required" | "auto_accepted" | "unacknowledged" | "sla_warning" | "rider_arrived";
  accentColor: string;
  badge?: {
    icon: string;
    text: string;
    color: string;
  };
  iconOverlay?: "bell" | "clock" | "user";
  title: string;
  body: string;
  timestamp: string;
  orderId: string;
  amount?: string;
  actions?: {
    type: "two_buttons" | "single_button" | "chevron";
    primaryText?: string;
    secondaryText?: string;
  };
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "approval_required",
    accentColor: "#EF4444", // Red
    badge: {
      icon: "🔔",
      text: "Urgent",
      color: "#DC2626",
    },
    title: "Manual Order Approval Required!",
    body: "Order #ORD-8493 (₹12,400) requires manual approval. Stock check needed.",
    timestamp: "2m ago",
    orderId: "ORD-8493",
    amount: "₹12,400",
    actions: {
      type: "two_buttons",
      primaryText: "Accept",
      secondaryText: "Reject",
    },
  },
  {
    id: "notif-2",
    type: "auto_accepted",
    accentColor: "#3B82F6", // Blue
    title: "New Order Auto-Accepted!",
    body: "Order #ORD-8492 (₹4,850) auto-confirmed from inventory. Ready to pack!",
    timestamp: "2m ago",
    orderId: "ORD-8492",
    amount: "₹4,850",
    actions: {
      type: "single_button",
      primaryText: "View Order & Pack →",
    },
  },
  {
    id: "notif-3",
    type: "unacknowledged",
    accentColor: "#F97316", // Orange
    iconOverlay: "bell",
    title: "Order Unacknowledged",
    body: "Order #ORD-8490 is not acknowledged. Please take action immediately.",
    timestamp: "10m ago",
    orderId: "ORD-8490",
    actions: {
      type: "chevron",
    },
  },
  {
    id: "notif-4",
    type: "sla_warning",
    accentColor: "#EAB308", // Yellow / Gold
    iconOverlay: "clock",
    title: "5 min to pack 📦",
    body: "Order #ORD-8488 packing deadline approaching! Mark ready to avoid SLA breach.",
    timestamp: "10m ago",
    orderId: "ORD-8488",
    actions: {
      type: "chevron",
    },
  },
  {
    id: "notif-5",
    type: "rider_arrived",
    accentColor: "#10B981", // Teal / Green
    iconOverlay: "user",
    title: "Dispatch Rider Arrived",
    body: "Rohit Kumar arrived at your store for pickup of Order #ORD-8485.",
    timestamp: "10m ago",
    orderId: "ORD-8485",
    actions: {
      type: "chevron",
    },
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handleAccept = (item: NotificationItem) => {
    Alert.alert("Order Accepted", `Order #${item.orderId} accepted successfully! Inventory allocated.`);
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
  };

  const handleReject = (item: NotificationItem) => {
    Alert.alert("Order Rejected", `Order #${item.orderId} marked as out of stock.`);
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
  };

  const handleOpenOrder = (orderId: string) => {
    router.push({
      pathname: "/(vendor)/orders",
      params: { orderId },
    } as any);
  };

  const handleClearAll = () => {
    setNotifications([]);
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
            {notifications.length} high priority alerts
          </Text>
        </View>
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
              No pending high-alert notifications right now.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notifCard,
                { borderLeftColor: item.accentColor },
              ]}
            >
              {/* Card Top Row: App Icon + App Name + Badge + Timestamp */}
              <View style={styles.cardTopRow}>
                <View style={styles.iconWrapper}>
                  <Image
                    source={require("../../assets/intri-icon.png")}
                    style={styles.appIcon}
                    resizeMode="contain"
                  />
                  {/* Small icon overlay at bottom-right of app icon */}
                  {item.iconOverlay === "bell" && (
                    <View style={[styles.iconOverlayBadge, { backgroundColor: "#F97316" }]}>
                      <Bell size={8} color="#FFFFFF" />
                    </View>
                  )}
                  {item.iconOverlay === "clock" && (
                    <View style={[styles.iconOverlayBadge, { backgroundColor: "#EAB308" }]}>
                      <Clock size={8} color="#FFFFFF" />
                    </View>
                  )}
                  {item.iconOverlay === "user" && (
                    <View style={[styles.iconOverlayBadge, { backgroundColor: "#10B981" }]}>
                      <User size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.appNameContainer}>
                  <Text style={styles.appName}>IntriHub Business</Text>
                  {item.badge && (
                    <View style={styles.urgentBadge}>
                      <Text style={[styles.urgentBadgeText, { color: item.badge.color }]}>
                        {item.badge.icon} {item.badge.text}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* Card Content Row: Title + Body */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenOrder(item.orderId)}
                style={styles.cardBodyContainer}
              >
                <View style={{ flex: 1, paddingRight: item.actions?.type === "chevron" ? 8 : 0 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardBody}>{item.body}</Text>
                </View>

                {item.actions?.type === "chevron" && (
                  <View style={styles.chevronWrapper}>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                )}
              </TouchableOpacity>

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
                  onPress={() => handleOpenOrder(item.orderId)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.singleBtnText}>
                    {item.actions.primaryText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  clearBtn: {
    width: 38,
    height: 38,
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
    height: 38,
    backgroundColor: "#FEE2E2",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  acceptBtn: {
    flex: 1,
    height: 38,
    backgroundColor: "#10B981",
    borderRadius: 9,
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
    height: 38,
    backgroundColor: "#EFF6FF",
    borderRadius: 9,
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
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
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
    fontFamily: "PlusJakartaSans_400Regular",
  },
});
