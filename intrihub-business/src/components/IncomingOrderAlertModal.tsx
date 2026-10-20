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
import { Bell, X, Package } from "lucide-react-native";
import { useOrderAlertStore } from "../store/orderAlertStore";
import { updateVendorOrderStatus, rejectVendorOrder } from "../api/vendor";

export default function IncomingOrderAlertModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { alert, isOpen, isRinging, closeAlert, stopRinging } = useOrderAlertStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringingIntervalRef = useRef<any>(null);

  // Ringing / Haptics loop
  useEffect(() => {
    if (isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const triggerHaptic = () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      };
      triggerHaptic();
      ringingIntervalRef.current = setInterval(triggerHaptic, 1500);
    }

    return () => {
      if (ringingIntervalRef.current) {
        clearInterval(ringingIntervalRef.current);
        ringingIntervalRef.current = null;
      }
    };
  }, [isOpen]);

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
        pathname: "/(vendor)/order/[id]",
        params: { id: splitOrOrderId },
      } as any);
    } catch (err: any) {
      console.warn("Failed to accept order:", err);
      closeAlert();
      router.push({
        pathname: "/(vendor)/order/[id]",
        params: { id: alert.splitId || alert.orderId },
      } as any);
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

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={closeAlert}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeAlert}
        />

        {/* Bottom Sheet Card */}
        <View style={styles.sheetCard}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Close button (top right) */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeAlert}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Concentric Sound-Wave Glowing Bell Icon */}
          <View style={styles.bellOuterGlow}>
            <View style={styles.bellInnerGlow}>
              <Animated.View style={[styles.bellBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Bell size={28} color="#EA580C" fill="#F97316" />
              </Animated.View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title} numberOfLines={1}>
            New Order Received!
          </Text>
          <Text style={styles.orderIdSubtitle} numberOfLines={1}>
            Order #{alert.orderId}
          </Text>

          {/* Soft Cream Order Details Box */}
          <View style={styles.orderInfoBox}>
            <View style={styles.boxIconWrapper}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <View style={styles.boxTextContent}>
              <Text style={styles.boxItemsPrice} numberOfLines={1}>
                {alert.itemsCount || 12} items • ₹{(alert.totalAmount || 4850).toLocaleString("en-IN")}
              </Text>
              <Text style={styles.boxCustomerName} numberOfLines={1}>
                {alert.customerName || "Amit Verma"}
              </Text>
              <Text style={styles.boxCustomerAddress} numberOfLines={1}>
                {alert.warning || "HSR Layout, Bangalore"}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Reject & Accept Order */}
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#0066FF" style={{ marginVertical: 14 }} />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleReject}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                activeOpacity={0.88}
              >
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.55)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    position: "relative",
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  bellOuterGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bellInnerGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  orderIdSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 18,
  },
  orderInfoBox: {
    width: "100%",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  boxIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  boxTextContent: {
    flex: 1,
    gap: 2,
  },
  boxItemsPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  boxCustomerName: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  boxCustomerAddress: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "400",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
  acceptBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: "#0066FF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
