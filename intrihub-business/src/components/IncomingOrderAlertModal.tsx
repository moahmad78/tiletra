import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, AlertTriangle, X, PackageCheck, Ban } from "lucide-react-native";
import { useOrderAlertStore } from "../store/orderAlertStore";
import { updateVendorOrderStatus, rejectVendorOrder } from "../api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

export default function IncomingOrderAlertModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { alert, isOpen, isRinging, closeAlert, stopRinging } = useOrderAlertStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringingIntervalRef = useRef<any>(null);

  // Ringing / Haptics loop for manual approval required
  useEffect(() => {
    if (isOpen && isRinging) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous ringing haptic feedback pattern every 1.5 seconds
      const triggerHaptic = () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      };
      triggerHaptic();
      ringingIntervalRef.current = setInterval(triggerHaptic, 1500);
    } else if (isOpen && alert?.isAutoAccepted) {
      // Quick pleasant success chime/haptic for auto-accepted order
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Auto-dismiss auto-accept banner after 10s
      const timer = setTimeout(() => {
        closeAlert();
      }, 10000);
      return () => clearTimeout(timer);
    }

    return () => {
      if (ringingIntervalRef.current) {
        clearInterval(ringingIntervalRef.current);
        ringingIntervalRef.current = null;
      }
    };
  }, [isOpen, isRinging, alert?.isAutoAccepted]);

  if (!isOpen || !alert) return null;

  const handleAccept = async () => {
    stopRinging();
    setIsSubmitting(true);
    try {
      const splitOrOrderId = alert.splitId || alert.orderId;
      await updateVendorOrderStatus(splitOrOrderId, "confirmed");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      closeAlert();
      router.push({
        pathname: "/(vendor)/orders",
        params: { orderId: alert.orderId },
      } as any);
    } catch (err: any) {
      console.warn("Failed to accept order:", err);
      closeAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    stopRinging();
    setIsSubmitting(true);
    try {
      const splitOrOrderId = alert.splitId || alert.orderId;
      await rejectVendorOrder(splitOrOrderId, "insufficient_stock");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      closeAlert();
    } catch (err: any) {
      console.warn("Failed to reject order:", err);
      closeAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAutoAccepted = () => {
    closeAlert();
    router.push({
      pathname: "/(vendor)/orders",
      params: { orderId: alert.orderId },
    } as any);
  };

  // Case 1: AUTO-ACCEPTED SUCCESS VIEW
  if (alert.isAutoAccepted) {
    return (
      <Modal transparent visible={isOpen} animationType="slide">
        <View style={styles.overlayCenter}>
          <View style={styles.autoAcceptCard}>
            <View style={styles.successBadge}>
              <CheckCircle2 size={32} color="#10B981" />
            </View>

            <Text style={styles.autoAcceptTitle}>⚡ Order Auto-Accepted!</Text>
            <Text style={styles.autoAcceptSubtitle}>
              Sufficient inventory confirmed & allocated from stock.
            </Text>

            <View style={styles.orderSummaryBox}>
              <Text style={styles.summaryOrderId}>Order #{alert.orderId}</Text>
              {alert.totalAmount ? (
                <Text style={styles.summaryTotal}>₹{alert.totalAmount.toLocaleString("en-IN")}</Text>
              ) : null}
              {alert.customerName ? (
                <Text style={styles.summaryCustomer}>Customer: {alert.customerName}</Text>
              ) : null}
            </View>

            <Text style={styles.readyText}>Status: Ready to Pack 📦</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.viewBtn]}
                onPress={handleViewAutoAccepted}
                activeOpacity={0.85}
              >
                <PackageCheck size={18} color="#FFFFFF" />
                <Text style={styles.btnTextWhite}>View Order & Pack</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.dismissBtn]}
                onPress={closeAlert}
                activeOpacity={0.85}
              >
                <Text style={styles.btnTextDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Case 2: MANUAL FALLBACK RINGING ALERT (Stock Review Needed)
  return (
    <Modal transparent visible={isOpen} animationType="fade">
      <View style={styles.overlayDark}>
        <Animated.View style={[styles.ringingCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.ringingHeader}>
            <View style={styles.alertIconBadge}>
              <Bell size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.ringingTitle}>🔔 URGENT ORDER ALERT</Text>
              <Text style={styles.ringingSubtitle}>Manual Vendor Approval Required</Text>
            </View>
          </View>

          <View style={styles.warningBanner}>
            <AlertTriangle size={18} color="#D97706" />
            <Text style={styles.warningText}>
              {alert.warning || "Low stock or out-of-stock items detected in this order."}
            </Text>
          </View>

          <View style={styles.orderDetailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValueBold}>#{alert.orderId}</Text>
            </View>

            {alert.totalAmount ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={[styles.detailValueBold, { color: "#EA580C" }]}>
                  ₹{alert.totalAmount.toLocaleString("en-IN")}
                </Text>
              </View>
            ) : null}

            {alert.customerName ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{alert.customerName}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.promptText}>
            Can you fulfill this order from warehouse or supplier stock?
          </Text>

          {isSubmitting ? (
            <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.decisionRow}>
              <TouchableOpacity
                style={[styles.decisionBtn, styles.acceptBtn]}
                onPress={handleAccept}
                activeOpacity={0.85}
              >
                <PackageCheck size={20} color="#FFFFFF" />
                <Text style={styles.btnTextWhite}>ACCEPT ORDER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.decisionBtn, styles.rejectBtn]}
                onPress={handleReject}
                activeOpacity={0.85}
              >
                <Ban size={20} color="#EF4444" />
                <Text style={styles.btnTextReject}>REJECT</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayDark: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  autoAcceptCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    ...SHADOWS.lg,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  autoAcceptTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#065F46",
    marginBottom: 4,
    textAlign: "center",
  },
  autoAcceptSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  orderSummaryBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  summaryOrderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 2,
  },
  summaryCustomer: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
  },
  readyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewBtn: {
    backgroundColor: "#10B981",
  },
  dismissBtn: {
    backgroundColor: "#F3F4F6",
  },
  btnTextWhite: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  btnTextDismiss: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },

  // Ringing card styles
  ringingCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  ringingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  alertIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  ringingTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  ringingSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 8,
    marginBottom: SPACING.md,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  orderDetailCard: {
    backgroundColor: "#F9FAFB",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  promptText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  decisionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: "#16A34A",
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  btnTextReject: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
